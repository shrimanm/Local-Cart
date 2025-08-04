import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"

// Simple JWT verification function
function verifyJWT(token: string): any {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString())

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

    // Get delivered orders
    const orders = await db
      .collection("orders")
      .find({
        userId: new ObjectId(decoded.userId),
        status: "delivered",
      })
      .sort({ createdAt: -1 })
      .toArray()

    const transformedOrders = orders.map((order) => ({
      ...order,
      id: order._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error("Get purchased orders error:", error)
    return NextResponse.json({ error: "Failed to get purchased orders" }, { status: 500 })
  }
}
