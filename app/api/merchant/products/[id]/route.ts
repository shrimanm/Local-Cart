import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectToDatabase()

    // Get product by ID and verify it belongs to the merchant
    const product = await db.collection("products").findOne({
      _id: new ObjectId(params.id),
      $or: [
        { merchantId: new ObjectId(decoded.userId) },
        { shopId: new ObjectId(decoded.userId) }
      ]
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Transform the product data
    const transformedProduct = {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      brand: product.brand,
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock,
      isActive: product.isActive
    }

    return NextResponse.json({ product: transformedProduct })
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Failed to get product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const productData = await request.json()
    const db = await connectToDatabase()

    // Verify product belongs to merchant
    const existingProduct = await db.collection("products").findOne({
      _id: new ObjectId(params.id),
      $or: [
        { merchantId: new ObjectId(decoded.userId) },
        { shopId: new ObjectId(decoded.userId) }
      ]
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Update product
    const updateData = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.originalPrice,
      category: productData.category,
      brand: productData.brand,
      images: productData.images,
      sizes: productData.sizes,
      colors: productData.colors,
      stock: productData.stock,
      isActive: productData.isActive,
      updatedAt: new Date()
    }

    await db.collection("products").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true, message: "Product updated successfully" })
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}