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

    const shop = await db.collection("shops").findOne({ userId: new ObjectId(decoded.userId) })
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    const formattedShop = {
      ...shop,
      id: shop._id.toString(),
      _id: undefined,
      userId: undefined,
    }

    return NextResponse.json({ shop: formattedShop })
  } catch (error) {
    console.error("Get shop error:", error)
    return NextResponse.json({ error: "Failed to get shop" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const updateData = await request.json()
    const db = await connectToDatabase()

    const result = await db.collection("shops").updateOne(
      { userId: new ObjectId(decoded.userId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Shop updated successfully" })
  } catch (error) {
    console.error("Update shop error:", error)
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 })
  }
}
