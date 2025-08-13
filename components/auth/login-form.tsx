"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/providers"
import { Phone, MessageSquare, Shield, ArrowRight, ArrowLeft } from "lucide-react"
import { useBackButton } from "@/hooks/useBackButton"

export default function LoginForm() {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [showOtpNotification, setShowOtpNotification] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const { login } = useAuth()

  // Handle back button behavior
  const handleCustomBack = () => {
    if (step === "otp") {
      setStep("phone")
      setOtp("")
      setError("")
      setShowOtpNotification(false)
    }
  }

  const { goBack } = useBackButton({
    onBack: step === "otp" ? handleCustomBack : undefined,
    preventExit: true
  })

  const startResendTimer = () => {
    setResendTimer(30)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("otp")
        startResendTimer()
        // Show OTP notification
        if (data.otp) {
          setOtpValue(data.otp)
          setShowOtpNotification(true)
          setTimeout(() => setShowOtpNotification(false), 10000) // Hide after 10 seconds
        }
      } else {
        setError(data.error || "Failed to send OTP")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.token, data.user)
        
        // Check if user needs to complete profile (only for truly new users)
        if (!data.user.name) {
          window.location.href = "/onboarding"
        }
      } else {
        setError(data.error || "Invalid OTP")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        startResendTimer()
        setError("")
        // Show OTP notification
        if (data.otp) {
          setOtpValue(data.otp)
          setShowOtpNotification(true)
          setTimeout(() => setShowOtpNotification(false), 10000) // Hide after 10 seconds
        }
      } else {
        setError(data.error || "Failed to resend OTP")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderPhoneStep = () => (
    <form onSubmit={handleSendOTP} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Phone className="h-8 w-8 text-gray-700" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Enter Your Mobile Number</h3>
        <p className="text-gray-600 mt-2">We'll send you an OTP to verify your number</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Mobile Number
        </Label>
        <div className="flex">
          <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
            <span className="text-gray-600">+91</span>
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10)
              setPhone(value)
            }}
            className="rounded-l-none h-12"
            required
          />
        </div>
        <p className="text-xs text-gray-500">By continuing, you agree to Myntra's Terms of Use and Privacy Policy</p>
      </div>

      <Button
        type="submit"
        disabled={loading || phone.length !== 10}
        className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg h-12 text-lg"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
            Sending OTP...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </Button>
    </form>
  )

  const renderOTPStep = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      {showOtpNotification && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium text-sm">Your OTP Code</p>
                <p className="text-green-700 text-base font-mono">{otpValue}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowOtpNotification(false)}
              className="text-green-600 hover:text-green-800 p-1"
            >
              ×
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center mb-3">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={handleCustomBack} 
          className="p-1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600 ml-2">Back to phone number</span>
      </div>
      
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
          <MessageSquare className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Verify OTP</h3>
        <p className="text-gray-600 mt-1 text-sm">Enter the 6-digit code sent to +91 {phone}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp" className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Enter OTP
        </Label>
        <Input
          id="otp"
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 6)
            setOtp(value)
          }}
          className="text-center text-xl tracking-widest h-12"
          maxLength={6}
          required
        />
      </div>

      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="link"
          onClick={handleResendOTP}
          disabled={resendTimer > 0 || loading}
          className="text-gray-900 p-0 h-auto text-sm"
        >
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
        </Button>
        <span className="text-sm text-gray-500">{otp.length}/6</span>
      </div>

      <Button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg h-12 text-base"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
            Verifying...
          </div>
        ) : (
          "Verify & Continue"
        )}
      </Button>
    </form>
  )

  return (
    <div className="w-full">
      <Card className="w-full bg-white rounded-2xl shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
              {step === "phone" ? (
                <span>
                  <span className="text-gray-900 font-bold">Login</span>
                  <span className="text-gray-500 font-normal"> or </span>
                  <span className="text-gray-900 font-bold">Signup</span>
                </span>
              ) : (
                <span className="text-gray-900 font-bold">Verify OTP</span>
              )}
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            {step === "phone"
              ? "Get access to your orders, wishlist and recommendations"
              : "We've sent a verification code to your mobile number"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          {step === "phone" ? renderPhoneStep() : renderOTPStep()}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Have trouble logging in?{" "}
              <a href="#" className="text-gray-900 hover:underline font-medium">
                Get help
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
