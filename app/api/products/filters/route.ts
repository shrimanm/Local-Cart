import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedTowns = searchParams.get('towns')?.split(',') || []
    
    const db = await connectToDatabase()
    
    // Get unique brands from products
    const brands = await db.collection("products").distinct("brand", { isActive: true })
    
    // Get unique categories from products
    const categories = await db.collection("products").distinct("category", { isActive: true })
    
    // Build shop filter based on selected towns
    const shopMatchStage = selectedTowns.length > 0 
      ? { $match: { isActive: true } }
      : { $match: { isActive: true } }
    
    const shopLookupStage = {
      $lookup: {
        from: "shops",
        localField: "shopId",
        foreignField: "_id",
        as: "shopInfo"
      }
    }
    
    const shopUnwindStage = { $unwind: "$shopInfo" }
    
    // Add town filter if towns are selected
    const shopTownFilterStage = selectedTowns.length > 0 
      ? { $match: { "shopInfo.town": { $in: selectedTowns } } }
      : null
    
    const shopPipeline = [
      shopMatchStage,
      shopLookupStage,
      shopUnwindStage,
      ...(shopTownFilterStage ? [shopTownFilterStage] : []),
      { $group: { _id: "$shopInfo.name" } },
      { $sort: { _id: 1 } }
    ]
    
    const shops = await db.collection("products").aggregate(shopPipeline).toArray()
    
    const shopNames = shops.map(shop => shop._id).filter(Boolean)
    
    // Get unique towns by joining products with shops table
    const towns = await db.collection("products").aggregate([
      { $match: { isActive: true } },
      { $lookup: {
          from: "shops",
          localField: "shopId",
          foreignField: "_id",
          as: "shopInfo"
        }
      },
      { $unwind: "$shopInfo" },
      { $group: { _id: "$shopInfo.town" } },
      { $sort: { _id: 1 } }
    ]).toArray()
    
    const townNames = towns.map(town => town._id).filter(Boolean)
    
    console.log('Found brands:', brands.length, 'Found shops:', shopNames.length, 'Found towns:', townNames.length, 'Found categories:', categories.length)
    
    return NextResponse.json({
      brands: brands.filter(Boolean).sort(),
      shops: shopNames,
      towns: townNames,
      categories: categories.filter(Boolean).sort()
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}