import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { existsSync } from 'fs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function saveFile(file: File): Promise<{ originalName: string, storedName: string, size: number, type: string, path: string }> {
  // Ensure the upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Generate a unique filename while preserving extension
  const originalName = file.name
  const ext = path.extname(originalName)
  const storedName = `${uuidv4()}${ext}`
  
  const storagePath = path.join(UPLOAD_DIR, storedName)
  
  await writeFile(storagePath, buffer)
  
  return {
    originalName,
    storedName,
    size: file.size,
    type: file.type || 'application/octet-stream',
    path: `/uploads/${storedName}` // Public URL path
  }
}
