import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = isAdmin(session.user.email);
    const userId = (session.user as any).id;

    const submissions = await prisma.submission.findMany({
      where: userIsAdmin ? undefined : { createdBy: userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          where: { isActive: true },
          take: 1
        }
      }
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Failed to get submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticketNumber, title, description, newAttachments } = await request.json()
    
    if (!ticketNumber || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userId = (session.user as any).id;

    const attachments = (newAttachments || []).map((att: any) => ({
      originalFileName: att.originalFileName,
      storedFileName: att.storedFileName,
      fileType: att.fileType,
      fileSize: att.fileSize,
      storagePath: att.storagePath,
      uploadedBy: userId
    }))

    const submission = await prisma.submission.create({
      data: {
        ticketNumber,
        createdBy: userId,
        versions: {
          create: {
            versionNumber: 1,
            title,
            description,
            createdBy: userId,
            isActive: true,
            attachments: {
              create: attachments
            }
          }
        }
      },
      include: {
        versions: {
          include: { attachments: true }
        }
      }
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Failed to create submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
