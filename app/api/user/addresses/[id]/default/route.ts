import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { verifyJWT } from "@/lib/utils"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectToDatabase()

    // Unset all default addresses for this user
    await db
      .collection("addresses")
      .updateMany({ userId: new ObjectId(decoded.userId) }, { $set: { isDefault: false } })

    // Set the specified address as default
    const result = await db
      .collection("addresses")
      .updateOne(
        { _id: new ObjectId(params.id), userId: new ObjectId(decoded.userId) },
        { $set: { isDefault: true, updatedAt: new Date() } },
      )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Default address updated successfully" })
  } catch (error) {
    console.error("Set default address error:", error)
    return NextResponse.json({ error: "Failed to set default address" }, { status: 500 })
  }
}
