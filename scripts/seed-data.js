const { MongoClient } = require("mongodb")
require("dotenv").config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/myntra-clone"

const sampleUsers = [
  {
    phone: "9999999999",
    name: "Admin User",
    email: "admin@myntra.com",
    role: "admin",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    phone: "8888888888",
    name: "Merchant User",
    email: "merchant@myntra.com",
    role: "merchant",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    phone: "7777777777",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    isVerified: true,
    age: 28,
    gender: "male",
    city: "Mumbai",
    interests: ["Men's Fashion", "Footwear", "Electronics"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const sampleCategories = [
  "Men's Clothing",
  "Women's Clothing",
  "Kids Clothing",
  "Footwear",
  "Accessories",
  "Beauty & Personal Care",
  "Home & Living",
  "Sports & Fitness",
]

const sampleProducts = [
  {
    name: "Classic White T-Shirt",
    description: "Premium cotton t-shirt with comfortable fit. Perfect for casual wear.",
    price: 599,
    originalPrice: 799,
    category: "Men's Clothing",
    brand: "Myntra Fashion",
    images: [
      "https://images.unsplash.com/photo-1521572163474-b8f02a3ae446?w=500",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black", "Navy"],
    stock: 100,
    rating: 4.2,
    reviewCount: 156,
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Floral Summer Dress",
    description: "Beautiful floral print dress perfect for summer occasions.",
    price: 1299,
    originalPrice: 1799,
    category: "Women's Clothing",
    brand: "Fashion Hub",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500",
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Pink", "Blue", "Yellow"],
    stock: 75,
    rating: 4.5,
    reviewCount: 89,
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Running Shoes",
    description: "Comfortable running shoes with excellent grip and cushioning.",
    price: 2499,
    originalPrice: 3499,
    category: "Footwear",
    brand: "SportMax",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500",
    ],
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["Black", "White", "Red", "Blue"],
    stock: 50,
    rating: 4.7,
    reviewCount: 234,
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Leather Handbag",
    description: "Elegant leather handbag with multiple compartments.",
    price: 1899,
    originalPrice: 2499,
    category: "Accessories",
    brand: "LuxeBags",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500",
    ],
    sizes: ["One Size"],
    colors: ["Brown", "Black", "Tan"],
    stock: 30,
    rating: 4.3,
    reviewCount: 67,
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Kids Cartoon T-Shirt",
    description: "Fun cartoon print t-shirt for kids. Soft and comfortable fabric.",
    price: 399,
    originalPrice: 599,
    category: "Kids Clothing",
    brand: "KidsWear",
    images: [
      "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=500",
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500",
    ],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: ["Red", "Blue", "Green", "Yellow"],
    stock: 80,
    rating: 4.4,
    reviewCount: 45,
    isActive: true,
    createdAt: new Date(),
  },
]

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()

    // Clear existing data
    console.log("Clearing existing data...")
    await db.collection("users").deleteMany({})
    await db.collection("products").deleteMany({})
    await db.collection("shops").deleteMany({})

    // Insert sample users
    console.log("Inserting sample users...")
    const userResult = await db.collection("users").insertMany(sampleUsers)
    console.log(`Inserted ${userResult.insertedCount} users`)

    // Create a sample shop for the merchant
    const merchantUser = await db.collection("users").findOne({ role: "merchant" })
    if (merchantUser) {
      const sampleShop = {
        userId: merchantUser._id,
        name: "Fashion Store",
        description: "Your one-stop destination for trendy fashion",
        address: "123 Fashion Street, Mumbai, Maharashtra 400001",
        contactDetails: "contact@fashionstore.com | +91-8888888888",
        isVerified: true,
        createdAt: new Date(),
      }

      const shopResult = await db.collection("shops").insertOne(sampleShop)
      console.log("Created sample shop")

      // Add shopId to products
      const productsWithShop = sampleProducts.map((product) => ({
        ...product,
        shopId: shopResult.insertedId,
      }))

      // Insert sample products
      console.log("Inserting sample products...")
      const productResult = await db.collection("products").insertMany(productsWithShop)
      console.log(`Inserted ${productResult.insertedCount} products`)
    }

    // Create some sample notifications
    const sampleNotifications = [
      {
        userId: userResult.insertedIds[2], // Regular user
        title: "Welcome to Myntra!",
        message: "Start exploring our amazing collection of fashion items.",
        type: "system",
        isRead: false,
        createdAt: new Date(),
      },
      {
        userId: userResult.insertedIds[2],
        title: "Special Offer!",
        message: "Get 20% off on your first purchase. Use code WELCOME20",
        type: "promotion",
        isRead: false,
        createdAt: new Date(),
      },
    ]

    await db.collection("notifications").insertMany(sampleNotifications)
    console.log("Created sample notifications")

    console.log("\n✅ Database seeded successfully!")
    console.log("\n📋 Test Accounts:")
    console.log("👑 Admin: Phone: 9999999999, OTP: 123456")
    console.log("🏪 Merchant: Phone: 8888888888, OTP: 123456")
    console.log("👤 User: Phone: 7777777777, OTP: 123456")
    console.log("\n🛍️ Sample products and shop created!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seedDatabase()
