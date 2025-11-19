
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

  export async function POST() {
  try {
    console.log('🧹 Iniciando limpieza de reservas expiradas...')
    
    // PRIMERO: Eliminar todas las reservas expiradas
    const deletedReservations = await db.stockReservation.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })

    console.log(`🗑️ Reservas eliminadas: ${deletedReservations.count}`)

    // SEGUNDO: Encontrar y eliminar cart items con reservas expiradas
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

    if (expiredItems.length === 0 && deletedReservations.count === 0) {
      return NextResponse.json({ 
        message: 'No hay items expirados por limpiar',
        deletedCount: 0,
        deletedReservations: 0,
        cleanedAt: new Date().toISOString()
      })
    }

    // TERCERO: Eliminar los items del carrito expirados
    const deletedItems = await db.cartItem.deleteMany({
      where: {
        reservationExpiresAt: {
          lt: new Date()
        }
      }
    })

    console.log(`🛒 Items del carrito eliminados: ${deletedItems.count}`)

    // CUARTO: Actualizar totales de los carritos afectados
    const affectedCartIds = [...new Set(expiredItems.map(item => item.cartId))]
    let updatedCarts = 0
    
    for (const cartId of affectedCartIds) {
      try {
        await updateCartTotal(cartId)
        updatedCarts++
      } catch (error) {
        console.error(`Error actualizando carrito ${cartId}:`, error)
      }
    }

    console.log(`📊 Carritos actualizados: ${updatedCarts}`)

    // 🔥 QUINTO: NOTIFICAR A USUARIOS AFECTADOS VIA WEBSOCKET
    try {
      const io = (global as any).io
      if (io) {
        // Agrupar usuarios afectados
        const affectedUsers = [...new Set(expiredItems.map(item => item.cart?.userId).filter(Boolean))]
        
        console.log(`📡 Notificando a ${affectedUsers.length} usuarios afectados`)
        
        affectedUsers.forEach(userId => {
          // Notificar que items expiraron
          io.to(`user:${userId}`).emit('cartExpired', {
            message: 'Algunos artículos de tu carrito han expirado',
            expiredItems: expiredItems.filter(item => item.cart?.userId === userId).map(item => ({
              id: item.id,
              name: item.streamingAccount?.name || item.exclusiveAccount?.name || 'Artículo',
              reason: 'expired'
            })),
            timestamp: new Date().toISOString()
          })
          
          // Forzar actualización del carrito
          io.to(`user:${userId}`).emit('cartUpdate', {
            action: 'refresh',
            reason: 'items_expired'
          })
        })

        console.log(`✅ Notificaciones enviadas a ${affectedUsers.length} usuarios`)
      }
    } catch (socketError) {
      console.warn('Error emitiendo notificaciones WebSocket:', socketError)
    }

    // SEXTO: Emitir actualizaciones de stock generales
    try {
      const io = (global as any).io
      if (io) {
        // Agrupar actualizaciones por cuenta
        const stockUpdates = new Map()
        
        expiredItems.forEach(item => {
          if (item.streamingAccountId) {
            stockUpdates.set(item.streamingAccountId, {
              accountId: item.streamingAccountId,
              accountType: 'regular',
              type: item.saleType
            })
          } else if (item.exclusiveAccountId) {
            stockUpdates.set(item.exclusiveAccountId, {
              accountId: item.exclusiveAccountId,
              accountType: 'exclusive',
              type: item.saleType
            })
          }
        })

        // Emitir actualizaciones
        stockUpdates.forEach((updateData, accountId) => {
          io.emit('stockUpdated', {
            ...updateData,
            newStock: 0, // Forzar recálculo en frontend
            cleaned: true
          })
        })

        console.log(`📡 Emitidas ${stockUpdates.size} actualizaciones de stock via WebSocket`)
      }
    } catch (socketError) {
      console.warn('Error emitiendo actualizaciones WebSocket:', socketError)
    }

    return NextResponse.json({ 
      message: 'Limpieza completada exitosamente',
      deletedReservations: deletedReservations.count,
      deletedCartItems: deletedItems.count,
      updatedCarts: updatedCarts,
      affectedUsers: [...new Set(expiredItems.map(item => item.cart?.userId).filter(Boolean))].length,
      items: expiredItems.map(item => ({
        id: item.id,
        name: item.streamingAccount?.name || item.exclusiveAccount?.name || 'Unknown',
        userId: item.cart?.userId,
        type: item.streamingAccountId ? 'STREAMING' : 'EXCLUSIVE'
      })),
      cleanedAt: new Date().toISOString()
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