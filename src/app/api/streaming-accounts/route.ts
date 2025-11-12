import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    // console.log('API: Received request for userId:', userId) // Debug log
    
    // Get regular streaming accounts
    const accounts = await db.streamingAccount.findMany({
      where: {
        isActive: true
      },
      include: {
        streamingType: {
          select: {
            icon: true,
            color: true,
            imageUrl: true
          }
        },
        accountStocks: {
          where: {
            isAvailable: true
          }
        },
        profileStocks: {
          where: {
            isAvailable: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get exclusive accounts
    let exclusiveAccounts: any[] = []
    // console.log('API: Fetching exclusive accounts for user:', userId) // Debug log
    
    // Build the where condition based on whether user is logged in
    const whereCondition: any = {
      isActive: true,
      OR: [
        { isPublic: true }
      ]
    }
    
    if (userId) {
      whereCondition.OR.push({
        allowedUsers: {
          some: {
            id: userId
          }
        }
      })
    }
    
    exclusiveAccounts = await db.exclusiveAccount.findMany({
      where: whereCondition,
      include: {
        allowedUsers: userId ? {
          where: {
            id: userId
          }
        } : undefined,
        exclusiveStocks: {
          where: {
            isAvailable: true
          }
        },
        orders: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get special offers for user
    let specialOffers: any[] = []
    if (userId) {
      // console.log('API: Fetching special offers for user:', userId) // Debug log
      specialOffers = await db.specialOffer.findMany({
        where: {
          userId: userId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          streamingAccount: {
            include: {
              streamingType: {
                select: {
                  icon: true,
                  color: true,
                  imageUrl: true
                }
              },
              accountStocks: {
                where: {
                  isAvailable: true
                }
              },
              profileStocks: {
                where: {
                  isAvailable: true
                }
              }
            }
          }
        }
      })
    }

    // console.log('API: Returning - Regular accounts:', accounts.length, 'Exclusive accounts:', exclusiveAccounts.length, 'Special offers:', specialOffers.length) // Debug log

    return NextResponse.json({
      regularAccounts: accounts,
      exclusiveAccounts,
      specialOffers
    })
  } catch (error) {
    //console.error('Error fetching streaming accounts:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cuentas de streaming' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      type,
      duration,
      quality,
      screens,
      saleType,
      maxProfiles,
      pricePerProfile,
      email,
      password,
      stock,
      profilesStock
    } = body

    // Validate required fields
    if (!name || !description || !price || !type || !duration || !quality || !screens) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Create or get streaming type
    let streamingType = await db.streamingType.findUnique({
      where: { name: type }
    })

    if (!streamingType) {
      streamingType = await db.streamingType.create({
        data: {
          name: type,
          description: `${type} streaming service`,
          /* icon: getIconForType(type),
          color: getColorForType(type) */
        }
      })
    }

    const account = await db.streamingAccount.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        type,
        duration,
        quality,
        screens: parseInt(screens),
        saleType: saleType || 'FULL',
        maxProfiles: maxProfiles ? parseInt(maxProfiles) : null,
        pricePerProfile: pricePerProfile ? parseFloat(pricePerProfile) : null
      },
      include: {
        streamingType: true,
        accountStocks: true,
        profileStocks: true
      }
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    //console.error('Error creating streaming account:', error)
    return NextResponse.json(
      { error: 'Error al crear una cuenta de streaming' },
      { status: 500 }
    )
  }
}

/* function getIconForType(type: string): string {
  const icons: { [key: string]: string } = {
    'Netflix': '🎬',
    'Disney+': '🏰',
    'HBO Max': '🎭',
    'Amazon Prime': '📦',
    'Hulu': '📺',
    'Apple TV+': '🍎',
    'Paramount+': '🎪',
    'Peacock': '🦚'
  }
  return icons[type] || '📺'
}

function getColorForType(type: string): string {
  const colors: { [key: string]: string } = {
    'Netflix': 'bg-red-500',
    'Disney+': 'bg-blue-500',
    'HBO Max': 'bg-purple-500',
    'Amazon Prime': 'bg-orange-500',
    'Hulu': 'bg-green-500',
    'Apple TV+': 'bg-gray-800',
    'Paramount+': 'bg-blue-600',
    'Peacock': 'bg-yellow-500'
  }
  return colors[type] || 'bg-gray-500'
} */