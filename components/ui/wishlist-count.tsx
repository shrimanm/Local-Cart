"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { useAuth } from "@/app/providers"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WishlistCount() {
  const [count, setCount] = useState(0)
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      fetchWishlistCount()
    }
  }, [token])

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      
      if (response.ok) {
        setCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error)
    }
  }

  // Update count when wishlist changes (listen to storage events)
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (token) {
        fetchWishlistCount()
      }
    }

    window.addEventListener('wishlist-updated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate)
  }, [token])

  return (
    <Link href="/wishlist">
      <Button variant="ghost" size="sm" className="flex flex-col items-center relative">
        <Heart className="h-5 w-5" />
        <span className="text-xs hidden sm:block">Wishlist</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Button>
    </Link>
  )
}