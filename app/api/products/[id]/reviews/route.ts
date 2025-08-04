import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { ObjectId } from "mongodb"

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const pipeline = [
      { $match: { productId: new ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          userName: { $arrayElemAt: ["$user.name", 0] },
        },
      },
      {
        $project: {
          user: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]

    const reviews = await db.collection("reviews").aggregate(pipeline).toArray()

    const formattedReviews = reviews.map((review) => ({
      ...review,
      id: review._id.toString(),
      userId: review.userId.toString(),
      productId: review.productId.toString(),
      _id: undefined,
    }))

    return NextResponse.json({ reviews: formattedReviews })
  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ error: "Failed to get reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id } = params
    const { rating, comment } = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Check if user has purchased this product
    const purchase = await db.collection("purchased").findOne({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(id),
    })

    if (!purchase) {
      return NextResponse.json({ error: "You can only review products you have purchased" }, { status: 403 })
    }

    // Check if user has already reviewed this product
    const existingReview = await db.collection("reviews").findOne({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(id),
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 })
    }

    // Add review
    await db.collection("reviews").insertOne({
      userId: new ObjectId(decoded.userId),
      productId: new ObjectId(id),
      rating,
      comment,
      createdAt: new Date(),
    })

    // Update product rating
    const reviews = await db
      .collection("reviews")
      .find({ productId: new ObjectId(id) })
      .toArray()
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    const reviewCount = reviews.length

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount,
        },
      },
    )

    return NextResponse.json({ message: "Review added successfully" })
  } catch (error) {
    console.error("Add review error:", error)
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 })
  }
}
