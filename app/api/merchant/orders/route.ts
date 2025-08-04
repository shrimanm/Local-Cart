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

    // Get merchant's shop
    const shop = await db.collection("shops").findOne({ userId: new ObjectId(decoded.userId) })
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    // Get orders for products from this shop
    const orders = await db
      .collection("purchaseditems")
      .aggregate([
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $match: {
            "product.shopId": shop._id,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$product",
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            orderId: { $toString: "$_id" },
            productName: "$product.name",
            customerName: "$user.name",
            customerPhone: "$user.phone",
            quantity: 1,
            price: 1,
            totalAmount: { $multiply: ["$price", "$quantity"] },
            status: { $ifNull: ["$status", "pending"] },
            createdAt: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    const formattedOrders = orders.map((order) => ({
      ...order,
      id: order._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error("Get merchant orders error:", error)
    return NextResponse.json({ error: "Failed to get orders" }, { status: 500 })
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

    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const result = await db.collection("purchaseditems").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Order status updated successfully" })
  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
