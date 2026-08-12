import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    
    const versions = await prisma.submissionVersion.findMany({
      where: { submissionId: id },
      orderBy: { versionNumber: 'desc' },
      include: {
        author: { select: { name: true, email: true } },
        attachments: true
      }
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Failed to get versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const userId = (session.user as any).id;
    
    const submission = await prisma.submission.findUnique({ 
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    })
    
    if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { title, description, existingAttachments = [], newAttachments = [] } = await request.json()
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const nextVersionNumber = (submission.versions[0]?.versionNumber || 0) + 1

    // Prepare all attachments for the new version
    const allAttachmentsToCreate = [
      ...existingAttachments.map((a: any) => ({
        originalFileName: a.originalFileName,
        storedFileName: a.storedFileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        storagePath: a.storagePath,
        uploadedBy: a.uploadedBy
      })),
      ...newAttachments.map((a: any) => ({
        originalFileName: a.originalFileName,
        storedFileName: a.storedFileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        storagePath: a.storagePath,
        uploadedBy: userId
      }))
    ]

    // Use a transaction to set old versions to inactive and create new version
    const [_, newVersion] = await prisma.$transaction([
      prisma.submissionVersion.updateMany({
        where: { submissionId: id, isActive: true },
        data: { isActive: false }
      }),
      prisma.submissionVersion.create({
        data: {
          submissionId: id,
          versionNumber: nextVersionNumber,
          title,
          description,
          createdBy: userId,
          isActive: true,
          attachments: {
            create: allAttachmentsToCreate
          }
        },
        include: {
          attachments: true
        }
      })
    ])

    return NextResponse.json(newVersion)
  } catch (error) {
    console.error('Failed to create version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
