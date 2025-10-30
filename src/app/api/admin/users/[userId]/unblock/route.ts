import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { reason, notifyUser } = await request.json()
    const { userId } = await params

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Update user unblock status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockReason: null,
        blockExpiresAt: null
      }
    })

    // Deactivate all active blocks for this user
    await db.userBlock.updateMany({
      where: { 
        userId, 
        isActive: true 
      },
      data: { 
        isActive: false 
      }
    })

    // Get first admin as sender
    const adminUser = await db.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    })

    if (!adminUser) {
      console.warn('No admin user found for sending unblock notification')
    }

    // Send internal message if requested and admin user exists
    if (notifyUser && adminUser) {
      await db.message.create({
        data: {
          senderId: adminUser.id,
          receiverId: userId,
          title: 'Cuenta Desbloqueada',
          content: `Tu cuenta ha sido desbloqueada. Motivo: ${reason}\n\nYa puedes acceder normalmente a la plataforma.`,
          type: 'UNBLOCK_NOTICE'
        }
      })
    }

    // Log the action
    console.log(`User ${userId} unblocked:`, {
      reason,
      timestamp: new Date()
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error unblocking user:', error)
    return NextResponse.json(
      { error: 'Error al desbloquear usuario' },
      { status: 500 }
    )
  }
}