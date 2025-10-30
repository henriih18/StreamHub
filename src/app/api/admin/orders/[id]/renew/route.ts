import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { calculateExpirationDate } from '@/lib/date-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    // Get the order with user and streaming account details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        streamingAccount: true,
        exclusiveAccount: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Solo se pueden renovar pedidos completados' },
        { status: 400 }
      )
    }

    // Check if user has enough credits
    const renewalPrice = order.streamingAccount?.price || order.exclusiveAccount?.price || 0
    
    if (order.user.credits < renewalPrice) {
      return NextResponse.json(
        { error: `El usuario no tiene suficientes créditos. Necesita: $${renewalPrice.toLocaleString()}, Tiene: $${order.user.credits.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Calculate new expiration date based on the streaming account duration
    const duration = order.streamingAccount?.duration || '1 mes'
    const newExpiresAt = calculateExpirationDate(duration)

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct credits from user
      await tx.user.update({
        where: { id: order.userId },
        data: {
          credits: {
            decrement: renewalPrice
          },
          totalSpent: {
            increment: renewalPrice
          }
        }
      })

      // Update order with new expiration and renewal count
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          expiresAt: newExpiresAt,
          renewalCount: {
            increment: 1
          },
          lastRenewedAt: new Date()
        }
      })

      return updatedOrder
    })

    // Send notification to user (optional - using ZAI if needed)
    try {
      const zai = await ZAI.create()
      
      const notificationMessage = `
        ¡Tu cuenta ha sido renovada exitosamente!
        
        Detalles de la renovación:
        - Servicio: ${order.streamingAccount?.name || order.exclusiveAccount?.title || 'Cuenta Exclusive'}
        - Nueva fecha de vencimiento: ${newExpiresAt.toLocaleDateString('es-CO')}
        - Costo de renovación: $${renewalPrice.toLocaleString('es-CO')}
        - Número de renovaciones: ${result.renewalCount}
        
        Gracias por continuar con nuestro servicio!
      `

      await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente que genera notificaciones amigables para usuarios.'
          },
          {
            role: 'user',
            content: `Genera una notificación concisa y amigable basada en esta información: ${notificationMessage}`
          }
        ],
        max_tokens: 200
      })
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError)
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta renovada exitosamente',
      order: {
        id: result.id,
        newExpiresAt: result.expiresAt,
        renewalCount: result.renewalCount,
        lastRenewedAt: result.lastRenewedAt,
        renewalPrice
      }
    })

  } catch (error) {
    console.error('Error renewing order:', error)
    return NextResponse.json(
      { error: 'Error al renovar la cuenta' },
      { status: 500 }
    )
  }
}