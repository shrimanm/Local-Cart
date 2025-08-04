import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { verifyJWT } from "@/lib/utils"

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

    const [totalUsers, totalMerchants, totalShops, verifiedShops, totalProducts, activeProducts, totalOrders] =
      await Promise.all([
        db.collection("users").countDocuments(),
        db.collection("users").countDocuments({ role: "merchant" }),
        db.collection("shops").countDocuments(),
        db.collection("shops").countDocuments({ isVerified: true }),
        db.collection("products").countDocuments(),
        db.collection("products").countDocuments({ isActive: true }),
        db.collection("purchaseditems").countDocuments(),
      ])

    const stats = {
      totalUsers,
      totalMerchants,
      totalShops,
      verifiedShops,
      totalProducts,
      activeProducts,
      totalOrders,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Get admin stats error:", error)
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 })
  }
}
