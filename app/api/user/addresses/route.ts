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
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectToDatabase()

    const addresses = await db
      .collection("addresses")
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray()

    const formattedAddresses = addresses.map((address) => ({
      ...address,
      id: address._id.toString(),
      _id: undefined,
      userId: undefined,
    }))

    return NextResponse.json({ addresses: formattedAddresses })
  } catch (error) {
    console.error("Get addresses error:", error)
    return NextResponse.json({ error: "Failed to get addresses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const addressData = await request.json()

    // Validate required fields
    if (
      !addressData.name ||
      !addressData.phone ||
      !addressData.addressLine1 ||
      !addressData.city ||
      !addressData.state ||
      !addressData.pincode
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await db
        .collection("addresses")
        .updateMany({ userId: new ObjectId(decoded.userId) }, { $set: { isDefault: false } })
    }

    // If this is the first address, make it default
    const existingCount = await db.collection("addresses").countDocuments({ userId: new ObjectId(decoded.userId) })
    if (existingCount === 0) {
      addressData.isDefault = true
    }

    const address = {
      ...addressData,
      userId: new ObjectId(decoded.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("addresses").insertOne(address)

    return NextResponse.json({
      message: "Address added successfully",
      addressId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Add address error:", error)
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 })
  }
}
