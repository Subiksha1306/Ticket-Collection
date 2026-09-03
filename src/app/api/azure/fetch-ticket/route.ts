import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketNumber = searchParams.get('ticketNumber');
    
    if (!ticketNumber) {
      return NextResponse.json({ error: 'Ticket number is required' }, { status: 400 });
    }

    // 1. Fetch Azure DevOps settings from the database
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings || !settings.azurePatToken || !settings.azureBoardUrl) {
      return NextResponse.json(
        { error: 'Azure DevOps is not fully configured in Admin Settings.' },
        { status: 400 }
      );
    }

    // Parse organization and project from board URL
    // e.g., https://dev.azure.com/{organization}/{project}
    const urlParts = settings.azureBoardUrl.replace(/\/$/, '').split('/');
    // We expect the URL to have at least dev.azure.com/org/project
    const orgIndex = urlParts.findIndex(part => part.includes('dev.azure.com')) + 1;
    
    if (orgIndex === 0 || orgIndex >= urlParts.length) {
      return NextResponse.json(
        { error: 'Invalid Azure Board URL format. Expected https://dev.azure.com/{organization}/{project}' },
        { status: 400 }
      );
    }

    const organization = urlParts[orgIndex];
    // Project is technically optional for fetching a Work Item by ID in ADO if we just use the org level, 
    // but the standard REST API is:
    // GET https://dev.azure.com/{organization}/_apis/wit/workitems/{id}?api-version=7.1

    const apiUrl = `https://dev.azure.com/${organization}/_apis/wit/workitems/${ticketNumber}?api-version=7.1`;

    // 2. Make the request to Azure DevOps REST API
    const adoRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${settings.azurePatToken}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    if (!adoRes.ok) {
      if (adoRes.status === 404) {
        return NextResponse.json({ error: `Ticket #${ticketNumber} not found in Azure DevOps.` }, { status: 404 });
      }
      if (adoRes.status === 401 || adoRes.status === 403) {
        return NextResponse.json({ error: 'Azure DevOps authentication failed. Check the PAT token in Admin Settings.' }, { status: 401 });
      }
      return NextResponse.json({ error: `Azure DevOps API returned status: ${adoRes.status}` }, { status: adoRes.status });
    }

    const adoData = await adoRes.json();
    const fields = adoData.fields;

    // 3. Extract the title and description
    // Azure DevOps stores Title in System.Title
    // Description can be in System.Description, or Repro Steps (Microsoft.VSTS.TCM.ReproSteps)
    const title = fields['System.Title'] || '';
    let description = fields['System.Description'] || fields['Microsoft.VSTS.TCM.ReproSteps'] || '';

    // Description from Azure is often HTML, we could strip it or just return it. 
    // We'll just return it directly (maybe clean up basic HTML if we had a parser, but string replace is fine for basic tags)
    description = description.replace(/<[^>]*>?/gm, '').trim();

    return NextResponse.json({
      title,
      description
    });

  } catch (error: any) {
    console.error('Error fetching from Azure DevOps:', error);
    return NextResponse.json({ error: 'Failed to fetch from Azure DevOps API.' }, { status: 500 });
  }
}
