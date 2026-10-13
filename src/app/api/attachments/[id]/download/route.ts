import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const isPreview = url.searchParams.get('preview') === 'true';

    // Redirect directly to the Supabase CDN URL (supports ?download=... for native filename & inline preview)
    let fileUrl = attachment.storagePath;
    if (!fileUrl || !fileUrl.startsWith('http')) {
      fileUrl = `https://htbkrfvxnsnucarwfarg.supabase.co/storage/v1/object/public/ticket-attachments/uploads/${attachment.storedFileName}`;
    }

    const downloadUrl = isPreview
      ? fileUrl
      : (fileUrl.includes('?')
          ? `${fileUrl}&download=${encodeURIComponent(attachment.originalFileName)}`
          : `${fileUrl}?download=${encodeURIComponent(attachment.originalFileName)}`);

    return NextResponse.redirect(downloadUrl);

    // 2. Fallback: Download via Supabase client SDK
    const filePath = `uploads/${attachment.storedFileName}`;
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .download(filePath);

    if (error || !data) {
      console.error('Supabase download error:', error);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': attachment.fileType || 'application/octet-stream',
        'Content-Disposition': isPreview 
          ? `inline; filename="${encodeURIComponent(attachment.originalFileName)}"` 
          : `attachment; filename="${encodeURIComponent(attachment.originalFileName)}"`,
      }
    });
  } catch (error) {
    console.error('Download route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
