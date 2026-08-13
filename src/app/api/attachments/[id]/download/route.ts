import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Create a short-lived signed URL to download the file
    // Since the bucket is private, we need a signed URL for the client to access it.
    const filePath = `uploads/${attachment.storedFileName}`;
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(filePath, 60, {
        download: attachment.originalFileName // This forces a file download with the original name
      });

    if (error || !data?.signedUrl) {
      console.error('Supabase signed URL error:', error);
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('Download route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
