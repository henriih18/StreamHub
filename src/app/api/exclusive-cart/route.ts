import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de usuario' },
        { status: 400 }
      )
    }

    // Get exclusive accounts the user has access to
    const exclusiveAccounts = await db.exclusiveAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { isPublic: true },
          { 
            allowedUsers: {
              some: {
                id: userId
              }
            }
          }
        ]
      },
      include: {
        allowedUsers: {
          where: {
            id: userId
          }
        },
        exclusiveStocks: {
          where: {
            isAvailable: true
          }
        }
      }
    })

    return NextResponse.json(exclusiveAccounts)
  } catch (error) {
    //console.error('Error fetching exclusive accounts:', error)
    return NextResponse.json(
      { error: 'Error al recuperar cuentas exclusivas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, exclusiveAccountId, quantity, priceAtTime} = body

    if (!userId || !exclusiveAccountId) {
      return NextResponse.json(
        { error: 'Se requieren el ID de usuario y el ID de cuenta exclusivo.' },
        { status: 400 }
      )
    }

    // Get exclusive account details
    const exclusiveAccount = await db.exclusiveAccount.findUnique({
      where: { id: exclusiveAccountId },
      include: {
        allowedUsers: true,
        exclusiveStocks: {
          where: {
            isAvailable: true
          }
        }
      }
    })

    if (!exclusiveAccount) {
      return NextResponse.json(
        { error: 'Cuenta exclusiva no encontrada' },
        { status: 404 }
      )
    }

    // Check if user has access to this exclusive account
    const hasAccess = exclusiveAccount.isPublic || 
      (exclusiveAccount.allowedUsers && exclusiveAccount.allowedUsers.some(user => user.id === userId))

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acceso denegado a esta cuenta exclusiva' },
        { status: 403 }
      )
    }

    // Check stock availability
    const availableStock = exclusiveAccount.exclusiveStocks.length
    if (availableStock < quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente. Solo hay ${availableStock} unidades disponibles` },
        { status: 400 }
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
        exclusiveAccountId: exclusiveAccountId
      }
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      
      // Check stock again
      if (availableStock < newQuantity) {
        return NextResponse.json(
          { error: `Stock insuficiente. Solo hay ${availableStock} unidades disponibles` },
          { status: 400 }
        )
      }

      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity
        }
      })

      // Update cart total
      await updateCartTotal(cart.id)
      
      return NextResponse.json(updatedItem)
    } else {
      // Create new cart item with exclusive account ID
      /* const cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          exclusiveAccountId: exclusiveAccountId,
          quantity: quantity,
          saleType: exclusiveAccount.saleType as 'FULL' | 'PROFILES',
          priceAtTime: exclusiveAccount.price
        }
      }) */

              // Validate priceAtTime if provided
      let finalPriceAtTime;
      if (priceAtTime !== undefined) {
        // Use the price provided by the client
        finalPriceAtTime = priceAtTime;
      } else {
        // Fallback to original calculation
        finalPriceAtTime = exclusiveAccount.price;
      }

      const cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          exclusiveAccountId,
          quantity: quantity || 1,
          saleType: exclusiveAccount.saleType as 'FULL' | 'PROFILES',
          priceAtTime: finalPriceAtTime,
        },
      });

      // Update cart total
      await updateCartTotal(cart.id)

      return NextResponse.json(cartItem, { status: 201 })
    }
  } catch (error) {
    //console.error('Error adding exclusive account to cart:', error)
    return NextResponse.json(
      { error: 'Error al agregar al carrito' },
      { status: 500 }
    )
  }
}

async function updateCartTotal(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId }
  })

  const totalAmount = items.reduce((total, item) => {
    return total + (item.priceAtTime * item.quantity)
  }, 0)

  await db.cart.update({
    where: { id: cartId },
    data: { totalAmount }
  })
}