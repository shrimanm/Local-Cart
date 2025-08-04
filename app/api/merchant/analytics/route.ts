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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, 1y
    const type = searchParams.get("type") || "overview" // overview, sales, products, customers

    const db = await connectToDatabase()

    // Get merchant's shop
    const shop = await db.collection("shops").findOne({ userId: new ObjectId(decoded.userId) })
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

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

    if (type === "overview" || type === "sales") {
      // Sales Analytics
      const salesPipeline = [
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
            createdAt: { $gte: startDate },
          },
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
            totalItems: { $sum: "$quantity" },
          },
        },
        { $sort: { _id: 1 } },
      ]

      const salesData = await db.collection("purchaseditems").aggregate(salesPipeline).toArray()

      // Total metrics
      const totalMetrics = await db
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
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
              totalOrders: { $sum: 1 },
              totalItems: { $sum: "$quantity" },
              avgOrderValue: { $avg: { $multiply: ["$price", "$quantity"] } },
            },
          },
        ])
        .toArray()

      // Previous period comparison
      const prevStartDate = new Date(startDate)
      const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      prevStartDate.setDate(startDate.getDate() - daysDiff)

      const prevMetrics = await db
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
              createdAt: { $gte: prevStartDate, $lt: startDate },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
              totalOrders: { $sum: 1 },
            },
          },
        ])
        .toArray()

      analytics = {
        ...analytics,
        sales: {
          chartData: salesData,
          metrics: totalMetrics[0] || {
            totalRevenue: 0,
            totalOrders: 0,
            totalItems: 0,
            avgOrderValue: 0,
          },
          comparison: {
            revenueGrowth: prevMetrics[0]
              ? ((totalMetrics[0]?.totalRevenue || 0) - prevMetrics[0].totalRevenue) / prevMetrics[0].totalRevenue
              : 0,
            ordersGrowth: prevMetrics[0]
              ? ((totalMetrics[0]?.totalOrders || 0) - prevMetrics[0].totalOrders) / prevMetrics[0].totalOrders
              : 0,
          },
        },
      }
    }

    if (type === "overview" || type === "products") {
      // Product Performance
      const productsPipeline = [
        {
          $lookup: {
            from: "purchaseditems",
            localField: "_id",
            foreignField: "productId",
            as: "sales",
          },
        },
        {
          $match: {
            shopId: shop._id,
            "sales.createdAt": { $gte: startDate },
          },
        },
        {
          $addFields: {
            totalSold: { $sum: "$sales.quantity" },
            totalRevenue: {
              $sum: {
                $map: {
                  input: "$sales",
                  as: "sale",
                  in: { $multiply: ["$$sale.price", "$$sale.quantity"] },
                },
              },
            },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]

      const topProducts = await db.collection("products").aggregate(productsPipeline).toArray()

      // Category performance
      const categoryPipeline = [
        {
          $lookup: {
            from: "purchaseditems",
            localField: "_id",
            foreignField: "productId",
            as: "sales",
          },
        },
        {
          $match: {
            shopId: shop._id,
            "sales.createdAt": { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$category",
            totalRevenue: {
              $sum: {
                $sum: {
                  $map: {
                    input: "$sales",
                    as: "sale",
                    in: { $multiply: ["$$sale.price", "$$sale.quantity"] },
                  },
                },
              },
            },
            totalSold: { $sum: { $sum: "$sales.quantity" } },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]

      const categoryData = await db.collection("products").aggregate(categoryPipeline).toArray()

      analytics = {
        ...analytics,
        products: {
          topProducts: topProducts.map((product) => ({
            ...product,
            id: product._id.toString(),
            _id: undefined,
          })),
          categoryData,
        },
      }
    }

    if (type === "overview" || type === "customers") {
      // Customer Analytics
      const customersPipeline = [
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
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$userId",
            totalSpent: { $sum: { $multiply: ["$price", "$quantity"] } },
            totalOrders: { $sum: 1 },
            lastOrderDate: { $max: "$createdAt" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]

      const topCustomers = await db.collection("purchaseditems").aggregate(customersPipeline).toArray()

      // Customer acquisition
      const acquisitionPipeline = [
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
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              userId: "$userId",
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            newCustomers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]

      const acquisitionData = await db.collection("purchaseditems").aggregate(acquisitionPipeline).toArray()

      analytics = {
        ...analytics,
        customers: {
          topCustomers: topCustomers.map((customer) => ({
            ...customer,
            id: customer._id.toString(),
            _id: undefined,
            user: {
              ...customer.user,
              id: customer.user._id.toString(),
              _id: undefined,
            },
          })),
          acquisitionData,
        },
      }
    }

    return NextResponse.json({ analytics, period, type })
  } catch (error) {
    console.error("Get merchant analytics error:", error)
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 })
  }
}
