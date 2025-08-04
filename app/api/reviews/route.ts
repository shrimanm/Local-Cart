import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const reviews = await db.collection("reviews")
      .aggregate([
        { $match: { productId: new ObjectId(productId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            rating: 1,
            comment: 1,
            createdAt: 1,
            userName: "$user.name",
            userInitial: { $substr: ["$user.name", 0, 1] }
          }
        }
      ])
      .toArray()

    const transformedReviews = reviews.map(review => ({
      id: review._id.toString(),
      rating: review.rating,
      comment: review.comment,
      userName: review.userName || "Anonymous",
      userInitial: review.userInitial || "A",
      createdAt: review.createdAt
    }))

    return NextResponse.json({ reviews: transformedReviews })
  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ error: "Failed to get reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { productId, rating, comment } = await request.json()

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid review data" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Check if user already reviewed this product
    const existingReview = await db.collection("reviews").findOne({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(productId)
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 })
    }

    // Add review
    const review = {
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(productId),
      rating,
      comment: comment || "",
      createdAt: new Date()
    }

    await db.collection("reviews").insertOne(review)

    // Update product rating
    const reviews = await db.collection("reviews").find({ productId: new ObjectId(productId) }).toArray()
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    const reviewCount = reviews.length

    await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          rating: Math.round(avgRating * 10) / 10,
          reviewCount 
        } 
      }
    )

    return NextResponse.json({ success: true, message: "Review added successfully" })
  } catch (error) {
    console.error("Add review error:", error)
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 })
  }
}