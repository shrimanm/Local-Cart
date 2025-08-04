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

    const { itemId } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const result = await db.collection("cart").deleteOne({
      _id: new ObjectId(itemId),
      userId: new ObjectId(decoded.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item removed successfully" })
  } catch (error) {
    console.error("Remove cart item error:", error)
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 })
  }
}
