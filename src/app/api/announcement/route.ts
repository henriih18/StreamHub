import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const banner = await db.announcementBanner.findFirst({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!banner) {
      return NextResponse.json({ isActive: false })
    }

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error fetching announcement banner:', error)
    return NextResponse.json(
      { error: 'Error fetching announcement banner' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, isActive, speed, backgroundColor, textColor } = await request.json()

    // Desactivar todos los banners existentes
    await db.announcementBanner.updateMany({
      where: {
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Crear nuevo banner
    const banner = await db.announcementBanner.create({
      data: {
        text,
        isActive: isActive ?? true,
        speed: speed ?? 20,
        backgroundColor: backgroundColor ?? '#000000',
        textColor: textColor ?? '#ffffff'
      }
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error creating announcement banner:', error)
    return NextResponse.json(
      { error: 'Error creating announcement banner' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, text, isActive, speed, backgroundColor, textColor } = await request.json()

    const banner = await db.announcementBanner.update({
      where: {
        id
      },
      data: {
        text,
        isActive,
        speed,
        backgroundColor,
        textColor
      }
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error updating announcement banner:', error)
    return NextResponse.json(
      { error: 'Error updating announcement banner' },
      { status: 500 }
    )
  }
}