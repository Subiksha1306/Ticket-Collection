import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();

      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, arrayBuffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error('Failed to upload file to storage');
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(filePath);

      uploadedFiles.push({
        originalFileName: file.name,
        storedFileName: fileName,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        storagePath: publicUrlData.publicUrl
      });
    }

    return NextResponse.json({ attachments: uploadedFiles });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
