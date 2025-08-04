import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"

export async function GET() {
  try {
    const db = await connectToDatabase()
    
    // Get all products without filters
    const allProducts = await db.collection("products").find({}).toArray()
    
    // Get products with isActive: true
    const activeProducts = await db.collection("products").find({ isActive: true }).toArray()
    
    return NextResponse.json({
      totalProducts: allProducts.length,
      activeProducts: activeProducts.length,
      allProducts: allProducts.map(p => ({
        id: p._id.toString(),
        name: p.name,
        isActive: p.isActive,
        category: p.category,
        price: p.price
      }))
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}