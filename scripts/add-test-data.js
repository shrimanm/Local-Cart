const { MongoClient, ObjectId } = require('mongodb')

// You need to replace this with your actual MongoDB URI from .env.local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://18shrimanmogaveer:7a9Z96gyr8ULeFgH@cluster0.aicdsmg.mongodb.net/kshop?retryWrites=true&w=majority&appName=Cluster0'

async function addTestData() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db()
    
    console.log('Adding test data...')
    
    // 1. Add towns (if not exists)
    const towns = ['KOTESHWARA', 'Kundapura', 'Mumbai']
    for (const townName of towns) {
      const existingTown = await db.collection('towns').findOne({ name: townName })
      if (!existingTown) {
        await db.collection('towns').insertOne({
          name: townName,
          createdAt: new Date()
        })
        console.log(`✓ Added ${townName} town`)
      }
    }
    
    // 2. Add test users for merchants
    const mumbaiUser = await db.collection('users').insertOne({
      phone: '9876543210',
      name: 'Mumbai Merchant',
      email: 'mumbai@example.com',
      role: 'merchant',
      isVerified: true,
      createdAt: new Date()
    })
    
    const koteshwaraUser = await db.collection('users').insertOne({
      phone: '9876543211',
      name: 'Koteshwara Merchant',
      email: 'koteshwara@example.com',
      role: 'merchant',
      isVerified: true,
      createdAt: new Date()
    })
    
    const kundapuraUser = await db.collection('users').insertOne({
      phone: '9876543212',
      name: 'Kundapura Merchant',
      email: 'kundapura@example.com',
      role: 'merchant',
      isVerified: true,
      createdAt: new Date()
    })
    console.log('✓ Added test merchant users')
    
    // 3. Add shops for merchants
    const mumbaiShop = await db.collection('shops').insertOne({
      userId: mumbaiUser.insertedId,
      name: 'Mumbai Fashion Store',
      description: 'Premium fashion store in Mumbai',
      address: '123 Fashion Street, Mumbai, Maharashtra',
      town: 'Mumbai',
      contactDetails: '9876543210',
      isVerified: true,
      createdAt: new Date()
    })
    
    const koteshwaraShop = await db.collection('shops').insertOne({
      userId: koteshwaraUser.insertedId,
      name: 'Koteshwara Local Store',
      description: 'Best local store in Koteshwara',
      address: '456 Main Road, Koteshwara, Karnataka',
      town: 'KOTESHWARA',
      contactDetails: '9876543211',
      isVerified: true,
      createdAt: new Date()
    })
    
    const kundapuraShop = await db.collection('shops').insertOne({
      userId: kundapuraUser.insertedId,
      name: 'Kundapura Market',
      description: 'Traditional market in Kundapura',
      address: '789 Market Street, Kundapura, Karnataka',
      town: 'Kundapura',
      contactDetails: '9876543212',
      isVerified: true,
      createdAt: new Date()
    })
    console.log('✓ Added test shops in Mumbai, Koteshwara and Kundapura')
    
    // 4. Add test products for both cities
    const mumbaiProducts = [
      {
        name: 'Mumbai Special T-Shirt',
        description: 'Premium cotton t-shirt from Mumbai',
        price: 899,
        originalPrice: 1299,
        category: 'Men',
        brand: 'Mumbai Fashion',
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Blue', 'White', 'Black'],
        stock: 50,
        shopId: mumbaiShop.insertedId,
        isActive: true,
        rating: 4.5,
        reviewCount: 12,
        createdAt: new Date()
      },
      {
        name: 'Mumbai Style Jeans',
        description: 'Trendy jeans from Mumbai fashion district',
        price: 1599,
        originalPrice: 2199,
        category: 'Men',
        brand: 'Mumbai Denim',
        images: ['/placeholder.svg'],
        sizes: ['28', '30', '32', '34', '36'],
        colors: ['Blue', 'Black'],
        stock: 30,
        shopId: mumbaiShop.insertedId,
        isActive: true,
        rating: 4.2,
        reviewCount: 8,
        createdAt: new Date()
      },
      {
        name: 'Mumbai Designer Kurta',
        description: 'Traditional kurta with modern Mumbai style',
        price: 1299,
        originalPrice: 1899,
        category: 'Women',
        brand: 'Mumbai Ethnic',
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Pink', 'Yellow', 'Green'],
        stock: 25,
        shopId: mumbaiShop.insertedId,
        isActive: true,
        rating: 4.7,
        reviewCount: 15,
        createdAt: new Date()
      }
    ]
    
    const koteshwaraProducts = [
      {
        name: 'Koteshwara Beach T-Shirt',
        description: 'Comfortable beach wear from Koteshwara',
        price: 699,
        originalPrice: 999,
        category: 'Men',
        brand: 'Coastal Wear',
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Ocean Blue', 'Sand Beige', 'White'],
        stock: 40,
        shopId: koteshwaraShop.insertedId,
        isActive: true,
        rating: 4.3,
        reviewCount: 18,
        createdAt: new Date()
      },
      {
        name: 'Koteshwara Traditional Saree',
        description: 'Beautiful traditional saree from coastal Karnataka',
        price: 2499,
        originalPrice: 3499,
        category: 'Women',
        brand: 'Coastal Traditions',
        images: ['/placeholder.svg'],
        sizes: ['Free Size'],
        colors: ['Red', 'Green', 'Blue'],
        stock: 15,
        shopId: koteshwaraShop.insertedId,
        isActive: true,
        rating: 4.8,
        reviewCount: 22,
        createdAt: new Date()
      },
      {
        name: 'Koteshwara Fisherman Shorts',
        description: 'Comfortable shorts perfect for coastal life',
        price: 799,
        originalPrice: 1199,
        category: 'Men',
        brand: 'Coastal Comfort',
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Navy', 'Khaki', 'Grey'],
        stock: 35,
        shopId: koteshwaraShop.insertedId,
        isActive: true,
        rating: 4.1,
        reviewCount: 9,
        createdAt: new Date()
      }
    ]
    
    const kundapuraProducts = [
      {
        name: 'Kundapura Spice Mix',
        description: 'Authentic spice mix from Kundapura',
        price: 299,
        originalPrice: 399,
        category: 'Home',
        brand: 'Kundapura Spices',
        images: ['/placeholder.svg'],
        sizes: ['250g', '500g', '1kg'],
        colors: ['Natural'],
        stock: 100,
        shopId: kundapuraShop.insertedId,
        isActive: true,
        rating: 4.6,
        reviewCount: 25,
        createdAt: new Date()
      },
      {
        name: 'Kundapura Cotton Shirt',
        description: 'Comfortable cotton shirt from Kundapura',
        price: 1199,
        originalPrice: 1599,
        category: 'Men',
        brand: 'Kundapura Textiles',
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Blue', 'Cream'],
        stock: 45,
        shopId: kundapuraShop.insertedId,
        isActive: true,
        rating: 4.4,
        reviewCount: 16,
        createdAt: new Date()
      },
      {
        name: 'Kundapura Handloom Dupatta',
        description: 'Beautiful handloom dupatta from Kundapura weavers',
        price: 899,
        originalPrice: 1299,
        category: 'Women',
        brand: 'Kundapura Handlooms',
        images: ['/placeholder.svg'],
        sizes: ['Free Size'],
        colors: ['Maroon', 'Green', 'Orange'],
        stock: 20,
        shopId: kundapuraShop.insertedId,
        isActive: true,
        rating: 4.9,
        reviewCount: 31,
        createdAt: new Date()
      }
    ]
    
    await db.collection('products').insertMany([...mumbaiProducts, ...koteshwaraProducts, ...kundapuraProducts])
    console.log('✓ Added 9 test products (3 Mumbai + 3 Koteshwara + 3 Kundapura)')
    
    console.log('\n🎉 Test data added successfully!')
    console.log('- Towns: KOTESHWARA, Kundapura, Mumbai')
    console.log('- Mumbai: Mumbai Fashion Store (3 products)')
    console.log('- Koteshwara: Koteshwara Local Store (3 products)')
    console.log('- Kundapura: Kundapura Market (3 products)')
    console.log('- Total: 9 products across 3 cities')
    
  } catch (error) {
    console.error('Error adding test data:', error)
  } finally {
    await client.close()
  }
}

addTestData()