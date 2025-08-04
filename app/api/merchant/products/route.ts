import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { verifyJWT } from "@/lib/utils"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)
    if (!decoded || (decoded.role !== "merchant" && decoded.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectToDatabase()

    // Get merchant's shop
    const shop = await db.collection("shops").findOne({ userId: new ObjectId(decoded.userId) })
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    // Get products for this shop
    const products = await db.collection("products").find({ shopId: shop._id }).sort({ createdAt: -1 }).toArray()

    const formattedProducts = products.map((product) => ({
      ...product,
      id: product._id.toString(),
      _id: undefined,
      shopId: undefined,
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error("Get merchant products error:", error)
    return NextResponse.json({ error: "Failed to get products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)
    if (!decoded || (decoded.role !== "merchant" && decoded.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productData = await request.json()

    // Validate required fields
    if (!productData.name || !productData.category || !productData.price || !productData.images?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Get merchant's shop
    const shop = await db.collection("shops").findOne({ userId: new ObjectId(decoded.userId) })
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    // Create product
    const product = {
      ...productData,
      shopId: shop._id,
      userId: new ObjectId(decoded.userId),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
    }

    const result = await db.collection("products").insertOne(product)

    return NextResponse.json({
      message: "Product added successfully",
      productId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Add product error:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}
