import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { quantity } = body

    if (quantity < 0) {
      return NextResponse.json(
        { error: 'La cantidad no puede ser negativa.' },
        { status: 400 }
      )
    }

    // Get the cart item with account details to check stock
    const cartItem = await db.cartItem.findUnique({
      where: { id: resolvedParams.id },
      include: {
        streamingAccount: {
          include: {
            accountStocks: true,
            profileStocks: true
          }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Artículo del carrito no encontrado' },
        { status: 404 }
      )
    }

    // Check stock availability
    if (cartItem.streamingAccount) {
      const availableStock = cartItem.saleType === 'PROFILES'
        ? cartItem.streamingAccount.profileStocks?.filter(stock => stock.isAvailable).length || 0
        : cartItem.streamingAccount.accountStocks?.filter(stock => stock.isAvailable).length || 0

      if (availableStock < quantity) {
        return NextResponse.json(
          { 
            error: `Stock insuficiente. Solo hay ${availableStock} unidad${availableStock !== 1 ? 'es' : ''} disponible${availableStock !== 1 ? 's' : ''}.` 
          },
          { status: 400 }
        )
      }
    }

    // Update the cart item
    const updatedCartItem = await db.cartItem.update({
      where: { id: resolvedParams.id },
      data: { quantity }
    })

    // Update cart total
    const cart = await db.cart.findUnique({
      where: { id: cartItem.cartId }
    })
    
    if (cart) {
      await updateCartTotal(cart.id)
    }

    return NextResponse.json(updatedCartItem)
  } catch (error) {
    //console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el artículo del carrito' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const cartItem = await db.cartItem.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Artículo del carrito no encontrado' },
        { status: 404 }
      )
    }

    await db.cartItem.delete({
      where: { id: resolvedParams.id }
    })

    // Update cart total
    await updateCartTotal(cartItem.cartId)

    return NextResponse.json({ message: 'Artículo eliminado del carrito' })
  } catch (error) {
    //console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el artículo del carrito' },
      { status: 500 }
    )
  }
}

async function updateCartTotal(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId },
    include: {
      streamingAccount: true
    }
  })

  const totalAmount = items.reduce((total, item) => {
    return total + (item.priceAtTime * item.quantity)
  }, 0)

  await db.cart.update({
    where: { id: cartId },
    data: { totalAmount } 
  })
}