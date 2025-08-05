"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import RouteGuard from "@/components/auth/route-guard"
import LoginForm from "@/components/auth/login-form"
import { Card, CardContent } from "@/components/ui/card"
import BannerCarousel from "@/components/home/banner-carousel"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Always redirect to home after login
      router.push("/home")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If user is logged in, redirect happens in useEffect
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Modern Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
              <div className="text-center">
                <div className="flex flex-col items-center justify-center mb-6">
                  <img src="/logo.png" alt="LocalCart Logo" className="h-16 w-16 mb-4 rounded-2xl shadow-sm" />
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center">
                    Welcome to <span className="text-red-800 font-black">LocalCart</span>
                  </h1>
                </div>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                  Discover the latest fashion trends, shop from top brands, and express your unique style
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
              <BannerCarousel />
            </div>
          </div>
        </div>

        {/* Modern Login Section */}
        <div className="max-w-md mx-auto px-4 pb-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <LoginForm />
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Why Choose LocalCart?</h2>
              <p className="text-sm sm:text-base text-gray-600">Experience the best of fashion shopping</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛍️</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Vast Collection</h3>
                <p className="text-sm text-gray-600">Endless variety from top brands</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Easy Shopping</h3>
                <p className="text-sm text-gray-600">Simple and intuitive shopping experience</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Quality Products</h3>
                <p className="text-sm text-gray-600">Authentic products from trusted brands</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - No Scroll */}
      <div className="md:hidden">
        <LoginForm />
      </div>
    </div>
  )
}
