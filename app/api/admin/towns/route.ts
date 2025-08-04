import { NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"

// Simple JWT verification function
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

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const towns = await db.collection("towns").find({}).sort({ name: 1 }).toArray()
    
    return NextResponse.json({ towns })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch towns" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ error: "Town name is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    
    // Check if town already exists
    const existingTown = await db.collection("towns").findOne({ name: name.trim() })
    if (existingTown) {
      return NextResponse.json({ error: "Town already exists" }, { status: 400 })
    }

    const result = await db.collection("towns").insertOne({
      name: name.trim(),
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, townId: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add town" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const townId = searchParams.get("townId")
    
    if (!townId) {
      return NextResponse.json({ error: "Town ID is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const { ObjectId } = require("mongodb")
    
    await db.collection("towns").deleteOne({ _id: new ObjectId(townId) })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete town" }, { status: 500 })
  }
}