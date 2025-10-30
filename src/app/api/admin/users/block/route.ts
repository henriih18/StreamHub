import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, reason, duration } = await request.json()

    if (!userId || !reason || !duration) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Calcular fecha de expiración
    const blockExpiresAt = duration === '999' 
      ? null 
      : new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000)

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockReason: reason,
        blockExpiresAt: blockExpiresAt
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error blocking user:', error)
    return NextResponse.json(
      { error: 'Error al bloquear usuario' },
      { status: 500 }
    )
  }
}