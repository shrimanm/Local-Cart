const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

async function optimizeDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    
    // Create indexes for better performance
    console.log('Creating database indexes...')
    
    // Users collection indexes
    await db.collection('users').createIndex({ phone: 1 }, { unique: true })
    await db.collection('users').createIndex({ email: 1 }, { sparse: true })
    await db.collection('users').createIndex({ role: 1 })
    await db.collection('users').createIndex({ createdAt: -1 })
    
    // Products collection indexes
    await db.collection('products').createIndex({ category: 1, isActive: 1 })
    await db.collection('products').createIndex({ shopId: 1, isActive: 1 })
    await db.collection('products').createIndex({ name: 'text', description: 'text' })
    await db.collection('products').createIndex({ price: 1 })
    await db.collection('products').createIndex({ createdAt: -1 })
    await db.collection('products').createIndex({ rating: -1 })
    
    // Orders collection indexes
    await db.collection('orders').createIndex({ userId: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ shopId: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ status: 1 })
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true })
    
    // Shops collection indexes
    await db.collection('shops').createIndex({ userId: 1 }, { unique: true })
    await db.collection('shops').createIndex({ isVerified: 1 })
    await db.collection('shops').createIndex({ category: 1 })
    
    // Wishlist collection indexes
    await db.collection('wishlist').createIndex({ userId: 1, productId: 1 }, { unique: true })
    await db.collection('wishlist').createIndex({ userId: 1 })
    await db.collection('wishlist').createIndex({ productId: 1 })
    
    // Cart collection indexes
    await db.collection('cart').createIndex({ userId: 1, productId: 1 }, { unique: true })
    await db.collection('cart').createIndex({ userId: 1 })
    
    // Reviews collection indexes
    await db.collection('reviews').createIndex({ productId: 1, createdAt: -1 })
    await db.collection('reviews').createIndex({ userId: 1, productId: 1 }, { unique: true })
    
    // Notifications collection indexes
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 })
    await db.collection('notifications').createIndex({ isRead: 1 })
    
    console.log('Database indexes created successfully!')
    
    // Get collection stats
    const collections = ['users', 'products', 'orders', 'shops', 'wishlist', 'cart', 'reviews', 'notifications']
    
    console.log('\nCollection Statistics:')
    for (const collectionName of collections) {
      try {
        const stats = await db.collection(collectionName).stats()
        console.log(`${collectionName}: ${stats.count} documents, ${Math.round(stats.size / 1024)}KB`)
      } catch (error) {
        console.log(`${collectionName}: Collection not found`)
      }
    }
    
  } catch (error) {
    console.error('Database optimization failed:', error)
  } finally {
    await client.close()
    console.log('\nDatabase connection closed')
  }
}

optimizeDatabase()