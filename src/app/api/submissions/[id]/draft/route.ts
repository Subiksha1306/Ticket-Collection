import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const userId = (session.user as any).id
    const { id } = await params
    const { versionId } = await request.json()
    
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (submission.createdBy !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const versionToSubmit = submission.versions.find(v => v.id === versionId)
    if (!versionToSubmit || !versionToSubmit.isDraft) {
      return NextResponse.json({ error: 'Version is not a draft' }, { status: 400 })
    }

    // Submit the draft: Deactivate all other versions and make this one active and not a draft
    const transactionOps = [
      prisma.submissionVersion.updateMany({
        where: { submissionId: id, isActive: true },
        data: { isActive: false }
      }),
      prisma.submissionVersion.update({
        where: { id: versionId },
        data: { 
          isActive: true,
          isDraft: false
        }
      })
    ]

    await prisma.$transaction(transactionOps)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to submit draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
