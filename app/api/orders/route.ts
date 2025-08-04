import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"

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

    const { items, shippingAddress, paymentMethod, totalAmount } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create order
    const orderResult = await db.collection("orders").insertOne({
      orderId,
      userId: new ObjectId(decoded.userId),
      items: items.map((item: any) => ({
        productId: new ObjectId(item.productId),
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      })),
      totalAmount,
      status: "confirmed",
      shippingAddress,
      paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Clear cart after successful order
    await db.collection("cart").deleteMany({ userId: new ObjectId(decoded.userId) })

    // Add to purchased items
    const purchasedItems = items.map((item: any) => ({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(item.productId),
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: item.price,
      orderId,
      status: "purchased",
      createdAt: new Date(),
    }))

    await db.collection("purchased").insertMany(purchasedItems)

    return NextResponse.json({
      success: true,
      orderId,
      message: "Order placed successfully",
    })
  } catch (error) {
    console.error("Place order error:", error)
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 })
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

    const pipeline = [
      { $match: { userId: new ObjectId(decoded.userId) } },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $sort: { createdAt: -1 } },
    ]

    const orders = await db.collection("orders").aggregate(pipeline).toArray()

    const formattedOrders = orders.map((order) => ({
      ...order,
      id: order._id.toString(),
      userId: order.userId.toString(),
      _id: undefined,
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Failed to get orders" }, { status: 500 })
  }
}
