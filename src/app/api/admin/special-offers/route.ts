import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userCache } from '@/lib/cache'

export async function GET() {
  try {
    const cacheKey = 'admin:special-offers:list'
    let cachedOffers = userCache.get(cacheKey)
    
    if (!cachedOffers) {
      // First, check and update expired offers
      const now = new Date()
      await db.specialOffer.updateMany({
        where: {
          expiresAt: {
            lt: now
          },
          isActive: true
        },
        data: {
          isActive: false
        }
      })

      const specialOffers = await db.specialOffer.findMany({
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          },
          streamingAccount: {
            select: {
              name: true,
              type: true,
              price: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Transform the data to match the expected interface
      cachedOffers = specialOffers.map(offer => ({
        ...offer,
        user: {
          ...offer.user,
          name: offer.user.fullName
        }
      }))
      
      // Cache for 5 minutes - offers can change frequently
      userCache.set(cacheKey, cachedOffers, 5 * 60 * 1000)
    }

    return NextResponse.json(cachedOffers)
  } catch (error) {
    console.error('Error fetching special offers:', error)
    return NextResponse.json({ error: 'Error fetching special offers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userIds, streamingAccountId, discountPercentage, expiresAt } = await request.json()

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !streamingAccountId || !discountPercentage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create special offers for each selected user
    const specialOffers = await Promise.all(
      userIds.map((userId: string) =>
        db.specialOffer.create({
          data: {
            userId,
            streamingAccountId,
            discountPercentage: parseFloat(discountPercentage),
            targetSpent: 0, // Default value since we removed this field from frontend
            expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59.999Z') : null
          },
          include: {
            user: {
              select: {
                email: true,
                fullName: true
              }
            },
            streamingAccount: {
              select: {
                name: true,
                type: true
              }
            }
          }
        })
      )
    )

    // Transform the data to match the expected interface
    const transformedOffers = specialOffers.map(offer => ({
      ...offer,
      user: {
        ...offer.user,
        name: offer.user.fullName
      }
    }))

    // Invalidate cache when new offers are created
    userCache.delete('admin:special-offers:list')

    return NextResponse.json(transformedOffers)
  } catch (error) {
    console.error('Error creating special offers:', error)
    return NextResponse.json({ error: 'Error creating special offers' }, { status: 500 })
  }
}