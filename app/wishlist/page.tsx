"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { THEME_CLASSES } from "@/lib/theme-constants"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import ConfirmationDialog from "@/components/ui/confirmation-dialog"
import { Heart, Star, Calendar } from "lucide-react"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import BottomNav from "@/components/ui/bottom-nav"
import BookingDialog from "@/components/ui/booking-dialog"
import { Notification, useNotification } from "@/components/ui/notification"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"

interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  originalPrice?: number
  images: string[]
  brand: string
  rating: number
  reviewCount: number
  shopName: string
  size?: string
  variant?: string
  color?: string
  createdAt: string
  isBooked?: boolean
}

function WishlistPageContent() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [bookedItems, setBookedItems] = useState<Set<string>>(new Set())
  const [bookingDialog, setBookingDialog] = useState<{ isOpen: boolean; product: WishlistItem | null }>({ isOpen: false, product: null })
  const [variantDialog, setVariantDialog] = useState<{ isOpen: boolean; productId: string }>({ isOpen: false, productId: '' })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [cancelBookingDialog, setCancelBookingDialog] = useState<{ isOpen: boolean; productId: string; productName: string }>({ isOpen: false, productId: '', productName: '' })
  const { user, token, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const { notification, showNotification, hideNotification } = useNotification()

  useEffect(() => {
    if (!user && !loading) {
      router.push("/")
      return
    }
    
    if (user && token) {
      fetchWishlist()
      fetchBookedItems()
    }
  }, [user, token, router, loading])

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Transform the data to match expected structure
        const transformedItems = data.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          originalPrice: item.product.originalPrice,
          images: item.product.images,
          brand: item.product.brand,
          rating: item.product.rating,
          reviewCount: item.product.reviewCount,
          shopName: item.product.shopName,
          size: item.size,
          variant: item.variant,
          color: item.color,
          createdAt: item.createdAt
        }))
        setItems(transformedItems)
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookedItems = async () => {
    try {
      const response = await fetch("/api/booked", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        const bookedIds = new Set<string>(data.items.map((item: any) => item.productId))
        setBookedItems(bookedIds)
      }
    } catch (error) {
      console.error("Error fetching booked items:", error)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        setItems(items.filter((item) => item.productId !== productId))
        // Trigger wishlist count update after state update
        setTimeout(() => {
          window.dispatchEvent(new Event('wishlist-updated'))
        }, 100)
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
    }
  }

  const handleBookingClick = async (item: WishlistItem) => {
    if (bookedItems.has(item.productId)) {
      // If already booked, show confirmation dialog
      console.log('Setting cancel dialog:', item.name)
      setCancelBookingDialog({ isOpen: true, productId: item.productId, productName: item.name })
      return
    } else {
      // Check if product needs variants and if they're selected
      try {
        const response = await fetch(`/api/products/${item.productId}`)
        const data = await response.json()
        
        if (response.ok) {
          const product = data.product
          const hasVariants = (product.variants && product.variants.length > 0) || (product.sizes && product.sizes.length > 0)
          const hasColors = product.colors && product.colors.length > 0
          
          if ((hasVariants && !item.size && !item.variant) || (hasColors && !item.color)) {
            // Show variant selection dialog
            setVariantDialog({ isOpen: true, productId: item.productId })
            return
          }
        }
      } catch (error) {
        console.error('Error checking product variants:', error)
      }
      
      // If variants are selected or not required, show confirmation dialog
      setBookingDialog({ isOpen: true, product: item })
    }
  }

  const confirmBooking = async () => {
    if (!bookingDialog.product) return
    
    setBookingLoading(true)
    try {
      await toggleBooking(bookingDialog.product.productId)
      setBookingDialog({ isOpen: false, product: null })
      // Navigate to booked page after successful booking
      setTimeout(() => {
        router.push('/booked')
      }, 500)
    } catch (error) {
      console.error("Error confirming booking:", error)
    } finally {
      setBookingLoading(false)
    }
  }

  const toggleBooking = async (productId: string) => {
    const item = items.find(i => i.productId === productId)
    try {
      const response = await fetch("/api/booked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          productId,
          size: item?.size,
          variant: item?.variant,
          color: item?.color
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setBookedItems(prev => {
          const newSet = new Set(prev)
          if (data.action === "added") {
            newSet.add(productId)
            showNotification('Product booked successfully! 🎉', 'success')
          } else {
            newSet.delete(productId)
            showNotification('Booking cancelled', 'info')
          }
          return newSet
        })
      }
    } catch (error) {
      console.error("Error toggling booking:", error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6">
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={hideNotification}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{t('myWishlistTitle')}</h1>
            <p className="text-gray-600 font-medium">{items.length} items</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('emptyWishlist')}</h2>
              <p className="text-gray-600 mb-8">{t('startShopping')}</p>
              <Button 
                onClick={() => router.push("/home")} 
                className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {t('browseProducts')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-xl transition-shadow duration-300 bg-white shadow-md border border-gray-100 rounded-2xl">
                <CardContent className="p-4">
                  <div>
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative w-24 h-32 bg-white border border-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 flex items-center justify-center p-2 cursor-pointer" onClick={() => router.push(`/product/${item.productId}`)}>
                          <Image
                            src={item.images[0] || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-contain transition-transform duration-300 hover:scale-105"
                            sizes="96px"
                          />
                        </div>
                        
                        {/* Discount badge */}
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="absolute top-1 left-1 bg-red-500 text-white px-1 py-0.5 rounded text-xs font-semibold">
                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-sm mb-1 line-clamp-2 cursor-pointer hover:text-gray-900"
                          onClick={() => router.push(`/product/${item.productId}`)}
                        >
                          {item.name}
                        </h3>
                        <p className="text-gray-600 text-xs mb-2">{item.brand}</p>

                        <div className="flex items-center mb-2">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600 ml-1">
                            {item.rating} ({item.reviewCount})
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-gray-500 line-through text-sm">{formatPrice(item.originalPrice)}</span>
                          )}
                        </div>
                        
                        {/* Size/Variant/Color Info */}
                        {(item.size || item.variant || item.color) && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.size && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Size: {item.size}</span>
                            )}
                            {item.variant && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.variant}</span>
                            )}
                            {item.color && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Color: {item.color}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons - Desktop Only */}
                      <div className="hidden sm:flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => handleBookingClick(item)}
                          className={`text-white text-xs px-4 ${
                            bookedItems.has(item.productId)
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-gray-900 hover:bg-gray-800"
                          }`}
                          size="sm"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {bookedItems.has(item.productId) ? t('unbook') : t('bookNow')}
                        </Button>
                        <Button
                          onClick={() => removeFromWishlist(item.productId)}
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-4"
                          size="sm"
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          {t('remove')}
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons - Mobile Only */}
                    <div className="flex sm:hidden gap-2 mt-3">
                      <Button
                        onClick={() => handleBookingClick(item)}
                        className={`flex-1 text-white text-xs ${
                          bookedItems.has(item.productId)
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-900 hover:bg-gray-800"
                        }`}
                        size="sm"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {bookedItems.has(item.productId) ? t('unbook') : t('bookNow')}
                      </Button>
                      <Button
                        onClick={() => removeFromWishlist(item.productId)}
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        size="sm"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        {t('remove')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* Variant Selection Required Dialog */}
      <Dialog open={variantDialog.isOpen} onOpenChange={(open) => !open && setVariantDialog({ isOpen: false, productId: '' })}>
        <DialogContent className="max-w-sm border-0 shadow-xl rounded-2xl animate-in slide-in-from-top-4 fade-in-0 duration-300">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">ℹ️</span>
            </div>
            <p className="text-gray-700 mb-6">{t('selectOptionsMessage')}</p>
            <Button 
              onClick={() => {
                setVariantDialog({ isOpen: false, productId: '' })
                router.push(`/product/${variantDialog.productId}`)
              }} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2 rounded-full"
            >
              {t('selectOptions')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Booking Confirmation Dialog */}
      <BookingDialog
        isOpen={bookingDialog.isOpen}
        onClose={() => setBookingDialog({ isOpen: false, product: null })}
        onConfirm={confirmBooking}
        product={bookingDialog.product ? {
          name: bookingDialog.product.name,
          price: bookingDialog.product.price,
          images: bookingDialog.product.images,
          brand: bookingDialog.product.brand
        } : { name: '', price: 0, images: [], brand: '' }}
        loading={bookingLoading}
      />
      
      {/* Cancel Booking Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={cancelBookingDialog.isOpen}
        onClose={() => setCancelBookingDialog({ isOpen: false, productId: '', productName: '' })}
        onConfirm={async () => {
          setBookingLoading(true)
          try {
            await toggleBooking(cancelBookingDialog.productId)
            setCancelBookingDialog({ isOpen: false, productId: '', productName: '' })
          } catch (error) {
            console.error("Error cancelling booking:", error)
          } finally {
            setBookingLoading(false)
          }
        }}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking for "${cancelBookingDialog.productName}"?`}
        confirmText="Cancel Booking"
        loading={bookingLoading}
        variant="danger"
      />
      
      <BottomNav />
    </div>
  )
}

export default function WishlistPage() {
  return <WishlistPageContent />
}
