import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            attachments: true,
            author: { select: { name: true, email: true } }
          }
        },
        author: { select: { name: true, email: true } }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // RLS handles the permission check (if it comes back, user can view it)
    return NextResponse.json(submission)
  } catch (error) {
    console.error('Failed to get submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const userId = (session.user as any).id
    const { id } = await params
    
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (submission.createdBy !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const currentVersion = submission.versions[0]
    if (!currentVersion || !currentVersion.isDraft) {
      return NextResponse.json({ error: 'Only drafts can be deleted' }, { status: 400 })
    }

    // Delete the submission entirely
    await prisma.submission.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
