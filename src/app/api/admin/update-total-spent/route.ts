import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    console.log('Starting totalSpent recalculation for all users...')

    // Get all users with their orders
    const users = await db.user.findMany({
      include: {
        orders: {
          select: {
            totalPrice: true
          }
        }
      }
    })

    console.log(`Found ${users.length} users to update`)

    // Update each user's totalSpent
    const updatePromises = users.map(async (user) => {
      const calculatedTotal = user.orders.reduce((sum, order) => sum + order.totalPrice, 0)
      
      // Only update if there's a difference
      if (user.totalSpent !== calculatedTotal) {
        console.log(`Updating user ${user.email}: ${user.totalSpent} -> ${calculatedTotal}`)
        
        return db.user.update({
          where: { id: user.id },
          data: { totalSpent: calculatedTotal }
        })
      }
      
      return null
    })

    const results = await Promise.all(updatePromises)
    const updatedCount = results.filter(result => result !== null).length

    console.log(`Successfully updated ${updatedCount} users`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated totalSpent for ${updatedCount} users`,
      totalUsers: users.length,
      updatedUsers: updatedCount
    })

  } catch (error) {
    console.error('Error updating totalSpent:', error)
    return NextResponse.json(
      { error: 'Error updating totalSpent' },
      { status: 500 }
    )
  }
}