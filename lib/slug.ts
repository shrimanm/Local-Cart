export function generateSlug(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50) // Limit length
  
  // Add last 8 characters of ID for uniqueness
  const shortId = id.slice(-8)
  return `${slug}-${shortId}`
}

export function extractIdFromSlug(slug: string): string {
  // Extract the last 8 characters after the last hyphen
  const parts = slug.split('-')
  const shortId = parts[parts.length - 1]
  
  // This would need to be looked up in database to get full ID
  // For now, return the short ID (you'll need to modify API to handle this)
  return shortId
}

export function createProductUrl(name: string, id: string): string {
  const slug = generateSlug(name, id)
  return `/products/${slug}`
}

export function createUserUrl(type: 'profile' | 'wishlist' | 'orders' | 'addresses'): string {
  const urlMap = {
    profile: '/account/profile',
    wishlist: '/account/wishlist', 
    orders: '/account/orders',
    addresses: '/account/addresses'
  }
  return urlMap[type]
}

export function createMerchantUrl(type: 'dashboard' | 'products' | 'orders' | 'analytics'): string {
  const urlMap = {
    dashboard: '/seller/dashboard',
    products: '/seller/products',
    orders: '/seller/orders', 
    analytics: '/seller/analytics'
  }
  return urlMap[type]
}

export function createAdminUrl(type: 'dashboard' | 'users' | 'shops' | 'analytics'): string {
  const urlMap = {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    shops: '/admin/shops',
    analytics: '/admin/analytics'
  }
  return urlMap[type]
}