import { NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

// Simple rate limiting store (in-memory, resets on deployment)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100 // 100 requests per minute
  
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

function verifyJWT(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return { userId: decoded.userId, role: decoded.role }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      console.warn('Rate limit exceeded:', { ip, productId: params.id })
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Input validation
    if (!params.id || !ObjectId.isValid(params.id)) {
      console.warn('Invalid product ID:', { productId: params.id, ip })
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const db = await connectToDatabase()

    const product = await db.collection("products").findOne({
      _id: new ObjectId(params.id),
      isActive: true,
    })

    if (!product) {
      console.info('Product not found:', { productId: params.id, ip })
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get shop information
    const shop = await db.collection("shops").findOne({ _id: product.shopId })

    const transformedProduct = {
      ...product,
      id: product._id.toString(),
      shopId: product.shopId?.toString() || "",
      shopName: shop?.name || "Unknown Shop",
      _id: undefined,
    }

    const responseTime = Date.now() - startTime
    console.info('Product fetched successfully:', { 
      productId: params.id, 
      responseTime: `${responseTime}ms`,
      ip 
    })
    
    return NextResponse.json(
      { product: transformedProduct },
      { 
        headers: { 
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Response-Time': `${responseTime}ms`
        }
      }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Product API error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: params.id,
      responseTime: `${responseTime}ms`,
      ip,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Input validation
    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    // Authentication
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    
    if (!token) {
      console.warn('Unauthorized product update attempt:', { productId: params.id, ip })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      console.warn('Invalid token for product update:', { productId: params.id, ip })
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Authorization
    if (!['merchant', 'admin'].includes(decoded.role)) {
      console.warn('Insufficient permissions for product update:', { 
        productId: params.id, 
        userId: decoded.userId,
        role: decoded.role,
        ip 
      })
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    
    // Basic validation
    if (!body.name || !body.price || body.price < 0) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Verify product exists
    const existingProduct = await db.collection("products").findOne({
      _id: new ObjectId(params.id)
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Update product
    const updateData = {
      name: body.name,
      description: body.description || "",
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      category: body.category,
      brand: body.brand || "",
      images: Array.isArray(body.images) ? body.images : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      variants: Array.isArray(body.variants) ? body.variants : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      stock: Number(body.stock) || 0,
      isActive: Boolean(body.isActive),
      updatedAt: new Date()
    }

    await db.collection("products").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    const responseTime = Date.now() - startTime
    console.info('Product updated successfully:', { 
      productId: params.id, 
      userId: decoded.userId,
      responseTime: `${responseTime}ms`,
      ip 
    })
    
    return NextResponse.json({ 
      success: true, 
      message: "Product updated successfully" 
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Product update error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: params.id,
      responseTime: `${responseTime}ms`,
      ip,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Input validation
    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    // Authentication
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Authorization
    if (!['merchant', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = await connectToDatabase()

    // Verify product exists
    const existingProduct = await db.collection("products").findOne({
      _id: new ObjectId(params.id)
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Delete product
    await db.collection("products").deleteOne({ _id: new ObjectId(params.id) })

    const responseTime = Date.now() - startTime
    console.info('Product deleted successfully:', { 
      productId: params.id, 
      userId: decoded.userId,
      responseTime: `${responseTime}ms`,
      ip 
    })
    
    return NextResponse.json({ 
      success: true, 
      message: "Product deleted successfully" 
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Product delete error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: params.id,
      responseTime: `${responseTime}ms`,
      ip,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}