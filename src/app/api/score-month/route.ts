import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const RUBRIC = `### Scoring rubric
 
| Criterion | Maximum | Evaluation question |
|---|---:|---|
| Innovation | 20 | Is the idea original or a meaningful improvement over the previous approach? |
| Business impact | 25 | Does it improve efficiency, accuracy, security, reliability, cost, or user experience? |
| Implementation | 20 | Was the idea actually implemented and completed? |
| Evidence and validation | 15 | Does the ticket document testing, results, scenarios, or measurable evidence? |
| Scalability | 10 | Can the solution be reused, extended, or applied across multiple processes or teams? |
| Clarity and ownership | 10 | Does the submission clearly explain the problem, actions, difficulties, and result? |
| **Total** | **100** |  |
 
### Scoring principles
 
- Score only the evidence written in the submission.
- Do not assume unreported savings, adoption, or production results.
- Give lower implementation scores to research-only or proposed ideas.
- Reward reusable solutions and prevention of recurring problems.
- Reward specific testing and measurable scope.
- Apply the same standard to every employee.
- Document why each score was awarded.
- Treat joint tickets consistently with the portal's submitted-by owner unless the award committee confirms shared ownership.`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');

    if (!monthParam) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
    }

    const [year, month] = monthParam.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    // Fetch submissions that don't have a score yet for this month
    const submissions = await prisma.submission.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        score: null
      },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
      }
    });

    if (submissions.length === 0) {
      return NextResponse.json({ message: 'No unscored submissions found for this month.', count: 0 });
    }

    let scoredCount = 0;
    let lastError = '';

    for (const sub of submissions) {
      const latestVersion = sub.versions[0];
      if (!latestVersion) {
        lastError = `Ticket ${sub.ticketNumber} has no versions.`;
        continue;
      }

      const submissionContent = `
Title: ${latestVersion.title}
Category: ${sub.category || 'None'}
Content: ${latestVersion.description}
`;
      
      const prompt = `You are an expert evaluator scoring a submission for an internal company awards program.
Evaluate the following submission using the exact rubric and principles provided.

${RUBRIC}

Here is the submission:
${submissionContent}

Evaluate the submission and provide the final score out of 100.
You must return your response as a JSON object containing exactly two fields:
- "reasoning": A brief explanation of how the score was calculated across criteria.
- "score": The final integer score out of 100.`;

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            }
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
        });

        const resultText = chatCompletion.choices[0]?.message?.content;
        
        if (resultText) {
          const parsed = JSON.parse(resultText);
          if (typeof parsed.score === 'number') {
            await prisma.submission.update({
              where: { id: sub.id },
              data: { score: parsed.score }
            });
            scoredCount++;
          }
        }
      } catch (err: any) {
        lastError = err.message || err.toString();
        console.error(`Failed to score submission ${sub.id}:`, err);
      }
    }

    if (scoredCount === 0 && lastError) {
      return NextResponse.json({ message: `Scored 0 submissions. Error: ${lastError}`, count: 0 });
    }
    return NextResponse.json({ message: `Successfully scored ${scoredCount} submissions.`, count: scoredCount });
  } catch (error) {
    console.error('Scoring error:', error);
    return NextResponse.json({ error: 'Failed to process scoring' }, { status: 500 });
  }
}
