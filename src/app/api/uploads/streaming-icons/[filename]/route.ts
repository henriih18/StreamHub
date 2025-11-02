import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Security check - only allow webp files in streaming-icons directory
    if (!filename.endsWith('.webp') || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Archivo no válido' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'streaming-icons', filename)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      return new NextResponse(fileBuffer as any, { //revisar
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      })
    } catch (fileError) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }
  } catch (error) {
    //console.error('Error serving image:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}