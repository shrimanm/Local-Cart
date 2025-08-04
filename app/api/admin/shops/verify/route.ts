import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { verifyJWT } from "@/lib/utils"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
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

    const { shopId, isVerified } = await request.json()

    if (!shopId || typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "Missing shopId or isVerified" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const result = await db.collection("shops").updateOne(
      { _id: new ObjectId(shopId) },
      {
        $set: {
          isVerified,
          verifiedAt: isVerified ? new Date() : null,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    return NextResponse.json({ message: `Shop ${isVerified ? "verified" : "unverified"} successfully` })
  } catch (error) {
    console.error("Update shop verification error:", error)
    return NextResponse.json({ error: "Failed to update shop verification" }, { status: 500 })
  }
}
