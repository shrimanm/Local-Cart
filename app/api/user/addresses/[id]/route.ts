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

    const addressData = await request.json()
    const db = await connectToDatabase()

    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await db
        .collection("addresses")
        .updateMany(
          { userId: new ObjectId(decoded.userId), _id: { $ne: new ObjectId(params.id) } },
          { $set: { isDefault: false } },
        )
    }

    const result = await db.collection("addresses").updateOne(
      { _id: new ObjectId(params.id), userId: new ObjectId(decoded.userId) },
      {
        $set: {
          ...addressData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Address updated successfully" })
  } catch (error) {
    console.error("Update address error:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if this is the default address
    const address = await db.collection("addresses").findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(decoded.userId),
    })

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const result = await db.collection("addresses").deleteOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(decoded.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    // If deleted address was default, make another address default
    if (address.isDefault) {
      const remainingAddresses = await db
        .collection("addresses")
        .find({ userId: new ObjectId(decoded.userId) })
        .toArray()
      if (remainingAddresses.length > 0) {
        await db.collection("addresses").updateOne({ _id: remainingAddresses[0]._id }, { $set: { isDefault: true } })
      }
    }

    return NextResponse.json({ message: "Address deleted successfully" })
  } catch (error) {
    console.error("Delete address error:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}
