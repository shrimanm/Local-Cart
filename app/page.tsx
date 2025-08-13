"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import RouteGuard from "@/components/auth/route-guard"
import LoginForm from "@/components/auth/login-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BannerCarousel from "@/components/home/banner-carousel"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [screenHeight, setScreenHeight] = useState(0)

  useEffect(() => {
    const updateScreenHeight = () => {
      setScreenHeight(window.innerHeight)
    }
    
    updateScreenHeight()
    window.addEventListener('resize', updateScreenHeight)
    
    return () => window.removeEventListener('resize', updateScreenHeight)
  }, [])

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
      {/* Desktop/Tablet View */}
      <div className="hidden sm:flex sm:flex-col sm:min-h-screen">
        {/* Header - Full Width */}
        <div className="bg-white shadow-sm p-6 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <img src="/logo.png" alt="LocalCart Logo" className="h-14 w-14 rounded-xl shadow-sm mr-4" />
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Welcome to <span className="text-red-600 font-black">LocalCart</span>
            </h1>
          </div>
        </div>
        
        {/* Main Content - 70/30 Split */}
        <div className="flex-1 max-w-7xl mx-auto p-6 w-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 w-full">
            {/* Left Side - Banner (70%) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <BannerCarousel showShopButton={false} />
              </div>
              <div className="text-center">
                <p className="text-xl font-medium text-gray-700 leading-relaxed">
                  Discover the latest fashion trends, shop from top brands, and express your unique style
                </p>
              </div>
            </div>
            
            {/* Right Side - Login Form (30%) */}
            <div className="lg:col-span-3 flex items-center justify-center">
              <div className="w-full">
                <LoginForm />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer - Full Width */}
        <div className="bg-white border-t border-gray-200 py-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-6">

            
            {/* Features */}
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🛍️</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm text-gray-900">Vast Collection</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Endless variety from top shops</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">✨</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm text-gray-900">Easy Booking</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Simple and intuitive experience</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">⭐</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm text-gray-900">Quality Products</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Authentic products from trusted shops</p>
              </div>
            </div>
            
            <div className="text-center border-t border-gray-200 pt-3">
              <div className="flex justify-center space-x-6 text-xs text-gray-500">
                <a href="#" className="hover:text-gray-700">Terms of Service</a>
                <a href="#" className="hover:text-gray-700">Privacy Policy</a>
                <a href="#" className="hover:text-gray-700">Contact Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-8 flex-shrink-0">
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="LocalCart Logo" className="h-16 w-16 rounded-xl shadow-lg mr-4" />
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Welcome to <span className="text-red-600 font-black">LocalCart</span>
            </h1>
          </div>
        </div>
        
        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">🛍️</span>
              </div>
              <p className="text-xs font-medium text-gray-700">Vast Collection</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">✨</span>
              </div>
              <p className="text-xs font-medium text-gray-700">Easy Booking</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">⭐</span>
              </div>
              <p className="text-xs font-medium text-gray-700">Quality Products</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Discover fashion trends and shop from top brands</p>
          </div>
        </div>
      </div>
    </div>
  )
}
