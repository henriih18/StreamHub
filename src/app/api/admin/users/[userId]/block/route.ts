import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userCache } from '@/lib/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { blockType, duration, reason, notifyUser } = await request.json()
    const { userId } = await params

    if (!userId || !blockType || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos.' },
        { status: 400 }
      )
    }

    // Calculate expiration date for temporary blocks
    const expiresAt = blockType === 'temporary' 
      ? new Date(Date.now() + (parseInt(duration) || 24) * 60 * 60 * 1000)
      : null

    // Update user block status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockReason: reason,
        blockExpiresAt: expiresAt
      }
    })

    // Invalidate cache for this user and the users list
    userCache.delete(`user:id:${userId}`)
    userCache.delete('admin:users:list')
    if (updatedUser.email) {
      userCache.delete(`user:${updatedUser.email}`)
    }

    // Create block record
    const block = await db.userBlock.create({
      data: {
        userId,
        blockType,
        duration: blockType === 'temporary' ? duration : null,
        reason,
        isActive: true,
        expiresAt
      }
    })

    // Get first admin as sender
    const adminUser = await db.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    })

    if (!adminUser) {
      console.warn('No admin user found for sending block notification')
    }

    // Send internal message if requested and admin user exists
    if (notifyUser && adminUser) {
      let messageContent = `Tu cuenta ha sido bloqueada. Motivo: ${reason}`
      
      if (blockType === 'temporary') {
        const unblockDate = new Date(expiresAt!)
        messageContent += `\n\nDesbloqueo automático: ${unblockDate.toLocaleDateString('es-CO')}`
      } else {
        messageContent += '\n\nEste es un bloqueo permanente. Contacta soporte para más información.'
      }

      await db.message.create({
        data: {
          senderId: adminUser.id,
          receiverId: userId,
          title: 'Cuenta Bloqueada',
          content: messageContent,
          type: 'BLOCK_NOTICE'
        }
      })
    }

    // Log the action
    /* console.log(`Block created for user ${userId}:`, {
      blockId: block.id,
      blockType,
      duration,
      reason,
      expiresAt,
      timestamp: new Date()
    }) */

    return NextResponse.json({ user: updatedUser, block })
  } catch (error) {
    //console.error('Error creating block:', error)
    return NextResponse.json(
      { error: 'Error al bloquear usuario.' },
      { status: 500 }
    )
  }
}