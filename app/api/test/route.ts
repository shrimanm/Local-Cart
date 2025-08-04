import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"

export async function GET() {
  try {
    const db = await connectToDatabase()

    // Test database connection
    const collections = await db.listCollections().toArray()

    // Get collection counts
    const collectionCounts = await Promise.all(
      collections.map(async (collection) => ({
        name: collection.name,
        count: await db.collection(collection.name).countDocuments(),
      })),
    )

    return NextResponse.json({
      connected: true,
      database: db.databaseName,
      collections: collectionCounts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
