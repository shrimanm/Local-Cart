const { MongoClient } = require("mongodb")

async function initDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set")
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()

    // Create indexes for better performance
    await db.collection("users").createIndex({ phone: 1 }, { unique: true })
    await db.collection("users").createIndex({ email: 1 })
    console.log("Created users indexes")

    await db.collection("shops").createIndex({ userId: 1 })
    await db.collection("shops").createIndex({ isVerified: 1 })
    console.log("Created shops indexes")

    await db.collection("products").createIndex({ shopId: 1 })
    await db.collection("products").createIndex({ category: 1 })
    await db.collection("products").createIndex({ name: "text", description: "text" })
    await db.collection("products").createIndex({ isActive: 1 })
    console.log("Created products indexes")

    await db.collection("cart").createIndex({ userId: 1 })
    await db.collection("cart").createIndex({ userId: 1, productId: 1 })
    console.log("Created cart indexes")

    await db.collection("wishlist").createIndex({ userId: 1 })
    await db.collection("wishlist").createIndex({ userId: 1, productId: 1 }, { unique: true })
    console.log("Created wishlist indexes")

    await db.collection("booked").createIndex({ userId: 1 })
    await db.collection("booked").createIndex({ productId: 1 })
    await db.collection("booked").createIndex({ status: 1 })
    console.log("Created booked indexes")

    await db.collection("purchased").createIndex({ userId: 1 })
    await db.collection("purchased").createIndex({ productId: 1 })
    await db.collection("purchased").createIndex({ orderId: 1 })
    await db.collection("purchased").createIndex({ status: 1 })
    console.log("Created purchased indexes")

    await db.collection("orders").createIndex({ userId: 1 })
    await db.collection("orders").createIndex({ status: 1 })
    console.log("Created orders indexes")

    await db.collection("addresses").createIndex({ userId: 1 })
    console.log("Created addresses indexes")

    await db.collection("otpSessions").createIndex({ phone: 1 }, { unique: true })
    await db.collection("otpSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    console.log("Created OTP sessions indexes")

    console.log("MongoDB initialization completed successfully!")
  } catch (error) {
    console.error("Error initializing MongoDB:", error)
    throw error
  } finally {
    await client.close()
  }
}

async function main() {
  console.log("Initializing MongoDB...")
  await initDB()
  console.log("MongoDB initialization complete!")
  process.exit(0)
}

main().catch((error) => {
  console.error("MongoDB initialization failed:", error)
  process.exit(1)
})
