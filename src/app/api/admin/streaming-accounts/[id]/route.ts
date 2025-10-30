import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, price, type, duration, quality, screens, isActive, saleType, maxProfiles, pricePerProfile } = await request.json()
    
    const updatedAccount = await db.streamingAccount.update({
      where: { id },
      data: {
        name,
        description,
        price,
        type,
        duration,
        quality,
        screens,
        isActive,
        saleType,
        maxProfiles,
        pricePerProfile
      }
    })
    
    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Error updating streaming account:', error)
    return NextResponse.json(
      { error: 'Error updating streaming account' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar si hay órdenes asociadas a esta cuenta
    const associatedOrders = await db.order.findMany({
      where: { streamingAccountId: id }
    })
    
    if (associatedOrders.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar esta cuenta porque tiene órdenes asociadas',
          count: associatedOrders.length
        },
        { status: 400 }
      )
    }
    
    // Eliminar stocks asociados primero
    await db.accountStock.deleteMany({
      where: { streamingAccountId: id }
    })
    
    await db.accountProfile.deleteMany({
      where: { streamingAccountId: id }
    })
    
    // Eliminar items del carrito asociados
    await db.cartItem.deleteMany({
      where: { streamingAccountId: id }
    })
    
    // Eliminar ofertas especiales asociadas
    await db.specialOffer.deleteMany({
      where: { streamingAccountId: id }
    })
    
    // Eliminar la cuenta
    await db.streamingAccount.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Streaming account deleted successfully' })
  } catch (error) {
    console.error('Error deleting streaming account:', error)
    return NextResponse.json(
      { error: 'Error deleting streaming account' },
      { status: 500 }
    )
  }
}