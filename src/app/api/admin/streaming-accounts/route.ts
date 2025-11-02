import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userCache } from '@/lib/cache'
import { withAdminAuth } from '@/lib/admin-auth'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const cacheKey = 'admin:streaming-accounts:list'
    let accounts = userCache.get(cacheKey)
    
    if (!accounts) {
      accounts = await db.streamingAccount.findMany({
        include: {
          _count: {
            select: {
              accountStocks: true,
              profileStocks: true,
              orders: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      // Cache for 7 minutes - accounts change moderately
      userCache.set(cacheKey, accounts, 7 * 60 * 1000)
    }

    return NextResponse.json(accounts)
  } catch (error) {
    //console.error('Error fetching streaming accounts:', error)
    return NextResponse.json({ error: 'Error al obtener las cuentas de streaming' }, { status: 500 })
  }
})

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const { 
      name, 
      description,
      type, 
      price, 
      duration, 
      quality, 
      screens, 
      saleType, 
      maxProfiles, 
      pricePerProfile 
    } = await request.json()

    // Validate required fields
    if (!name || !description || !type || !price || !duration || !quality || !screens) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const streamingAccount = await db.streamingAccount.create({
      data: {
        name,
        description,
        type,
        price: parseFloat(price),
        duration,
        quality,
        screens: parseInt(screens),
        saleType: saleType || 'FULL',
        maxProfiles: maxProfiles ? parseInt(maxProfiles) : null,
        pricePerProfile: pricePerProfile ? parseFloat(pricePerProfile) : null
      }
    })

    // Invalidate cache when new account is created
    userCache.delete('admin:streaming-accounts:list')

    return NextResponse.json(streamingAccount)
  } catch (error) {
    //console.error('Error creating streaming account:', error)
    return NextResponse.json({ error: 'Error al crear una cuenta de streaming' }, { status: 500 })
  }
})