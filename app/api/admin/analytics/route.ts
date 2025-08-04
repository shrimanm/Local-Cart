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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"
    const type = searchParams.get("type") || "overview"

    const db = await connectToDatabase()

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    let analytics = {}

    if (type === "overview" || type === "platform") {
      // Platform Overview
      const platformMetrics = await Promise.all([
        db.collection("users").countDocuments(),
        db.collection("users").countDocuments({ role: "merchant" }),
        db.collection("shops").countDocuments(),
        db.collection("shops").countDocuments({ isVerified: true }),
        db.collection("products").countDocuments(),
        db.collection("products").countDocuments({ isActive: true }),
        db.collection("purchaseditems").countDocuments(),
      ])

      // Growth metrics
      const userGrowth = await db
        .collection("users")
        .aggregate([
          {
            $match: { createdAt: { $gte: startDate } },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: period === "7d" || period === "30d" ? "%Y-%m-%d" : "%Y-%m",
                  date: "$createdAt",
                },
              },
              newUsers: { $sum: 1 },
              newMerchants: {
                $sum: { $cond: [{ $eq: ["$role", "merchant"] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray()

      // Revenue analytics
      const revenueData = await db
        .collection("purchaseditems")
        .aggregate([
          {
            $match: { createdAt: { $gte: startDate } },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: period === "7d" || period === "30d" ? "%Y-%m-%d" : "%Y-%m",
                  date: "$createdAt",
                },
              },
              totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray()

      analytics = {
        ...analytics,
        platform: {
          metrics: {
            totalUsers: platformMetrics[0],
            totalMerchants: platformMetrics[1],
            totalShops: platformMetrics[2],
            verifiedShops: platformMetrics[3],
            totalProducts: platformMetrics[4],
            activeProducts: platformMetrics[5],
            totalOrders: platformMetrics[6],
          },
          userGrowth,
          revenueData,
        },
      }
    }

    if (type === "overview" || type === "merchants") {
      // Top performing merchants
      const topMerchants = await db
        .collection("purchaseditems")
        .aggregate([
          {
            $match: { createdAt: { $gte: startDate } },
          },
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $lookup: {
              from: "shops",
              localField: "product.shopId",
              foreignField: "_id",
              as: "shop",
            },
          },
          { $unwind: "$shop" },
          {
            $group: {
              _id: "$shop._id",
              shopName: { $first: "$shop.name" },
              totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
              totalOrders: { $sum: 1 },
              totalProducts: { $addToSet: "$productId" },
            },
          },
          {
            $addFields: {
              totalProducts: { $size: "$totalProducts" },
            },
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 10 },
        ])
        .toArray()

      // Merchant verification stats
      const verificationStats = await db
        .collection("shops")
        .aggregate([
          {
            $group: {
              _id: "$verificationStatus",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray()

      analytics = {
        ...analytics,
        merchants: {
          topMerchants: topMerchants.map((merchant) => ({
            ...merchant,
            id: merchant._id.toString(),
            _id: undefined,
          })),
          verificationStats,
        },
      }
    }

    if (type === "overview" || type === "products") {
      // Category performance
      const categoryPerformance = await db
        .collection("purchaseditems")
        .aggregate([
          {
            $match: { createdAt: { $gte: startDate } },
          },
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $group: {
              _id: "$product.category",
              totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
              totalSold: { $sum: "$quantity" },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { totalRevenue: -1 } },
        ])
        .toArray()

      // Product trends
      const productTrends = await db
        .collection("products")
        .aggregate([
          {
            $match: { createdAt: { $gte: startDate } },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: period === "7d" || period === "30d" ? "%Y-%m-%d" : "%Y-%m",
                  date: "$createdAt",
                },
              },
              newProducts: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray()

      analytics = {
        ...analytics,
        products: {
          categoryPerformance,
          productTrends,
        },
      }
    }

    return NextResponse.json({ analytics, period, type })
  } catch (error) {
    console.error("Get admin analytics error:", error)
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 })
  }
}
