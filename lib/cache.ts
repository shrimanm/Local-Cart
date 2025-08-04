// Simple in-memory cache (in production, use Redis)
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expiry })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.clear()
  }
}

export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  product: (productId: string) => `product:${productId}`,
  products: (category?: string, page?: number) => `products:${category || 'all'}:${page || 1}`,
  shop: (shopId: string) => `shop:${shopId}`,
  wishlist: (userId: string) => `wishlist:${userId}`,
  cart: (userId: string) => `cart:${userId}`,
  orders: (userId: string) => `orders:${userId}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`
}

// Cache helper functions
export function getCachedData<T>(key: string): T | null {
  return cache.get<T>(key)
}

export function setCachedData(key: string, data: any, ttlSeconds: number = 300): void {
  cache.set(key, data, ttlSeconds)
}

export function invalidateCache(pattern: string): void {
  // Simple pattern matching for cache invalidation
  const keys = Array.from((cache as any).cache.keys()) as string[]
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  })
}