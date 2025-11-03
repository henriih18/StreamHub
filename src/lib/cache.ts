// Memory cache implementation for user data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  size(): number {
    return this.cache.size;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Create singleton instance
export const userCache = new MemoryCache();

// Auto cleanup every 5 minutes
setInterval(() => {
  userCache.cleanup();
}, 5 * 60 * 1000);

// Helper functions for user caching
export const cacheKeys = {
  userByEmail: (email: string) => `user:${email}`,
  userPermissions: (userId: string) => `user:permissions:${userId}`,
  userStats: (userId: string) => `user:stats:${userId}`,
};

export function invalidateUserCache(email: string, userId?: string): void {
  userCache.delete(cacheKeys.userByEmail(email));
  if (userId) {
    userCache.delete(cacheKeys.userPermissions(userId));
    userCache.delete(cacheKeys.userStats(userId));
  }
}
