import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json()

    // Validate required fields
    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update user credits
    const user = await db.user.update({
      where: {
        id: userId
      },
      data: {
        credits: {
          increment: parseFloat(amount)
        }
      }
    })

    // Create credit recharge record
    const creditRecharge = await db.creditRecharge.create({
      data: {
        userId: userId,
        amount: parseFloat(amount),
        method: 'Admin Manual',
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({ user, creditRecharge })
  } catch (error) {
    console.error('Error recharging credits:', error)
    return NextResponse.json({ error: 'Error recharging credits' }, { status: 500 })
  }
}