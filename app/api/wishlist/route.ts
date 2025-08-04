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

    // Get wishlist items with product details (only active products)
    const wishlistItems = await db
      .collection("wishlist")
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
        { $match: { "product.isActive": true } },
        {
          $lookup: {
            from: "shops",
            localField: "product.shopId",
            foreignField: "_id",
            as: "shop",
          },
        },
        { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            productId: 1,
            size: 1,
            variant: 1,
            color: 1,
            createdAt: 1,
            product: {
              _id: 1,
              name: 1,
              price: 1,
              originalPrice: 1,
              images: 1,
              brand: 1,
              rating: 1,
              reviewCount: 1,
              stock: 1,
              category: 1,
            },
            shopName: "$shop.name",
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    // Transform the data
    const transformedItems = wishlistItems.map((item) => ({
      id: item._id.toString(),
      productId: item.productId.toString(),
      size: item.size,
      variant: item.variant,
      color: item.color,
      product: {
        ...item.product,
        id: item.product._id.toString(),
        _id: undefined,
        shopName: item.shopName,
      },
      createdAt: item.createdAt,
    }))

    return NextResponse.json({
      items: transformedItems,
      count: transformedItems.length,
    })
  } catch (error) {
    console.error("Get wishlist error:", error)
    return NextResponse.json({ error: "Failed to get wishlist" }, { status: 500 })
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

    const { productId, size, variant, color } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Check if product exists
    const product = await db.collection("products").findOne({
      _id: new ObjectId(productId),
      isActive: true,
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if item is already in wishlist
    const existingItem = await db.collection("wishlist").findOne({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(productId),
    })

    if (existingItem) {
      // Remove from wishlist
      await db.collection("wishlist").deleteOne({
        userId: new ObjectId(decoded.userId),
        productId: new ObjectId(productId),
      })

      // Also remove any booking details for this item
      await db.collection("booked").deleteMany({
        userId: new ObjectId(decoded.userId),
        productId: new ObjectId(productId),
      })

      return NextResponse.json({
        success: true,
        action: "removed",
        message: "Item removed from wishlist",
      })
    } else {
      // Add to wishlist
      await db.collection("wishlist").insertOne({
        userId: new ObjectId(decoded.userId),
        productId: new ObjectId(productId),
        size: size || null,
        variant: variant || null,
        color: color || null,
        createdAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        action: "added",
        message: "Item added to wishlist",
      })
    }
  } catch (error) {
    console.error("Toggle wishlist error:", error)
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const result = await db.collection("wishlist").deleteOne({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(productId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found in wishlist" }, { status: 404 })
    }

    // Also remove any booking details for this item
    await db.collection("booked").deleteMany({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(productId),
    })

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist",
    })
  } catch (error) {
    console.error("Remove from wishlist error:", error)
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 })
  }
}
