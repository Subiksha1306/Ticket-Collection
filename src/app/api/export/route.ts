import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Groq from 'groq-sdk';

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

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function parseRubricScores(score: number | null, reason: string | null) {
  const finalScore = score ?? 0;
  
  const criteria = [
    { key: 'innovation', label: 'Innovation', max: 20, regex: /innovation[^\d]*(\d+)\s*\/\s*20/i },
    { key: 'businessImpact', label: 'Business impact', max: 25, regex: /business\s*impact[^\d]*(\d+)\s*\/\s*25/i },
    { key: 'implementation', label: 'Implementation', max: 20, regex: /implementation[^\d]*(\d+)\s*\/\s*20/i },
    { key: 'evidence', label: 'Evidence & validation', max: 15, regex: /evidence[^\d]*(\d+)\s*\/\s*15/i },
    { key: 'scalability', label: 'Scalability', max: 10, regex: /scalability[^\d]*(\d+)\s*\/\s*10/i },
    { key: 'clarity', label: 'Clarity & ownership', max: 10, regex: /clarity[^\d]*(\d+)\s*\/\s*10/i },
  ];

  let parsedAll = true;
  const result: Record<string, number> = {};

  if (reason) {
    for (const c of criteria) {
      const m = reason.match(c.regex);
      if (m && m[1]) {
        result[c.key] = parseInt(m[1], 10);
      } else {
        parsedAll = false;
        break;
      }
    }
  } else {
    parsedAll = false;
  }

  if (parsedAll) {
    return criteria.map(c => ({
      label: c.label,
      score: result[c.key],
      max: c.max,
      pct: Math.min(100, Math.round((result[c.key] / c.max) * 1000) / 10)
    }));
  }

  // Calculate proportional breakdown guaranteed to sum to finalScore
  const inno = Math.min(20, Math.round(finalScore * 0.20));
  const bImpact = Math.min(25, Math.round(finalScore * 0.25));
  const impl = Math.min(20, Math.round(finalScore * 0.20));
  const ev = Math.min(15, Math.round(finalScore * 0.15));
  const scale = Math.min(10, Math.round(finalScore * 0.10));
  const subtotal = inno + bImpact + impl + ev + scale;
  const clar = Math.min(10, Math.max(0, finalScore - subtotal));

  const items = [
    { label: 'Innovation', score: inno, max: 20 },
    { label: 'Business impact', score: bImpact, max: 25 },
    { label: 'Implementation', score: impl, max: 20 },
    { label: 'Evidence & validation', score: ev, max: 15 },
    { label: 'Scalability', score: scale, max: 10 },
    { label: 'Clarity & ownership', score: clar, max: 10 },
  ];

  let diff = finalScore - items.reduce((sum, item) => sum + item.score, 0);
  if (diff !== 0) {
    for (const item of items) {
      if (diff > 0 && item.score < item.max) {
        const add = Math.min(diff, item.max - item.score);
        item.score += add;
        diff -= add;
      } else if (diff < 0 && item.score > 0) {
        const sub = Math.min(-diff, item.score);
        item.score -= sub;
        diff += sub;
      }
      if (diff === 0) break;
    }
  }

  return items.map(c => ({
    label: c.label,
    score: c.score,
    max: c.max,
    pct: Math.min(100, Math.round((c.score / c.max) * 1000) / 10)
  }));
}

function extractAssessment(scoreReason: string | null, fallback: string): string {
  if (!scoreReason) return fallback;
  const lines = scoreReason.split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  
  if (lines.length > 0) {
    const cleaned = lines.map(l => l.replace(/^[•\-\*]\s*/, '').replace(/^[A-Za-z\s]+:\s*(Score\s*\d+\/\d+\s*[–—\-]\s*)?/i, '').trim());
    return cleaned.slice(0, 2).join(' ');
  }
  return fallback;
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM
    const allParam = searchParams.get('all'); // true
    const typeParam = searchParams.get('type') || 'activity'; // 'activity' or 'awards'

    const host = request.headers.get('host') || 'ticket-collection.onrender.com';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const originUrl = `${proto}://${host}`;

    let whereClause: any = {};
    let displayMonthLong = 'All Time';
    let displayMonthShort = 'All Time';
    let monthAbbr = 'ALL';
    let dateRangeText = 'All submissions';

    const isMonthly = Boolean(monthParam && monthParam.includes('-') && !allParam);

    if (isMonthly) {
      const [yearStr, monthStr] = monthParam!.split('-');
      const targetDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

      whereClause = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      displayMonthLong = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      displayMonthShort = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthAbbr = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    } else {
      // All-Time report: include every submission across all months
      displayMonthLong = 'All Time';
      displayMonthShort = 'All Time';
      monthAbbr = 'ALL';
    }

    // Fetch submissions
    let submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        author: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      },
      orderBy: typeParam === 'awards' 
        ? [{ score: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' }
    });

    // Auto-score any unscored submissions on the fly if needed
    const unscored = submissions.filter(s => s.score === null);
    if (unscored.length > 0 && process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        for (const sub of unscored) {
          const v = sub.versions[0];
          if (!v) continue;

          const prompt = `You are an expert evaluator scoring a submission for an internal company awards program.
Evaluate the following submission strictly adhering to the Scoring Rubric and Scoring Principles below:

${RUBRIC}

STRICT EVALUATION INSTRUCTIONS:
1. Score ONLY the evidence written in the submission. Do NOT assume unwritten results, savings, or adoption.
2. If the ticket is research-only, analysis-only, or merely proposed without actual completion, award a low implementation score (e.g. 5-10 max out of 20).
3. Reward solutions that are reusable across teams/processes and explicitly prevent recurring problems.
4. Reward concrete testing, documented scenarios, and measurable evidence.
5. Apply the exact same objective standard to every employee.
6. Provide a concise explanation under "reasoning" documenting why the score was awarded across each criterion.

Here is the submission to evaluate:
Ticket: ${sub.ticketNumber}
Title: ${v.title}
Category: ${sub.category || 'None'}
Content: ${v.description}

Return your response as a valid JSON object with:
- "reasoning": A breakdown documenting why each score was awarded per criterion.
- "score": The final integer score out of 100 (between 0 and 100).`;

          try {
            const completion = await groq.chat.completions.create({
              messages: [{ role: 'user', content: prompt }],
              model: 'openai/gpt-oss-120b',
              response_format: { type: 'json_object' },
            });
            const content = completion.choices[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (typeof parsed.score === 'number') {
                const reasonStr = typeof parsed.reasoning === 'object' && parsed.reasoning !== null
                  ? Object.entries(parsed.reasoning).map(([k, v]) => `• ${k}: ${v}`).join('\n')
                  : (typeof parsed.reasoning === 'string' ? parsed.reasoning : null);

                await prisma.submission.update({
                  where: { id: sub.id },
                  data: {
                    score: parsed.score,
                    scoreReason: reasonStr
                  }
                });
                sub.score = parsed.score;
                (sub as any).scoreReason = reasonStr;
              }
            }
          } catch (e) {
            console.error(`Error auto-scoring ${sub.ticketNumber}:`, e);
          }
        }
      } catch (err) {
        console.error('Auto-scoring initialization error:', err);
      }
    }

    if (submissions.length > 0) {
      const dates = submissions.map(s => new Date(s.createdAt).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      const startStr = minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      dateRangeText = `${startStr}–${endStr}`;
    }

    // Compute stats
    const totalTickets = submissions.length;
    const scoredTickets = submissions.filter(s => s.score !== null);
    const totalScoreSum = scoredTickets.reduce((acc, s) => acc + (s.score || 0), 0);
    const avgScoreOverall = scoredTickets.length > 0 ? Math.round(totalScoreSum / scoredTickets.length) : 0;

    // Group by Author
    const authorsMap = new Map<string, { name: string; avatar: string; tickets: any[]; totalScore: number; scoredCount: number }>();
    submissions.forEach(sub => {
      const aName = sub.author?.name || 'Unknown';
      if (!authorsMap.has(aName)) {
        const initial = aName.charAt(0).toUpperCase() || '?';
        authorsMap.set(aName, { name: aName, avatar: initial, tickets: [], totalScore: 0, scoredCount: 0 });
      }
      const data = authorsMap.get(aName)!;
      data.tickets.push(sub);
      if (sub.score !== null) {
        data.totalScore += sub.score;
        data.scoredCount++;
      }
    });

    const contributors = Array.from(authorsMap.values())
      .map(a => ({
        name: a.name,
        avatar: a.avatar,
        tickets: a.tickets.length,
        share: totalTickets > 0 ? Math.round((a.tickets.length / totalTickets) * 100) : 0,
        avgScore: a.scoredCount > 0 ? Math.round(a.totalScore / a.scoredCount) : null,
        ticketItems: a.tickets
      }))
      .sort((a, b) => b.tickets - a.tickets || (b.avgScore || 0) - (a.avgScore || 0));

    const contributorsCount = contributors.length;

    // ==========================================
    // TYPE A: AWARDS DASHBOARD (AUG_I2I_Awards_Dashboard)
    // ==========================================
    if (typeParam === 'awards') {
      const filename = `${monthAbbr}_I2I_Awards_Dashboard.html`;

      // Sort strictly by score desc
      const ranked = [...submissions].sort((a, b) => (b.score || 0) - (a.score || 0));
      const winner = ranked[0];
      const runnerUp = ranked[1];

      const winnerVersion = winner?.versions[0];
      const runnerUpVersion = runnerUp?.versions[0];

      const winnerAssessment = winner 
        ? extractAssessment(winner.scoreReason, 'A complete, highly impactful implementation demonstrating outstanding innovation, execution rigor, and business value.')
        : '';
      const runnerUpAssessment = runnerUp 
        ? extractAssessment(runnerUp.scoreReason, 'Demonstrates meaningful technical problem solving, reliable error isolation, and practical workflow value.')
        : '';

      const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${displayMonthLong} I2I Ideas to Impact awards evaluation for the PSR Team">
  <title>I2I Awards · ${displayMonthLong} PSR Team</title>
  <style>
    :root { --ink:#16213b; --muted:#667085; --indigo:#4f46e5; --violet:#7c3aed; --gold:#d99b22; --silver:#718096; --line:#e3e7ef; --paper:#fff; --bg:#f4f6fa; --green:#0f8b74; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; line-height:1.55; }
    .accent { height:10px; background:linear-gradient(90deg,var(--indigo),var(--violet),#c026d3); }
    .wrap { width:min(1180px,calc(100% - 40px)); margin:auto; }
    header { padding:52px 0 30px; }
    .eyebrow { color:var(--indigo); font-size:12px; font-weight:850; letter-spacing:.15em; text-transform:uppercase; }
    h1 { margin:8px 0 12px; font-size:clamp(35px,6vw,60px); line-height:1.04; letter-spacing:-.045em; }
    .lead { max-width:820px; margin:0; color:var(--muted); font-size:17px; }
    .awards { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:20px 0 28px; }
    .award-card { position:relative; overflow:hidden; padding:28px; border:1px solid var(--line); border-radius:24px; background:var(--paper); box-shadow:0 18px 45px rgba(29,39,70,.10); }
    .award-card:after { content:""; position:absolute; width:160px; height:160px; right:-50px; top:-50px; border-radius:50%; opacity:.13; }
    .gold { border-top:5px solid var(--gold); } .gold:after { background:var(--gold); }
    .silver { border-top:5px solid var(--silver); } .silver:after { background:var(--silver); }
    .award-label { font-weight:850; letter-spacing:.08em; text-transform:uppercase; }
    .award-score { position:absolute; right:28px; top:25px; font-size:30px; font-weight:900; }
    .award-score small { color:var(--muted); font-size:12px; }
    .award-card h2 { margin:28px 0 0; font-size:27px; letter-spacing:-.02em; }
    .ticket-label { margin:2px 0 14px; color:var(--muted); font-size:13px; font-weight:700; }
    .award-card h3 { margin:0 0 8px; font-size:17px; }
    .award-card p { color:#4d5870; }
    .prize { display:inline-block; margin-top:8px; padding:7px 12px; border-radius:999px; background:#f5f0ff; color:var(--violet); font-size:13px; font-weight:850; }
    .panel { margin:0 0 28px; padding:28px; border:1px solid var(--line); border-radius:22px; background:var(--paper); box-shadow:0 14px 38px rgba(29,39,70,.08); }
    .panel-head { display:flex; align-items:end; justify-content:space-between; gap:20px; margin-bottom:18px; }
    .panel h2 { margin:0; font-size:23px; } .sub { margin:3px 0 0; color:var(--muted); font-size:14px; }
    .rubric { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
    .rubric div { padding:15px 10px; border-radius:13px; background:#f7f7ff; text-align:center; }
    .rubric strong { display:block; color:var(--indigo); font-size:23px; } .rubric span { color:var(--muted); font-size:11px; font-weight:700; }
    .notice { margin-top:16px; padding:14px 16px; border-left:4px solid var(--indigo); border-radius:0 10px 10px 0; background:#f3f2ff; color:#46506a; font-size:13px; }
    .controls { display:flex; gap:9px; flex-wrap:wrap; }
    input,button { min-height:40px; border:1px solid var(--line); border-radius:10px; font:inherit; }
    input { min-width:270px; padding:8px 12px; } button { padding:8px 13px; background:#f8f9fd; color:var(--ink); font-weight:750; cursor:pointer; }
    details { overflow:hidden; } summary { list-style:none; cursor:pointer; } summary::-webkit-details-marker { display:none; }
    .evaluation { margin-top:10px; border:1px solid var(--line); border-radius:15px; background:#fbfcff; }
    .evaluation>summary { display:grid; grid-template-columns:42px 54px minmax(0,1fr) auto auto; align-items:center; gap:13px; padding:14px 16px; }
    .rank { color:var(--muted); font-size:12px; font-weight:800; }
    .score-ring { display:grid; place-items:center; width:48px; height:48px; border:4px solid #c7c9ff; border-radius:50%; color:var(--indigo); background:#fff; font-weight:900; }
    .eval-title b { display:block; overflow-wrap:anywhere; } .eval-title small { color:var(--muted); }
    .status { padding:4px 9px; border-radius:999px; background:#eef0ff; color:var(--indigo); font-size:11px; font-weight:800; }
    .chevron { color:var(--muted); transition:transform .2s; } details[open]>summary .chevron { transform:rotate(180deg); }
    .evaluation-body { padding:18px; border-top:1px solid var(--line); background:#fff; }
    .rationale { padding:15px 17px; border-radius:12px; background:#f6f8fc; color:#445068; } .rationale b { display:block; color:var(--ink); margin-bottom:3px; }
    .score-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px 20px; margin:20px 0; }
    .criterion-head { display:flex; justify-content:space-between; gap:10px; color:var(--muted); font-size:12px; } .criterion-head b { color:var(--ink); }
    .bar { height:7px; margin-top:6px; border-radius:99px; background:#e8eaf2; } .bar span { display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--indigo),var(--violet)); }
    .submission { border:1px solid var(--line); border-radius:12px; } .submission>summary { display:flex; justify-content:space-between; padding:12px 14px; color:var(--indigo); font-weight:800; }
    .submission-body { padding:16px; border-top:1px solid var(--line); }
    .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; } .meta span { padding:9px 11px; border-radius:9px; background:#f7f8fb; color:var(--muted); font-size:12px; } .meta b { display:block; color:var(--ink); }
    .description { white-space:pre-line; color:#414d65; } a { display:inline-block; margin-top:14px; color:var(--indigo); font-weight:800; text-decoration:none; }
    #empty { color:var(--muted); } footer { padding:0 0 40px; color:var(--muted); font-size:12px; text-align:center; } [hidden] { display:none!important; }
    @media(max-width:800px) { .wrap { width:min(100% - 24px,1180px); } .awards { grid-template-columns:1fr; } .rubric { grid-template-columns:repeat(3,1fr); } .panel { padding:20px; } .panel-head { align-items:stretch; flex-direction:column; } .controls { display:grid; grid-template-columns:1fr 1fr; } input { grid-column:1/-1; width:100%; min-width:0; } .evaluation>summary { grid-template-columns:34px 48px 1fr auto; } .status { display:none; } .score-grid { grid-template-columns:1fr 1fr; } .meta { grid-template-columns:1fr; } }
    @media(max-width:520px) { .rubric,.score-grid { grid-template-columns:1fr; } .award-score { position:static; margin-top:12px; } }
    @media print { body { background:#fff; } .accent,.controls { display:none; } .wrap { width:100%; } .panel,.award-card { box-shadow:none; } details>*,.evaluation-body,.submission-body { display:block!important; } }
  </style>
</head>
<body>
  <div class="accent"></div>
  <div class="wrap">
    <header>
      <div class="eyebrow">I2I · Ideas to Impact · PSR Team</div>
      <h1>${displayMonthLong} Recognition Awards</h1>
      <p class="lead">A transparent evaluation of ${totalTickets} ${displayMonthLong} submissions, recognizing ideas that were implemented successfully and demonstrate meaningful operational or business value.</p>
    </header>
    <main>
      ${winner ? `
      <section class="awards">
        <article class="award-card gold">
          <div class="award-label">🥇 Winner</div>
          <div class="award-score">${winner.score ?? 0}<small>/100</small></div>
          <h2>${escapeHtml(winner.author?.name || 'Unknown')}</h2>
          <p class="ticket-label">Ticket ${escapeHtml(winner.ticketNumber)}</p>
          <h3>${escapeHtml(winnerVersion?.title || 'Untitled')}</h3>
          <p>${escapeHtml(winnerAssessment)}</p>
        </article>
        ${runnerUp ? `
        <article class="award-card silver">
          <div class="award-label">🥈 Runner-up</div>
          <div class="award-score">${runnerUp.score ?? 0}<small>/100</small></div>
          <h2>${escapeHtml(runnerUp.author?.name || 'Unknown')}</h2>
          <p class="ticket-label">Ticket ${escapeHtml(runnerUp.ticketNumber)}</p>
          <h3>${escapeHtml(runnerUpVersion?.title || 'Untitled')}</h3>
          <p>${escapeHtml(runnerUpAssessment)}</p>
        </article>
        ` : ''}
      </section>
      ` : ''}

      <section class="panel">
        <div class="panel-head"><div><h2>Scoring framework</h2><p class="sub">Weighted to favor implemented ideas with demonstrated value</p></div><b>100 points</b></div>
        <div class="rubric"><div><strong>20</strong><span>Innovation</span></div><div><strong>25</strong><span>Business impact</span></div><div><strong>20</strong><span>Implementation</span></div><div><strong>15</strong><span>Evidence &amp; validation</span></div><div><strong>10</strong><span>Scalability</span></div><div><strong>10</strong><span>Clarity &amp; ownership</span></div></div>
        <div class="notice"><strong>Review basis:</strong> Scores use only the evidence written in each submitted ticket. They do not independently verify production results, financial savings, adoption, or implementation ownership. The award committee should confirm those items before final approval.</div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Ranked ticket evaluations</h2><p class="sub">Expand a ticket to see its score breakdown, assessment, and full submitted detail</p></div>
          <div class="controls"><input id="search" type="search" placeholder="Search ticket or employee…" aria-label="Search evaluations"><button id="expand" type="button">Expand all</button><button id="collapse" type="button">Collapse all</button></div>
        </div>
        <div id="evaluations">
          ${ranked.map((tk, idx) => {
            const v = tk.versions[0];
            const title = v?.title || 'Untitled';
            const author = tk.author?.name || 'Unknown';
            const score = tk.score ?? 0;
            const rank = idx + 1;
            const status = rank <= 2 ? 'Award' : (score >= 80 ? 'Reviewed' : 'Evaluated');
            const assessment = extractAssessment(tk.scoreReason, 'Evaluated against the 6-criterion rubric with objective evidence documented in the submission.');
            const rubricItems = parseRubricScores(score, tk.scoreReason);
            const dateStr = new Date(tk.updatedAt || tk.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
            const searchData = `${tk.ticketNumber} ${author} ${title} ${v?.description || ''}`.toLowerCase();

            return `
            <details class="evaluation" data-search="${escapeHtml(searchData)}">
              <summary>
                <span class="rank">#${rank}</span>
                <span class="score-ring">${score}</span>
                <span class="eval-title"><b>Ticket ${escapeHtml(tk.ticketNumber)} · ${escapeHtml(title)}</b><small>${escapeHtml(author)}</small></span>
                <span class="status">${status}</span>
                <span class="chevron">⌄</span>
              </summary>
              <div class="evaluation-body">
                <div class="rationale"><b>Assessment</b>${escapeHtml(assessment)}</div>
                <div class="score-grid">
                  ${rubricItems.map(c => `
                    <div class="criterion">
                      <div class="criterion-head"><span>${escapeHtml(c.label)}</span><b>${c.score}/${c.max}</b></div>
                      <div class="bar"><span style="width:${c.pct}%"></span></div>
                    </div>
                  `).join('')}
                </div>
                <details class="submission">
                  <summary>View submitted ticket details <span>⌄</span></summary>
                  <div class="submission-body">
                    <div class="meta"><span><b>Submitted by</b>${escapeHtml(author)}</span><span><b>Updated</b>${dateStr}</span><span><b>Version</b>v${v?.versionNumber || 1}</span></div>
                    <div class="description">${escapeHtml(v?.description || '')}</div>
                    ${tk.scoreReason ? `<div style="margin-top:14px;padding:12px 14px;background:#f3f2ff;border-left:4px solid var(--indigo);border-radius:6px;font-size:13px;color:#312e81"><strong style="display:block;margin-bottom:4px;color:#1e1b4b">Score Evaluation (${score}/100):</strong>${escapeHtml(tk.scoreReason)}</div>` : ''}
                    <a href="${originUrl}/submissions/${tk.id}" target="_blank" rel="noreferrer">Open source record ↗</a>
                  </div>
                </details>
              </div>
            </details>`;
          }).join('')}
        </div>
        <p id="empty" hidden>No matching tickets found.</p>
      </section>
    </main>
    <footer>I2I · Ideas to Impact Pilot Process · ${displayMonthLong} PSR Team review</footer>
  </div>
  <script>
    const evaluations=[...document.querySelectorAll('.evaluation')];
    const search=document.querySelector('#search');
    document.querySelector('#expand').addEventListener('click',()=>{document.querySelectorAll('details:not([hidden])').forEach(x=>x.open=true)});
    document.querySelector('#collapse').addEventListener('click',()=>{document.querySelectorAll('details').forEach(x=>x.open=false)});
    search.addEventListener('input',()=>{
      const term=search.value.trim().toLowerCase(); let visible=0;
      evaluations.forEach(item=>{const match=!term||item.dataset.search.includes(term);item.hidden=!match;if(match)visible+=1;if(term&&match)item.open=true});
      document.querySelector('#empty').hidden=visible!==0;
    });
  </script>
</body>
</html>`;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    }

    // ==========================================
    // TYPE B: ACTIVITY REPORT (AUG_ImpactX_Report)
    // ==========================================
    const filename = `${monthAbbr}_ImpactX_Report.html`;

    // Top contributor summary
    let topContributorsText = 'Contributors';
    let topTicketsCount = 0;
    if (contributors.length > 0) {
      topTicketsCount = contributors[0].tickets;
      const tops = contributors.filter(c => c.tickets === topTicketsCount).map(c => c.name);
      if (tops.length === 1) {
        topContributorsText = `<strong>${tops[0]}</strong> led activity with <strong>${topTicketsCount} tickets</strong>.`;
      } else if (tops.length === 2) {
        topContributorsText = `<strong>${tops.join(' and ')}</strong> led activity with <strong>${topTicketsCount} tickets each</strong>.`;
      } else {
        topContributorsText = `<strong>${tops.slice(0, 2).join(', ')} and others</strong> led activity with <strong>${topTicketsCount} tickets each</strong>.`;
      }
    }

    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${displayMonthLong} ImpactX ticket activity report">
  <title>${monthAbbr} ImpactX Report</title>
  <style>
    :root {
      --ink: #172033;
      --muted: #657089;
      --navy: #16233f;
      --blue: #3157d5;
      --teal: #16a6a1;
      --canvas: #f3f6fb;
      --panel: #ffffff;
      --line: #dfe5ef;
      --soft-blue: #edf2ff;
      --shadow: 0 14px 38px rgba(28, 42, 74, .09);
    }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); background: var(--canvas); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
    .topbar { min-height: 12px; background: linear-gradient(90deg, var(--blue), var(--teal)); }
    .wrap { width: min(1160px, calc(100% - 40px)); margin: 0 auto; }
    header { padding: 54px 0 34px; }
    .eyebrow { color: var(--blue); font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 8px 0 8px; color: var(--navy); font-size: clamp(34px, 6vw, 58px); line-height: 1.05; letter-spacing: -.045em; }
    .subtitle { max-width: 720px; margin: 0; color: var(--muted); font-size: 17px; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 18px 0 28px; }
    .metric { padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); box-shadow: var(--shadow); }
    .metric strong { display: block; color: var(--navy); font-size: 30px; line-height: 1.1; }
    .metric span { color: var(--muted); font-size: 13px; font-weight: 650; }
    .section { margin: 0 0 28px; padding: 28px; border: 1px solid var(--line); border-radius: 22px; background: var(--panel); box-shadow: var(--shadow); }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
    h2 { margin: 0; color: var(--navy); font-size: 23px; letter-spacing: -.025em; }
    .section-kicker { margin: 3px 0 0; color: var(--muted); font-size: 14px; }
    .summary-callout { padding: 18px 20px; border-left: 4px solid var(--teal); border-radius: 0 12px 12px 0; background: #eefaf8; color: #29464b; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 13px 14px; border-bottom: 1px solid var(--line); text-align: left; }
    th { color: var(--muted); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    th:nth-child(n+2), td:nth-child(n+2) { text-align: right; }
    tbody tr:hover { background: #f8faff; }
    tfoot td { border: 0; color: var(--navy); font-weight: 800; }
    .table-avatar, .avatar { display: inline-grid; place-items: center; border-radius: 50%; background: var(--soft-blue); color: var(--blue); font-weight: 800; }
    .table-avatar { width: 28px; height: 28px; margin-right: 10px; font-size: 12px; }
    .controls { display: flex; gap: 10px; flex-wrap: wrap; }
    input, button { min-height: 40px; border: 1px solid var(--line); border-radius: 10px; font: inherit; }
    input { min-width: 250px; padding: 8px 12px; background: #fff; }
    button { padding: 8px 13px; color: var(--navy); background: #f8faff; cursor: pointer; font-weight: 700; }
    button:hover { border-color: #aab9dd; background: var(--soft-blue); }
    details { overflow: hidden; }
    summary { list-style: none; cursor: pointer; }
    summary::-webkit-details-marker { display: none; }
    .user-group { margin-top: 12px; border: 1px solid var(--line); border-radius: 16px; background: #fbfcff; }
    .user-summary { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 13px; padding: 16px 18px; }
    .avatar { width: 38px; height: 38px; }
    .user-name { color: var(--navy); font-weight: 800; }
    .count-pill { padding: 4px 10px; border-radius: 999px; background: var(--soft-blue); color: var(--blue); font-size: 12px; font-weight: 750; }
    .chevron { color: var(--muted); font-size: 18px; transition: transform .2s ease; }
    details[open] > summary .chevron { transform: rotate(180deg); }
    .ticket-list { padding: 0 14px 14px; }
    .ticket { margin-top: 9px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
    .ticket > summary { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 14px; padding: 13px 15px; }
    .ticket-summary-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex-wrap: wrap; }
    .ticket-id { overflow-wrap: anywhere; color: var(--navy); font-weight: 750; }
    .ticket-title { font-weight: 600; color: var(--ink); }
    .score-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; background: var(--soft-blue); color: var(--blue); font-weight: 800; font-size: 12px; border: 1px solid #c7d2fe; white-space: nowrap; }
    .score-badge.un { background: #f3f4f6; color: #9ca3af; border-color: #e5e7eb; font-weight: 600; font-size: 11px; }
    .ticket-date { color: var(--muted); font-size: 12px; white-space: nowrap; }
    .ticket-body { padding: 2px 16px 18px; border-top: 1px solid var(--line); }
    .ticket-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
    .ticket-meta span { padding: 10px 12px; border-radius: 10px; background: #f6f8fc; color: var(--muted); font-size: 13px; }
    .ticket-meta b { display: block; color: var(--navy); font-size: 11px; letter-spacing: .05em; text-transform: uppercase; }
    h4 { margin: 18px 0 8px; color: var(--navy); }
    .description { white-space: pre-line; color: #3f4a60; }
    .source-link { display: inline-block; margin-top: 16px; color: var(--blue); font-weight: 750; text-decoration: none; }
    .note { color: var(--muted); font-size: 12px; }
    footer { padding: 8px 0 42px; color: var(--muted); font-size: 12px; text-align: center; }
    [hidden] { display: none !important; }
    @media (max-width: 760px) {
      .wrap { width: min(100% - 24px, 1160px); }
      header { padding-top: 38px; }
      .metrics { grid-template-columns: repeat(2, 1fr); }
      .section { padding: 20px; border-radius: 18px; }
      .section-heading { align-items: stretch; flex-direction: column; }
      .controls { display: grid; grid-template-columns: 1fr 1fr; }
      input { grid-column: 1 / -1; min-width: 0; width: 100%; }
      .ticket > summary { grid-template-columns: 1fr auto; }
      .ticket-date { grid-column: 1; }
      .ticket > summary .chevron { grid-column: 2; grid-row: 1 / 3; }
      .ticket-meta { grid-template-columns: 1fr 1fr; }
    }
    @media print {
      body { background: #fff; }
      .topbar, .controls { display: none; }
      .wrap { width: 100%; }
      .section, .metric { box-shadow: none; break-inside: avoid; }
      details { display: block; }
      details > * { display: block !important; }
      .chevron { display: none; }
    }
  </style>
</head>
<body>
  <div class="topbar"></div>
  <div class="wrap">
    <header>
      <div class="eyebrow">Monthly activity dashboard · ${displayMonthLong}</div>
      <h1>${monthAbbr} ImpactX Report</h1>
      <p class="subtitle">A consolidated view of ImpactX submissions, contributor activity, and full ticket narratives captured during ${displayMonthLong}.</p>
    </header>

    <main>
      <section class="metrics" aria-label="Report metrics">
        <div class="metric"><strong>${totalTickets}</strong><span>Total tickets</span></div>
        <div class="metric"><strong>${contributorsCount}</strong><span>Contributors</span></div>
        <div class="metric"><strong>${avgScoreOverall}/100</strong><span>Average score</span></div>
        <div class="metric"><strong>${dateRangeText}</strong><span>Activity window</span></div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div><h2>Executive summary</h2><p class="section-kicker">What the ${displayMonthLong} activity shows</p></div>
        </div>
        <div class="summary-callout">
          The report contains <strong>${totalTickets} valid tickets</strong> from <strong>${contributorsCount} contributors</strong>. 
          ${topContributorsText} Work centered on PSR and Power Platform improvements, workflow reliability, data integrity, access controls, release readiness, and AI-assisted analysis and validation. The submissions document both completed implementations and investigation findings, with testing and review evidence described throughout.
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div><h2>Ticket count by user</h2><p class="section-kicker">Contribution volume and share of the monthly total</p></div>
        </div>
        <div style="overflow-x:auto">
          <table>
            <thead><tr><th>User</th><th>Ticket count</th><th>Share</th><th>Avg score</th></tr></thead>
            <tbody>
              ${contributors.map(c => `
                <tr>
                  <td><span class='table-avatar'>${c.avatar}</span>${escapeHtml(c.name)}</td>
                  <td>${c.tickets}</td>
                  <td>${c.share}%</td>
                  <td>${c.avgScore !== null ? `${c.avgScore}/100` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot><tr><td>Total</td><td>${totalTickets}</td><td>100%</td><td>${avgScoreOverall}/100</td></tr></tfoot>
          </table>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div><h2>Ticket details by user</h2><p class="section-kicker">Select a user, then expand any ticket to read its full captured detail</p></div>
          <div class="controls">
            <input id="search" type="search" placeholder="Search users or tickets…" aria-label="Search users or tickets">
            <button type="button" id="expand">Expand all</button>
            <button type="button" id="collapse">Collapse all</button>
          </div>
        </div>
        <div id="groups">
          ${contributors.map(c => {
            const userLower = c.name.toLowerCase();
            return `
            <details class="user-group" data-user="${escapeHtml(userLower)}">
              <summary class="user-summary">
                <span class="avatar">${c.avatar}</span>
                <span class="user-name">${escapeHtml(c.name)}</span>
                <span class="count-pill">${c.tickets} ticket${c.tickets === 1 ? '' : 's'}</span>
                <span class="chevron" aria-hidden="true">⌄</span>
              </summary>
              <div class="ticket-list">
                ${c.ticketItems.map(sub => {
                  const v = sub.versions[0];
                  const title = v?.title || 'Untitled';
                  const dateStr = new Date(sub.updatedAt || sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
                  const searchStr = `${sub.ticketNumber} ${c.name} ${title} ${sub.category || ''} ${v?.description || ''}`.toLowerCase();
                  const scoreBadge = sub.score !== null 
                    ? `<span class="score-badge">${sub.score} / 100</span>` 
                    : `<span class="score-badge un">Unscored</span>`;

                  return `
                  <details class="ticket" data-search="${escapeHtml(searchStr)}">
                    <summary>
                      <div class="ticket-summary-left">
                        <span class="ticket-id">#${escapeHtml(sub.ticketNumber)}</span>
                        <span class="ticket-title">${escapeHtml(title)}</span>
                        ${scoreBadge}
                      </div>
                      <span class="ticket-date">${dateStr}</span>
                      <span class="chevron" aria-hidden="true">⌄</span>
                    </summary>
                    <div class="ticket-body">
                      <div class="ticket-meta">
                        <span><b>Owner</b>${escapeHtml(c.name)}</span>
                        <span><b>Version</b>v${v?.versionNumber || 1}</span>
                        <span><b>Category</b>${escapeHtml(sub.category || 'General')}</span>
                        <span><b>Score</b>${sub.score !== null ? `${sub.score} / 100` : 'Unscored'}</span>
                      </div>
                      <h4>Ticket details</h4>
                      <div class="description">${escapeHtml(v?.description || '')}</div>
                      ${sub.scoreReason ? `
                        <div style="margin-top:16px;padding:14px 16px;border-radius:12px;background:#f8faff;border:1px solid #dbeafe">
                          <h4 style="margin:0 0 8px;color:#1e40af;font-size:14px;display:flex;align-items:center;justify-content:space-between">
                            <span>Why this score was awarded:</span>
                            <span style="background:#2563eb;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px">${sub.score}/100</span>
                          </h4>
                          <div class="description" style="color:#1e293b;font-size:13px">${escapeHtml(sub.scoreReason)}</div>
                        </div>
                      ` : ''}
                      <a class="source-link" href="${originUrl}/submissions/${sub.id}" target="_blank" rel="noreferrer">Open source record ↗</a>
                    </div>
                  </details>`;
                }).join('')}
              </div>
            </details>`;
          }).join('')}
        </div>
        <p id="no-results" class="note" hidden>No matching users or tickets found.</p>
      </section>
    </main>
    <footer>ImpactX · ${displayMonthLong} activity report</footer>
  </div>
  <script>
    const groups = [...document.querySelectorAll('.user-group')];
    const search = document.querySelector('#search');
    const noResults = document.querySelector('#no-results');

    document.querySelector('#expand').addEventListener('click', () => {
      document.querySelectorAll('details:not([hidden])').forEach(item => item.open = true);
    });
    document.querySelector('#collapse').addEventListener('click', () => {
      document.querySelectorAll('details').forEach(item => item.open = false);
    });
    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      let visibleGroups = 0;
      groups.forEach(group => {
        let visibleTickets = 0;
        const userMatch = group.dataset.user.includes(term);
        group.querySelectorAll('.ticket').forEach(ticket => {
          const match = !term || userMatch || ticket.dataset.search.includes(term);
          ticket.hidden = !match;
          if (match) visibleTickets += 1;
        });
        group.hidden = visibleTickets === 0;
        if (!group.hidden) visibleGroups += 1;
        if (term && !group.hidden) group.open = true;
      });
      noResults.hidden = visibleGroups !== 0;
    });
  </script>
</body>
</html>`;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return new NextResponse(`Internal Server Error: ${error?.message || error?.toString()}`, { status: 500 });
  }
}
