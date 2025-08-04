import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"

// Simple JWT verification function
function verifyJWT(token: string): any {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString())

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
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

    // Get cart items with product details
    const cartItems = await db
      .collection("cart")
      .aggregate([
        { $match: { userId: new ObjectId(decoded.userId) } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 1,
            quantity: 1,
            size: 1,
            color: 1,
            createdAt: 1,
            product: {
              _id: 1,
              name: 1,
              price: 1,
              originalPrice: 1,
              images: 1,
              brand: 1,
              stock: 1,
            },
          },
        },
      ])
      .toArray()

    // Transform cart items
    const transformedItems = cartItems.map((item) => ({
      id: item._id.toString(),
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      createdAt: item.createdAt,
      product: {
        ...item.product,
        id: item.product._id.toString(),
        _id: undefined,
      },
    }))

    // Calculate totals
    const subtotal = transformedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const originalTotal = transformedItems.reduce(
      (sum, item) => sum + (item.product.originalPrice || item.product.price) * item.quantity,
      0,
    )
    const savings = originalTotal - subtotal
    const shipping = subtotal > 999 ? 0 : 99
    const total = subtotal + shipping

    return NextResponse.json({
      items: transformedItems,
      summary: {
        itemCount: transformedItems.length,
        totalQuantity: transformedItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        originalTotal,
        savings,
        shipping,
        total,
      },
    })
  } catch (error) {
    console.error("Get cart error:", error)
    return NextResponse.json({ error: "Failed to get cart" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { productId, quantity = 1, size, color } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Check if product exists and is active
    const product = await db.collection("products").findOne({
      _id: new ObjectId(productId),
      isActive: true,
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if item already exists in cart
    const existingItem = await db.collection("cart").findOne({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(productId),
      size: size || null,
      color: color || null,
    })

    if (existingItem) {
      // Update quantity
      await db.collection("cart").updateOne(
        { _id: existingItem._id },
        {
          $inc: { quantity: quantity },
          $set: { updatedAt: new Date() },
        },
      )
    } else {
      // Add new item
      await db.collection("cart").insertOne({
        userId: new ObjectId(decoded.userId),
        productId: new ObjectId(productId),
        quantity,
        size: size || null,
        color: color || null,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({ message: "Item added to cart" })
  } catch (error) {
    console.error("Add to cart error:", error)
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    // Clear entire cart
    await db.collection("cart").deleteMany({
      userId: new ObjectId(decoded.userId),
    })

    return NextResponse.json({ message: "Cart cleared" })
  } catch (error) {
    console.error("Clear cart error:", error)
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 })
  }
}
