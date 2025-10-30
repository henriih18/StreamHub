import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verify the special offer exists
    const existingOffer = await db.specialOffer.findUnique({
      where: { id }
    })

    if (!existingOffer) {
      return NextResponse.json(
        { error: 'Special offer not found' },
        { status: 404 }
      )
    }

    // Delete the special offer
    await db.specialOffer.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Special offer deleted successfully' })
  } catch (error) {
    console.error('Error deleting special offer:', error)
    return NextResponse.json(
      { error: 'Error deleting special offer' },
      { status: 500 }
    )
  }
}