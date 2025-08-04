import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"

export async function POST() {
  try {
    const db = await connectToDatabase()
    
    // Update all products to have isActive: true
    const result = await db.collection("products").updateMany(
      {},
      { $set: { isActive: true } }
    )
    
    return NextResponse.json({
      message: "Products updated successfully",
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error("Fix error:", error)
    return NextResponse.json({ error: "Fix failed" }, { status: 500 })
  }
}