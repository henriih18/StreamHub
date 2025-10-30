import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const supportContacts = await db.supportContact.findMany({
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(supportContacts)
  } catch (error) {
    console.error('Error fetching support contacts:', error)
    return NextResponse.json(
      { error: 'Error fetching support contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, number, type, description, isActive, order } = await request.json()

    // Validate required fields
    if (!name || !number || !type) {
      return NextResponse.json(
        { error: 'Name, number, and type are required' },
        { status: 400 }
      )
    }

    const supportContact = await db.supportContact.create({
      data: {
        name,
        number,
        type,
        description,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: order !== undefined ? parseInt(order) : 0
      }
    })

    return NextResponse.json(supportContact)
  } catch (error) {
    console.error('Error creating support contact:', error)
    return NextResponse.json(
      { error: 'Error creating support contact' },
      { status: 500 }
    )
  }
}