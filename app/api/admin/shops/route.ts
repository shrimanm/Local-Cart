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
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectToDatabase()

    const shops = await db
      .collection("shops")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        {
          $unwind: "$owner",
        },
        {
          $project: {
            name: 1,
            description: 1,
            address: 1,
            town: 1,
            contactDetails: 1,
            locationUrl: 1,
            isVerified: 1,
            createdAt: 1,
            ownerName: "$owner.name",
            ownerPhone: "$owner.phone",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    const formattedShops = shops.map((shop) => ({
      ...shop,
      id: shop._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json({ shops: formattedShops })
  } catch (error) {
    console.error("Get shops error:", error)
    return NextResponse.json({ error: "Failed to get shops" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get("shopId")

    if (!shopId) {
      return NextResponse.json({ error: "Shop ID is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Delete shop and related products
    await Promise.all([
      db.collection("shops").deleteOne({ _id: new ObjectId(shopId) }),
      db.collection("products").deleteMany({ shopId: new ObjectId(shopId) })
    ])

    return NextResponse.json({
      success: true,
      message: "Shop deleted successfully",
    })
  } catch (error) {
    console.error("Delete shop error:", error)
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 })
  }
}
