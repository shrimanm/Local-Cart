import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import jwt from "jsonwebtoken"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp } = body
    
    // Input validation
    if (!phone || typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Valid 10-digit phone number required" }, { status: 400 })
    }
    
    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Valid 6-digit OTP required" }, { status: 400 })
    }

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Verify OTP
    const otpSession = await db.collection("otp_sessions").findOne({
      phone,
      otp,
      expiresAt: { $gt: new Date() },
    })

    if (!otpSession) {
      // Increment attempts
      await db.collection("otp_sessions").updateOne({ phone }, { $inc: { attempts: 1 } })
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Check if user exists
    let user = await db.collection("users").findOne({ phone })

    if (!user) {
      // Create new user
      const newUser = {
        phone,
        role: "user",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("users").insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
    } else {
      // Update existing user
      await db.collection("users").updateOne(
        { phone },
        {
          $set: {
            isVerified: true,
            updatedAt: new Date(),
          },
        },
      )
    }

    // Clean up OTP session
    await db.collection("otp_sessions").deleteOne({ phone })

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phone: user.phone,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" },
    )

    // Format user data
    const userData = {
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      city: user.city,
      interests: user.interests,
      role: user.role,
      isVerified: user.isVerified,
    }

    return NextResponse.json({
      success: true,
      token,
      user: userData,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}