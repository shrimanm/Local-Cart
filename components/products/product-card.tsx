"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, MapPin } from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import { createProductUrl } from "@/lib/slug"
// import type { Product } from "@/lib/types"

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  brand: string
  images: string[]
  sizes: string[]
  variants?: string[]
  variantType?: string
  colors: string[]
  stock: number
  isActive: boolean
  rating: number
  reviewCount: number
  shopTown?: string
}

interface ProductCardProps {
  product: Product
  onWishlistToggle?: (productId: string) => void
  isWishlisted?: boolean
}

export default function ProductCard({ product, onWishlistToggle, isWishlisted = false }: ProductCardProps) {
  const { token } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) {
      router.push("/")
      return
    }

    if (onWishlistToggle) {
      await onWishlistToggle(product.id)
      // Trigger wishlist count update
      setTimeout(() => {
        window.dispatchEvent(new Event('wishlist-updated'))
      }, 100)
    }
  }

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) {
      router.push("/")
      return
    }

    if (onWishlistToggle) {
      await onWishlistToggle(product.id)
      // Trigger wishlist count update after the API call
      setTimeout(() => {
        window.dispatchEvent(new Event('wishlist-updated'))
      }, 100)
    }
  }

  const handleCardClick = () => {
    router.push(`/product/${product.id}`)
  }

  return (
    <Card className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 bg-white rounded-xl overflow-hidden shadow-md" onClick={handleCardClick}>
      <CardContent className="p-0">
        <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Image
              src={product.images[0] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </div>
          
          {/* Stylish overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Floating Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-md hover:bg-white p-2.5 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-10"
          >
            <Heart className={`h-4 w-4 transition-all duration-200 ${isWishlisted ? "fill-red-500 text-red-500 scale-110" : "text-gray-600 hover:text-red-400"}`} />
          </Button>

          {/* Premium Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse z-10">
              -{discount}%
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col h-full bg-white">
          <div className="flex-1 space-y-2">
            {/* Brand */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{product.brand}</p>

            {/* Product Name */}
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
              {product.name}
            </h3>

            {/* Stylish Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 px-2.5 py-1 rounded-full shadow-sm">
                <Star className="h-3 w-3 fill-white text-white" />
                <span className="text-xs font-bold text-white ml-1">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">({product.reviewCount})</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            {/* Shop Town */}
            {product.shopTown && (
              <p className="text-xs text-gray-400 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {product.shopTown}
              </p>
            )}

            {/* Stylish Variants */}
            <div className="hidden lg:block">
              {((product.variants && product.variants.length > 0) || (product.sizes && product.sizes.length > 0)) && (
                <div className="flex flex-wrap gap-1.5">
                  {(product.variants || product.sizes || []).slice(0, 3).map((variant, index) => (
                    <span key={index} className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 px-2.5 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer">
                      {variant}
                    </span>
                  ))}
                  {(product.variants || product.sizes || []).length > 3 && (
                    <span className="text-xs text-gray-400 font-medium px-2 py-1">+{(product.variants || product.sizes || []).length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Premium CTA Button */}
          <div className="mt-4">
            <Button
              onClick={handleAddToWishlist}
              className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                isWishlisted 
                  ? "bg-gray-900 hover:bg-gray-800 text-white" 
                  : "border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white bg-white"
              }`}
            >
              <Heart className={`h-4 w-4 mr-2 transition-transform duration-200 hover:scale-110 ${isWishlisted ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">{isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}</span>
              <span className="sm:hidden">{isWishlisted ? t('remove') : t('add')}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
