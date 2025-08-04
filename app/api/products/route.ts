import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const brand = searchParams.get("brand")
    const brands = searchParams.get("brands")
    const shops = searchParams.get("shops")
    const towns = searchParams.get("towns")
    const categories = searchParams.get("categories")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sort = searchParams.get("sort") || "createdAt"
    const order = searchParams.get("order") || "desc"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const db = await connectToDatabase()

    // Build filter query - only show products from verified shops
    const filter: any = { isActive: true }

    if (category && category !== "all") {
      // Map category IDs to database category patterns
      const categoryMap: Record<string, string> = {
        "men": "Men",
        "women": "Women", 
        "kids": "Kids",
        "home": "Home",
        "beauty": "Beauty",
        "footwear": "Footwear",
        "accessories": "Accessories",
        "sports": "Sports",
        "electronics": "Electronics"
      }
      
      const categoryPattern = categoryMap[category.toLowerCase()] || category
      filter.category = new RegExp(`^${categoryPattern}`, "i")
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { brand: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
      ]
    }

    if (brand) {
      filter.brand = new RegExp(brand, "i")
    }

    if (brands) {
      const brandList = brands.split(',')
      filter.brand = { $in: brandList.map(b => new RegExp(b, "i")) }
    }

    // Handle shop filtering by getting shop IDs first
    if (shops) {
      const shopList = shops.split(',')
      console.log('Shop filtering for:', shopList)
      
      // Get shop IDs that match the shop names
      const matchingShops = await db.collection("shops")
        .find({ name: { $in: shopList.map(s => new RegExp(s, "i")) } })
        .toArray()
      
      const shopIds = matchingShops.map(shop => shop._id)
      console.log('Found shop IDs:', shopIds)
      
      if (shopIds.length > 0) {
        filter.shopId = { $in: shopIds }
      } else {
        // No matching shops found, return empty results
        filter._id = { $in: [] }
      }
    }

    // Handle town filtering by getting shop IDs first
    if (towns) {
      const townList = towns.split(',')
      console.log('Town filtering for:', townList)
      
      // Get shop IDs that match the town names
      const matchingShops = await db.collection("shops")
        .find({ town: { $in: townList } })
        .toArray()
      
      const shopIds = matchingShops.map(shop => shop._id)
      console.log('Found shop IDs for towns:', shopIds)
      
      if (shopIds.length > 0) {
        // If we already have a shopId filter, intersect them
        if (filter.shopId) {
          const existingShopIds = Array.isArray(filter.shopId.$in) ? filter.shopId.$in : [filter.shopId]
          const intersectedIds = shopIds.filter(id => existingShopIds.some((existingId: any) => existingId.equals(id)))
          filter.shopId = { $in: intersectedIds }
        } else {
          filter.shopId = { $in: shopIds }
        }
      } else {
        // No matching shops found, return empty results
        filter._id = { $in: [] }
      }
    }

    if (categories) {
      const categoryList = categories.split(',')
      console.log('Category filter applied:', categoryList)
      filter.category = { $in: categoryList }
    }

    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number.parseFloat(minPrice)
      if (maxPrice) filter.price.$lte = Number.parseFloat(maxPrice)
    }

    // Build sort query
    const sortQuery: any = {}
    
    if (sort === "-price") {
      sortQuery.price = -1 // Price: High to Low
    } else if (sort === "price") {
      sortQuery.price = 1 // Price: Low to High
    } else if (sort === "rating") {
      sortQuery.rating = -1 // Highest Rated first
    } else if (sort === "name") {
      sortQuery.name = 1 // Name: A to Z
    } else {
      sortQuery.createdAt = -1 // Newest First (default)
    }

    // Get products with shop verification check
    const products = await db.collection("products")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "shops",
            localField: "shopId",
            foreignField: "_id",
            as: "shop"
          }
        },
        {
          $match: {
            "shop.isVerified": true
          }
        },
        { $sort: sortQuery },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray()

    // Get total count for pagination (only verified shops)
    const totalResult = await db.collection("products")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "shops",
            localField: "shopId",
            foreignField: "_id",
            as: "shop"
          }
        },
        {
          $match: {
            "shop.isVerified": true
          }
        },
        { $count: "total" }
      ])
      .toArray()
    
    const total = totalResult.length > 0 ? totalResult[0].total : 0

    // Transform products to include string id and shop town
    const transformedProducts = products.map((product) => ({
      ...product,
      id: product._id.toString(),
      shopTown: product.shop?.[0]?.town || 'Unknown',
      _id: undefined,
    }))

    // Get category counts for filters
    const categoryCounts = await db
      .collection("products")
      .aggregate([{ $match: { isActive: true } }, { $group: { _id: "$category", count: { $sum: 1 } } }])
      .toArray()

    const categoryCountsMap = categoryCounts.reduce(
      (acc, item) => {
        acc[item._id.toLowerCase()] = item.count
        return acc
      },
      {} as Record<string, number>,
    )

    // Get brand counts
    const brandCounts = await db
      .collection("products")
      .aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ])
      .toArray()

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        categories: categoryCountsMap,
        brands: brandCounts.map((b) => ({ name: b._id, count: b.count })),
      },
    })
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify JWT and check if user is merchant
    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectToDatabase()

    // Check if user is merchant
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    if (!user || user.role !== "merchant") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get merchant's shop
    const shop = await db.collection("shops").findOne({ userId: new ObjectId(decoded.userId) })
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    const productData = await request.json()

    const product = {
      ...productData,
      shopId: shop._id,
      isActive: true,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
    }

    const result = await db.collection("products").insertOne(product)

    return NextResponse.json({
      message: "Product created successfully",
      productId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

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
