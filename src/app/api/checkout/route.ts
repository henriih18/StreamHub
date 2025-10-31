import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's cart with items
    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            streamingAccount: {
              include: {
                streamingType: true,
                accountStocks: true,
                profileStocks: true
              }
            },
            exclusiveAccount: {
              include: {
                allowedUsers: true,
                exclusiveStocks: {
                  where: {
                    isAvailable: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Get user's current credits
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true, isBlocked: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'User is blocked' },
        { status: 403 }
      )
    }

    const totalAmount = cart.totalAmount

    // Check if user has enough credits
    if (user.credits < totalAmount) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      )
    }

    // Process the order using a transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct credits from user
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: totalAmount
          }
        }
      })

      // Create orders for each cart item
      const orders = []
      for (const cartItem of cart.items) {
        const { streamingAccount, exclusiveAccount, quantity, saleType, priceAtTime } = cartItem

        if (streamingAccount) {
          // Process streaming account
          // Check stock availability
          let availableStock = 0
          let stockQuery: any = {}

          if (saleType === 'PROFILES') {
            // Handle profile stock
            availableStock = streamingAccount.profileStocks?.filter(stock => stock.isAvailable).length || 0
            if (availableStock < quantity) {
              throw new Error(`Insufficient stock for ${streamingAccount.name}. Only ${availableStock} profiles available.`)
            }

            // Get available profile stocks
            const profileStocks = await tx.accountProfile.findMany({
              where: {
                streamingAccountId: streamingAccount.id,
                isAvailable: true
              },
              take: quantity
            })

            // Create orders for each profile
            for (const stock of profileStocks) {
              const order = await tx.order.create({
                data: {
                  userId,
                  streamingAccountId: streamingAccount.id,
                  accountProfileId: stock.id,
                  accountEmail: stock.email,
                  accountPassword: stock.password,
                  profileName: stock.profileName,
                  profilePin: stock.profilePin,
                  quantity: 1,
                  saleType: 'PROFILES',
                  totalPrice: priceAtTime,
                  status: 'COMPLETED',
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
              })

              // Mark stock as unavailable
              await tx.accountProfile.update({
                where: { id: stock.id },
                data: { isAvailable: false }
              })

              orders.push(order)
            }
          } else {
            // Handle full account stock
            availableStock = streamingAccount.accountStocks?.filter(stock => stock.isAvailable).length || 0
            if (availableStock < quantity) {
              throw new Error(`Insufficient stock for ${streamingAccount.name}. Only ${availableStock} accounts available.`)
            }

            // Get available account stocks
            const accountStocks = await tx.accountStock.findMany({
              where: {
                streamingAccountId: streamingAccount.id,
                isAvailable: true
              },
              take: quantity
            })

            // Create orders for each account
            for (const stock of accountStocks) {
              const order = await tx.order.create({
                data: {
                  userId,
                  streamingAccountId: streamingAccount.id,
                  accountStockId: stock.id,
                  accountEmail: stock.email,
                  accountPassword: stock.password,
                  quantity: 1,
                  saleType: 'FULL',
                  totalPrice: priceAtTime,
                  status: 'COMPLETED',
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
              })

              // Mark stock as unavailable
              await tx.accountStock.update({
                where: { id: stock.id },
                data: { isAvailable: false }
              })

              orders.push(order)
            }
          }
        } else if (exclusiveAccount) {
          // Process exclusive account
          const availableStock = exclusiveAccount.exclusiveStocks?.length || 0
          if (availableStock < quantity) {
            throw new Error(`Insufficient stock for ${exclusiveAccount.name}. Only ${availableStock} accounts available.`)
          }

          // Get available exclusive stocks
          const exclusiveStocks = await tx.exclusiveStock.findMany({
            where: {
              exclusiveAccountId: exclusiveAccount.id,
              isAvailable: true
            },
            take: quantity
          })

          // Create orders for each exclusive account
          for (const stock of exclusiveStocks) {
            const order = await tx.order.create({
              data: {
                userId,
                exclusiveAccountId: exclusiveAccount.id,
                exclusiveStockId: stock.id,
                accountEmail: stock.email,
                accountPassword: stock.password,
                quantity: 1,
                saleType: exclusiveAccount.saleType || 'FULL',
                totalPrice: priceAtTime,
                status: 'COMPLETED',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
              }
            })

            // Mark stock as unavailable
            await tx.exclusiveStock.update({
              where: { id: stock.id },
              data: { isAvailable: false }
            })

            orders.push(order)
          }
        }
      }

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      })

      await tx.cart.update({
        where: { id: cart.id },
        data: { totalAmount: 0 }
      })

      return orders
    })

    // Get updated user credits
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      orders: result,
      newCredits: updatedUser?.credits || 0
    })

  } catch (error) {
    console.error('Error processing checkout:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error processing payment' },
      { status: 500 }
    )
  }
}