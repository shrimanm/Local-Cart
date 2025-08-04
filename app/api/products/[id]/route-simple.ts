import { NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const db = await connectToDatabase()

    const product = await db.collection("products").findOne({
      _id: new ObjectId(params.id),
      isActive: true,
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get shop information
    const shop = await db.collection("shops").findOne({ _id: product.shopId })

    const transformedProduct = {
      ...product,
      id: product._id.toString(),
      shopId: product.shopId?.toString() || "",
      shopName: shop?.name || "Unknown Shop",
      _id: undefined,
    }
    
    return NextResponse.json({ product: transformedProduct })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}