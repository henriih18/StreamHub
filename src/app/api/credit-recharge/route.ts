import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId, amount, method, reference } = await request.json()

    if (!userId || !amount || !method) {
      return NextResponse.json(
        { error: 'User ID, amount, and method are required' },
        { status: 400 }
      )
    }

    // Create credit recharge record
    const recharge = await db.creditRecharge.create({
      data: {
        userId,
        amount,
        method,
        reference,
        status: 'PENDING'
      }
    })

    // For demo purposes, auto-approve the recharge
    // In a real application, this would be handled by a payment processor
    await db.creditRecharge.update({
      where: { id: recharge.id },
      data: { status: 'COMPLETED' }
    })

    // Update user credits
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (user) {
      await db.user.update({
        where: { id: userId },
        data: {
          credits: user.credits + amount
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      recharge: { ...recharge, status: 'COMPLETED' }
    })
  } catch (error) {
    console.error('Error processing credit recharge:', error)
    return NextResponse.json(
      { error: 'Failed to process credit recharge' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const recharges = await db.creditRecharge.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(recharges)
  } catch (error) {
    console.error('Error fetching credit recharges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit recharges' },
      { status: 500 }
    )
  }
}