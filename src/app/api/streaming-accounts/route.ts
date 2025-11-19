import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    let userRole = "USER";
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      userRole = user?.role || "USER";
    }
    
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
        },
        vendorPricing: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 🔥 NUEVO: Calcular stock real considerando reservas
    const accountsWithRealStock = await Promise.all(
      accounts.map(async (account) => {
        // Verificar reservas activas para esta cuenta
        const reservations = await db.stockReservation.aggregate({
          where: {
            accountId: account.id,
            accountType: 'STREAMING',
            expiresAt: { gt: new Date() }
          },
          _sum: { quantity: true }
        })

        const reservedQuantity = reservations._sum.quantity || 0
        
        // Calcular stock real considerando reservas
        const realAccountStock = Math.max(0, (account.accountStocks?.length || 0) - reservedQuantity)
        const realProfileStock = Math.max(0, (account.profileStocks?.length || 0) - reservedQuantity)

        // Actualizar los arrays de stock con cantidades reales
        /* const updatedAccountStocks = Array(realAccountStock).fill(null).map((_, index) => 
          account.accountStocks[index] || { id: `temp-${index}`, isAvailable: true }
        )
        
        const updatedProfileStocks = Array(realProfileStock).fill(null).map((_, index) => 
          account.profileStocks[index] || { id: `temp-${index}`, isAvailable: true }
        ) */

        const updatedAccountStocks = account.accountStocks
  .filter(stock => stock.isAvailable)
  .slice(0, realAccountStock)

const updatedProfileStocks = account.profileStocks
  .filter(stock => stock.isAvailable)
  .slice(0, realProfileStock)

        return {
          ...account,
          accountStocks: updatedAccountStocks,
          profileStocks: updatedProfileStocks
        }
      })
    )

    const processedAccounts = accountsWithRealStock.map(account => {
      let finalPrice = account.price;
      let originalPrice: number | undefined = undefined;

      // Si es VENDEDOR y tiene configuración de precios, aplicar descuento
      if (userRole === 'VENDEDOR' && account.vendorPricing && account.vendorPricing.isActive) {
        originalPrice = account.price;
        finalPrice = account.vendorPricing.vendorPrice;
      }

      return {
        ...account,
        price: finalPrice,
        originalPrice: originalPrice
      };
    });

    // Get exclusive accounts
    let exclusiveAccounts: any[] = []
    
    // Build where condition based on whether user is logged in
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

    // 🔥 NUEVO: Calcular stock real para cuentas exclusivas
    const exclusiveAccountsWithRealStock = await Promise.all(
      exclusiveAccounts.map(async (account) => {
        // Verificar reservas activas para esta cuenta exclusiva
        const reservations = await db.stockReservation.aggregate({
          where: {
            accountId: account.id,
            accountType: 'EXCLUSIVE',
            expiresAt: { gt: new Date() }
          },
          _sum: { quantity: true }
        })

        const reservedQuantity = reservations._sum.quantity || 0
        const realAvailableStock = Math.max(0, (account.exclusiveStocks?.length || 0) - reservedQuantity)

        // Actualizar los stocks con cantidades reales
        const updatedExclusiveStocks = Array(realAvailableStock).fill(null).map((_, index) => 
          account.exclusiveStocks[index] || { id: `temp-${index}`, isAvailable: true }
        )

        return {
          ...account,
          exclusiveStocks: updatedExclusiveStocks
        }
      })
    )

    // Get special offers for user
    let specialOffers: any[] = []
    if (userId) {
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
              accountStocks: true,
              profileStocks: true,
              vendorPricing: true
            }
          }
        }
      })
    }
    
    // 🔥 NUEVO: Aplicar ofertas especiales a las cuentas con stock real
    const finalAccounts = processedAccounts.map(account => {
      // Buscar si hay oferta especial para esta cuenta
      const matchingOffer = specialOffers.find(offer => 
        offer.streamingAccount && offer.streamingAccount.id === account.id
      );

      if (matchingOffer) {
        const offerPrice = matchingOffer.discountPercentage
          ? account.price * (1 - matchingOffer.discountPercentage / 100)
          : matchingOffer.specialPrice || account.price;

        return {
          ...account,
          specialOffer: matchingOffer,
          originalPrice: account.originalPrice || account.price,
          price: offerPrice
        };
      }

      return account;
    });

    return NextResponse.json({
      regularAccounts: finalAccounts,
      exclusiveAccounts: exclusiveAccountsWithRealStock,
      specialOffers
    })
  } catch (error) {
    console.error('Error fetching streaming accounts:', error)
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
    console.error('Error creating streaming account:', error)
    return NextResponse.json(
      { error: 'Error al crear una cuenta de streaming' },
      { status: 500 }
    )
  }
}