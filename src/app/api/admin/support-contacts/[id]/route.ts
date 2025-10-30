import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, number, type, description, isActive, order } = await request.json()
    const { id } = params

    // Validate required fields
    if (!name || !number || !type) {
      return NextResponse.json(
        { error: 'Name, number, and type are required' },
        { status: 400 }
      )
    }

    const supportContact = await db.supportContact.update({
      where: { id },
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
    console.error('Error updating support contact:', error)
    return NextResponse.json(
      { error: 'Error updating support contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await db.supportContact.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting support contact:', error)
    return NextResponse.json(
      { error: 'Error deleting support contact' },
      { status: 500 }
    )
  }
}