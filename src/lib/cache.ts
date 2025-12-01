interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

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

    // Comprobar si el artículo ha caducado
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

  // Limpiar artículos caducados
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Obtener estadísticas de caché
  size(): number {
    return this.cache.size;
  }

  // Comprobar si la clave existe y no ha caducado
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Crear instancia única
export const userCache = new MemoryCache();

// Limpieza automática cada 5 minutos
setInterval(() => {
  userCache.cleanup();
}, 5 * 60 * 1000);

// Funciones auxiliares para el almacenamiento en caché de usuarios
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
