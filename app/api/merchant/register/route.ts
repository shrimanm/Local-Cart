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

    const { name, description, address, town, locationUrl, contactDetails } = await request.json()

    if (!name || !address || !town || !contactDetails) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Check if user already has a shop
    const existingShop = await db.collection("shops").findOne({ userId: new ObjectId(decoded.userId) })

    if (existingShop) {
      return NextResponse.json({ error: "You already have a registered shop" }, { status: 400 })
    }

    // Create shop
    const shopResult = await db.collection("shops").insertOne({
      userId: new ObjectId(decoded.userId),
      name,
      description,
      address,
      town,
      locationUrl,
      contactDetails,
      isVerified: false, // Admin needs to verify
      createdAt: new Date(),
    })

    // Update user role to merchant (only if not admin)
    const currentUser = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    if (currentUser?.role !== "admin") {
      await db.collection("users").updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $set: {
            role: "merchant",
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({
      message: "Shop registered successfully",
      shopId: shopResult.insertedId.toString(),
    })
  } catch (error) {
    console.error("Register shop error:", error)
    return NextResponse.json({ error: "Failed to register shop" }, { status: 500 })
  }
}
