import { NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    console.log('Shop API called with ID:', params.id)
    
    const shop = await db.collection("shops").findOne({
      _id: new ObjectId(params.id)
    })

    console.log('Shop found:', shop)

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    const shopData = {
      id: shop._id.toString(),
      name: shop.name || shop.shopName || 'Shop Name Not Available',
      address: shop.address || shop.shopAddress || 'Address Not Available', 
      contactDetails: shop.contactDetails || shop.contact || shop.phone || 'Contact Not Available',
      description: shop.description || '',
      town: shop.town || 'Town Not Available',
      locationUrl: shop.locationUrl || null,
      isVerified: shop.isVerified || false
    }
    
    console.log('Returning shop data:', shopData)
    return NextResponse.json({ shop: shopData })
  } catch (error) {
    console.error("Error fetching shop:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}