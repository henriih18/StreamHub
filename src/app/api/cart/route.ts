import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            streamingAccount: {
              include: {
                streamingType: true,
                accountStocks: true,
                profileStocks: true
              }
            },
            exclusiveAccount: {
              include: {
                allowedUsers: true,
                exclusiveStocks: {
                  where: {
                    isAvailable: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!cart) {
      return NextResponse.json({ items: [], totalAmount: 0 })
    }

    return NextResponse.json(cart)
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Error fetching cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, streamingAccountId, quantity, saleType } = body

    if (!userId || !streamingAccountId) {
      return NextResponse.json(
        { error: 'User ID and Streaming Account ID are required' },
        { status: 400 }
      )
    }

    // Get streaming account details
    const streamingAccount = await db.streamingAccount.findUnique({
      where: { id: streamingAccountId }
    })

    if (!streamingAccount) {
      return NextResponse.json(
        { error: 'Streaming account not found' },
        { status: 404 }
      )
    }

    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      cart = await db.cart.create({
        data: {
          userId,
          totalAmount: 0
        }
      })
    }

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        streamingAccountId,
        saleType
      }
    })

    if (existingItem) {
      // Update quantity
      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + (quantity || 1)
        }
      })

      // Update cart total
      await updateCartTotal(cart.id)
      
      return NextResponse.json(updatedItem)
    } else {
      // Create new cart item
      const priceAtTime = saleType === 'PROFILES' 
        ? (streamingAccount.pricePerProfile || streamingAccount.price)
        : streamingAccount.price

      const cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          streamingAccountId,
          quantity: quantity || 1,
          saleType: saleType || 'FULL',
          priceAtTime
        }
      })

      // Update cart total
      await updateCartTotal(cart.id)

      return NextResponse.json(cartItem, { status: 201 })
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Error adding to cart' },
      { status: 500 }
    )
  }
}

async function updateCartTotal(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId },
    include: {
      streamingAccount: true,
      exclusiveAccount: true
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