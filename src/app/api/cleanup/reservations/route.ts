import { NextRequest, NextResponse } from 'next/server'
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
}