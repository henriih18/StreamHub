import { db } from '@/lib/db'
import { userCache, cacheKeys } from '@/lib/cache'

export async function getUserByEmail(email: string) {
  const cacheKey = cacheKeys.userByEmail(email)
  let user = userCache.get(cacheKey)
  
  if (!user) {
    user = await db.user.findUnique({
      where: { email }
    })
    
    if (user) {
      userCache.set(cacheKey, user)
    }
  }
  
  return user
}

export async function getUserById(id: string) {
  const cacheKey = `user:id:${id}`
  let user = userCache.get(cacheKey)
  
  if (!user) {
    user = await db.user.findUnique({
      where: { id }
    })
    
    if (user) {
      userCache.set(cacheKey, user)
    }
  }
  
  return user
}

export function invalidateUserCache(email: string, userId?: string) {
  userCache.delete(cacheKeys.userByEmail(email))
  if (userId) {
    userCache.delete(`user:id:${userId}`)
    userCache.delete(cacheKeys.userPermissions(userId))
    userCache.delete(cacheKeys.userStats(userId))
  }
}

// Function to get multiple users with caching
export async function getUsersWithCache() {
  const cacheKey = 'users:all'
  let users = userCache.get(cacheKey)
  
  if (!users) {
    users = await db.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Cache for shorter time since it's a list
    userCache.set(cacheKey, users, 2 * 60 * 1000) // 2 minutes
  }
  
  return users
}