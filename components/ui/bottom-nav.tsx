"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useMemo, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Home, Heart, Calendar, User } from "lucide-react"
import { useAuth } from "@/app/providers"
import { useLanguage } from "@/hooks/useLanguage"

function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [wishlistCount, setWishlistCount] = useState(0)
  const { token } = useAuth()
  const { t } = useLanguage()

  const fetchWishlistCount = useCallback(async () => {
    try {
      const response = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      
      if (response.ok) {
        setWishlistCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchWishlistCount()
    }
  }, [token, fetchWishlistCount])

  // Update count when wishlist changes
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (token) {
        fetchWishlistCount()
      }
    }

    window.addEventListener('wishlist-updated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate)
  }, [token, fetchWishlistCount])

  const navItems = useMemo(() => [
    { icon: Home, label: t('home'), path: "/home" },
    { icon: Heart, label: t('wishlist'), path: "/wishlist" },
    { icon: Calendar, label: t('booked'), path: "/booked" },
    { icon: User, label: t('profile'), path: "/profile" },
  ], [t])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Button
            key={path}
            variant="ghost"
            size="sm"
            onClick={() => router.push(path)}
            className={`flex flex-col items-center p-2 relative ${
              pathname === path ? "text-red-700" : "text-gray-600"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs mt-1">{label}</span>
            {label === "Wishlist" && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default memo(BottomNav)