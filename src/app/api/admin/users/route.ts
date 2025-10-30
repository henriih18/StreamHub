import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userCache } from '@/lib/cache'
import { withAdminAuth } from '@/lib/admin-auth'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const cacheKey = 'admin:users:list'
    let users = userCache.get(cacheKey)
    
    if (!users) {
      users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          credits: true,
          totalSpent: true,
          role: true,
          createdAt: true,
          isBlocked: true,
          blockReason: true,
          blockExpiresAt: true,
          isActive: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: {
          totalSpent: 'desc'
        }
      })

      // Transform the data to match the expected interface
      users = users.map(user => ({
        ...user,
        name: user.fullName,
        isActive: !user.isBlocked
      }))
      
      // Cache for 3 minutes
      userCache.set(cacheKey, users, 3 * 60 * 1000)
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
  }
})