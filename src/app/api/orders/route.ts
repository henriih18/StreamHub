import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateExpirationDate } from '@/lib/date-utils'

export async function POST(request: NextRequest) {
  return await db.$transaction(async (tx) => {
    try {
      const body = await request.json()
      const { userId, items } = body

      if (!userId || !items || items.length === 0) {
        return NextResponse.json(
          { error: 'User ID and items are required' },
          { status: 400 }
        )
      }

      // Get user and check credits atomically
      const user = await tx.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Calculate total price
      const totalPrice = items.reduce((total: number, item: any) => {
        return total + (item.priceAtTime * item.quantity)
      }, 0)

      // Check and deduct credits atomically
      if (user.credits < totalPrice) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 400 }
        )
      }

      // Deduct credits and update total spent immediately
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: user.credits - totalPrice,
          totalSpent: user.totalSpent + totalPrice
        }
      })

      const orders = []
      
      // Process each item with atomic inventory control
      for (const item of items) {
        // Calculate expiration date based on streaming account duration
        const expiresAt = calculateExpirationDate(item.streamingAccount.duration)
        
        if (item.saleType === 'PROFILES') {
          // Find and lock available profiles atomically
          const availableProfiles = await tx.accountProfile.findMany({
            where: { 
              streamingAccountId: item.streamingAccount.id,
              isAvailable: true 
            },
            take: item.quantity
          })

          if (availableProfiles.length < item.quantity) {
            throw new Error(`Solo hay ${availableProfiles.length} perfiles disponibles para ${item.streamingAccount.name}`)
          }

          // Create orders and mark profiles as sold atomically
          for (const profile of availableProfiles) {
            const order = await tx.order.create({
              data: {
                userId,
                streamingAccountId: item.streamingAccount.id,
                accountProfileId: profile.id,
                accountEmail: profile.email,
                accountPassword: profile.password,
                profileName: profile.profileName,
                profilePin: profile.profilePin,
                saleType: 'PROFILES',
                quantity: 1,
                totalPrice: item.priceAtTime,
                expiresAt,
                status: 'COMPLETED'
              }
            })
            
            // Mark profile as sold immediately
            await tx.accountProfile.update({
              where: { id: profile.id },
              data: {
                isAvailable: false,
                soldToUserId: userId,
                soldAt: new Date()
              }
            })
            
            orders.push(order)
          }
        } else {
          // Find and lock available account atomically
          const availableAccount = await tx.accountStock.findFirst({
            where: { 
              streamingAccountId: item.streamingAccount.id,
              isAvailable: true 
            }
          })

          if (!availableAccount) {
            throw new Error(`No hay cuentas disponibles para ${item.streamingAccount.name}`)
          }

          // Create order and mark account as sold atomically
          const order = await tx.order.create({
            data: {
              userId,
              streamingAccountId: item.streamingAccount.id,
              accountStockId: availableAccount.id,
              accountEmail: availableAccount.email,
              accountPassword: availableAccount.password,
              saleType: 'FULL',
              quantity: item.quantity,
              totalPrice: item.priceAtTime * item.quantity,
              expiresAt,
              status: 'COMPLETED'
            }
          })
          
          // Mark account as sold immediately
          await tx.accountStock.update({
            where: { id: availableAccount.id },
            data: {
              isAvailable: false,
              soldToUserId: userId,
              soldAt: new Date()
            }
          })
          
          orders.push(order)
        }
      }

      // Clear cart atomically
      const cart = await tx.cart.findUnique({
        where: { userId }
      })

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id }
        })

        await tx.cart.update({
          where: { id: cart.id },
          data: { totalAmount: 0 }
        })
      }

      return NextResponse.json({ 
        message: 'Orders created successfully',
        orders 
      }, { status: 201 })

    } catch (error) {
      console.error('Error creating orders:', error)
      
      // Return specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Error creating orders'
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const orders = await db.order.findMany({
      where: { userId },
      include: {
        streamingAccount: {
          include: {
            streamingType: true
          }
        },
        accountProfile: true,
        accountStock: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Error fetching orders' },
      { status: 500 }
    )
  }
}