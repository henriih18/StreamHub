/* import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const result = await db.stockReservation.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })

    // También limpiar carritos con items expirados
    const expiredReservations = await db.stockReservation.findMany({
      where: {
        expiresAt: { lt: new Date() }
      },
      select: {
        userId: true,
        accountId: true,
        accountType: true
      }
    })

    for (const reservation of expiredReservations) {
      await db.cartItem.deleteMany({
        where: {
          userId: reservation.userId,
          AND: [
            {
              OR: [
                { streamingAccountId: reservation.accountId },
                { exclusiveAccountId: reservation.accountId }
              ]
            }
          ]
        }
      })
    }

    return NextResponse.json({ 
      message: 'Reservas expiradas eliminadas',
      deletedCount: result.count 
    })
  } catch (error) {
    console.error('Error cleaning up reservations:', error)
    return NextResponse.json(
      { error: 'Error al limpiar reservas expiradas' },
      { status: 500 }
    )
  }
} */

  import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Buscar items del carrito con reservas expiradas
    const expiredItems = await db.cartItem.findMany({
      where: {
        reservationExpiresAt: {
          lt: new Date()
        }
      },
      include: {
        cart: {
          select: {
            userId: true
          }
        },
        streamingAccount: {
          select: {
            name: true
          }
        },
        exclusiveAccount: {
          select: {
            name: true
          }
        }
      }
    })

    if (expiredItems.length === 0) {
      return NextResponse.json({ 
        message: 'No hay items expirados',
        deletedCount: 0 
      })
    }

    // Eliminar reservas asociadas
    for (const item of expiredItems) {
      if (item.streamingAccountId && item.cart) {
        await db.stockReservation.deleteMany({
          where: {
            userId: item.cart.userId,
            accountId: item.streamingAccountId,
            accountType: 'STREAMING'
          }
        })
      }

      if (item.exclusiveAccountId && item.cart) {
        await db.stockReservation.deleteMany({
          where: {
            userId: item.cart.userId,
            accountId: item.exclusiveAccountId,
            accountType: 'EXCLUSIVE'
          }
        })
      }
    }

    // Eliminar los items del carrito
    const deletedItems = await db.cartItem.deleteMany({
      where: {
        reservationExpiresAt: {
          lt: new Date()
        }
      }
    })

    // Actualizar totales de los carritos afectados
    const affectedCartIds = expiredItems.map(item => item.cartId)
    for (const cartId of affectedCartIds) {
      await updateCartTotal(cartId)
    }

    return NextResponse.json({ 
      message: 'Items expirados eliminados del carrito',
      deletedCount: deletedItems.count,
      items: expiredItems.map(item => ({
        id: item.id,
        name: item.streamingAccount?.name || item.exclusiveAccount?.name,
        userId: item.cart?.userId
      }))
    })
  } catch (error) {
    console.error('Error cleaning up expired cart items:', error)
    return NextResponse.json(
      { error: 'Error al limpiar items expirados del carrito' },
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