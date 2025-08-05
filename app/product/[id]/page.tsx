"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/app/providers"
import { Heart, Star, Eye, Calendar, CheckCircle, Share2, ArrowLeft, ChevronLeft, ChevronRight, Store } from "lucide-react"
import { Notification, useNotification } from "@/components/ui/notification"
import ConfirmationDialog from "@/components/ui/confirmation-dialog"
import type { Product } from "@/lib/types"
import { formatPrice } from "@/lib/utils"
import BottomNav from "@/components/ui/bottom-nav"
import BookingDialog from "@/components/ui/booking-dialog"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"

function ProductPageContent() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedVariant, setSelectedVariant] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addingToWishlist, setAddingToWishlist] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [reviews, setReviews] = useState<any[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [cancelBookingDialog, setCancelBookingDialog] = useState<{ isOpen: boolean; productName: string }>({ isOpen: false, productName: '' })
  const [bookingDialog, setBookingDialog] = useState<{ isOpen: boolean; product: any }>({ isOpen: false, product: null })
  const [selectionDialog, setSelectionDialog] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' })
  const [buttonClicked, setButtonClicked] = useState(false)
  const [shopInfo, setShopInfo] = useState<any>(null)
  const { notification, showNotification, hideNotification } = useNotification()

  useEffect(() => {
    fetchProduct()
    fetchReviews()
    if (user && token) {
      checkWishlistStatus()
      checkBookingStatus()
    }
  }, [params.id, user, token])

  const fetchShopInfo = async (shopId: string) => {
    try {
      console.log('Fetching shop info for shopId:', shopId, 'Type:', typeof shopId)
      const response = await fetch(`/api/shops/${shopId}`)
      const data = await response.json()
      console.log('Shop API response status:', response.status)
      console.log('Shop API response data:', data)
      if (response.ok && data.shop) {
        setShopInfo(data.shop)
        console.log('Shop info successfully set:', data.shop)
      } else {
        console.log('Shop API error or no shop data:', data)
        setShopInfo(null)
      }
    } catch (error) {
      console.error('Error fetching shop info:', error)
      setShopInfo(null)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setProduct(data.product)
        // Fetch shop info if shopId is available
        console.log('Product data:', data.product)
        if (data.product.shopId) {
          console.log('Found shopId:', data.product.shopId)
          fetchShopInfo(data.product.shopId)
        } else {
          console.log('No shopId found in product')
        }
        // Don't set default size/variant/color - user must select
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const checkWishlistStatus = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (response.ok) {
        const isInWishlist = data.items.some((item: any) => item.productId === params.id)
        setIsWishlisted(isInWishlist)
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error)
    }
  }

  const checkBookingStatus = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/booked", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (response.ok) {
        const isInBooked = data.items.some((item: any) => item.productId === params.id)
        setIsBooked(isInBooked)
      }
    } catch (error) {
      console.error("Error checking booking status:", error)
    }
  }

  const handleBookClick = () => {
    if (isBooked) {
      // If already booked, show confirmation dialog
      setCancelBookingDialog({ isOpen: true, productName: product?.name || '' })
      return
    } else {
      // Check if size/variant/color is required and selected
      const hasVariants = (product?.variants && product.variants.length > 0) || (product?.sizes && product.sizes.length > 0)
      const hasColors = product?.colors && product.colors.length > 0
      const hasVariantSelection = selectedVariant || selectedSize
      
      if (hasVariants && !hasVariantSelection) {
        setSelectionDialog({ isOpen: true, message: 'Please select a size/variant before booking' })
        return
      }
      
      if (hasColors && !selectedColor) {
        setSelectionDialog({ isOpen: true, message: 'Please select a color before booking' })
        return
      }
      
      // If not booked, show confirmation dialog
      setBookingDialog({ isOpen: true, product })
    }
  }

  const confirmBooking = async () => {
    setBookingLoading(true)
    try {
      await handleBookNow()
      setBookingDialog({ isOpen: false, product: null })
    } catch (error) {
      console.error("Error confirming booking:", error)
    } finally {
      setBookingLoading(false)
    }
  }

  const handleBookNow = async () => {
    if (!token || !product) return

    try {
      const response = await fetch("/api/booked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          productId: product.id,
          size: selectedSize,
          variant: selectedVariant,
          color: selectedColor
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsBooked(data.action === "added")
        
        // Show toast notification
        if (data.action === "added") {
          showNotification('Product booked successfully! 🎉', 'success')
        } else {
          showNotification('Booking cancelled', 'info')
        }
      }
    } catch (error) {
      console.error("Error booking product:", error)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      // You can add a toast notification here if needed
      console.log('URL copied to clipboard')
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!token || !product) return

    setSubmittingReview(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      })

      if (response.ok) {
        setShowReviewForm(false)
        setNewReview({ rating: 5, comment: "" })
        fetchReviews()
        fetchProduct() // Refresh product to update rating
      }
    } catch (error) {
      console.error("Error submitting review:", error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleAddToWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!token || !product) return

    // Force button to lose focus immediately
    e.currentTarget.blur()
    // Remove any active/focus states
    ;(document.activeElement as HTMLElement)?.blur()

    setAddingToWishlist(true)
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          productId: product.id,
          size: selectedSize,
          variant: selectedVariant,
          color: selectedColor
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsWishlisted(data.action === "added")
        // Trigger wishlist count update after state update
        setTimeout(() => {
          window.dispatchEvent(new Event('wishlist-updated'))
        }, 100)
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error)
    } finally {
      setAddingToWishlist(false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && selectedImage < product!.images.length - 1) {
      changeImage(selectedImage + 1)
    }
    if (isRightSwipe && selectedImage > 0) {
      changeImage(selectedImage - 1)
    }
  }

  const changeImage = (newIndex: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setSelectedImage(newIndex)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const handleToggleWishlist = async () => {
    if (!token || !product) return

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsWishlisted(data.action === "added")
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.push("/home")}>Go Back to Home</Button>
        </div>
      </div>
    )
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={hideNotification}
      />
      {/* Modern Back Button */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/home')}
          className="flex items-center hover:bg-gray-100 rounded-full p-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {t('back')}
        </Button>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden group shadow-lg">
              {/* Wishlist Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddToWishlist}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg z-10 hover:scale-110 transition-all duration-200"
              >
                <Heart className={`h-4 w-4 transition-all duration-200 ${isWishlisted ? "fill-red-500 text-red-500 scale-110" : "text-gray-700 hover:text-red-400"}`} />
              </Button>
              {/* Modern Share Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="absolute top-16 right-4 bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg z-10 hover:scale-110 transition-all duration-200"
              >
                <Share2 className="h-4 w-4 text-gray-700" />
              </Button>
              
              {/* Scrollable Image Container */}
              <div 
                className="flex h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing"
                style={{ scrollBehavior: 'smooth' }}
                onScroll={(e) => {
                  const container = e.currentTarget
                  const scrollLeft = container.scrollLeft
                  const itemWidth = container.clientWidth
                  const currentIndex = Math.round(scrollLeft / itemWidth)
                  setSelectedImage(currentIndex)
                }}
              >
                {product.images.map((image, index) => (
                  <div key={index} className="w-full h-full flex-shrink-0 flex items-center justify-center p-6 snap-center">
                    <div className="relative w-full h-full">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-contain select-none"
                        draggable={false}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const container = document.querySelector('.flex.h-full.overflow-x-auto')
                      if (container) {
                        container.scrollTo({ left: index * container.clientWidth, behavior: 'smooth' })
                      }
                      setSelectedImage(index)
                    }}
                    className="flex-shrink-0 w-20 h-20 rounded-lg bg-white transition-all duration-300 hover:scale-105"
                  >
                    <div className={`relative w-full h-full flex items-center justify-center p-2 rounded-lg overflow-hidden transition-all duration-300 ${
                      selectedImage === index ? "opacity-50 bg-gray-100" : "opacity-100"
                    }`}>
                      <Image 
                        src={image || "/placeholder.svg"} 
                        alt="" 
                        fill
                        className="object-contain" 
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Product Details */}
          <div className="space-y-6">
            {/* Product Title & Brand */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3">{product.name}</h1>
                  <p className="text-base sm:text-lg font-semibold text-gray-600 uppercase tracking-wide">{product.brand}</p>
                </div>
                <div className="ml-4">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {t('inStock')}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-base font-medium mb-3">{t('productDetails')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            </div>

            {/* Enhanced Rating & Reviews */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 rounded-full shadow-sm">
                    <Star className="h-5 w-5 fill-white text-white" />
                    <span className="ml-2 text-base font-bold text-white">{product.rating.toFixed(1)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.reviewCount} {t('reviews')}</p>
                    <p className="text-xs text-gray-500">{t('verifiedPurchases')}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl"
                  onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('seeReviews')}
                </Button>
              </div>
            </div>

            {/* Enhanced Price Section */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-lg sm:text-xl text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                        {discount}% OFF
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Modern Variant Selection */}
            {((product.variants && product.variants.length > 0) || (product.sizes && product.sizes.length > 0)) && (
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <h3 className="text-base font-semibold mb-4 text-gray-900">
                  {product.variantType ? product.variantType.charAt(0).toUpperCase() + product.variantType.slice(1) : t('size')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {(product.variants || product.sizes || []).map((variant) => (
                    <Button
                      key={variant}
                      variant="outline"
                      onClick={() => {
                        if (product.variants) {
                          setSelectedVariant(variant)
                        } else {
                          setSelectedSize(variant)
                        }
                      }}
                      className={`min-w-[3rem] rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        (selectedVariant || selectedSize) === variant 
                          ? "border-gray-900 bg-gray-900 text-white shadow-lg" 
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {variant}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Modern Color Selection */}
            {product.colors.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <h3 className="text-base font-semibold mb-4 text-gray-900">{t('color')}</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <Button
                      key={color}
                      variant="outline"
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        selectedColor === color 
                          ? "border-gray-900 bg-gray-900 text-white shadow-lg" 
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Modern Action Buttons */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`flex-1 h-14 px-6 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center focus:outline-none active:scale-95 shadow-lg hover:shadow-xl ${
                    isWishlisted 
                      ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-gray-700 text-white' 
                      : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white bg-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 mr-2 transition-transform duration-200 ${isWishlisted ? 'fill-current scale-110' : 'hover:scale-110'}`} />
                  {addingToWishlist ? t('adding') : isWishlisted ? t('remove') : t('add')}
                </button>
                <button
                  onClick={handleBookClick}
                  disabled={bookingLoading}
                  className={`flex-1 h-14 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center focus:outline-none ${
                    isBooked 
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border-2 border-green-600' 
                      : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white bg-white'
                  }`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  {bookingLoading ? t('booking') : isBooked ? t('unbook') : t('bookNow')}
                </button>
              </div>
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <Eye className="h-6 w-6 mx-auto mb-2 text-gray-900" />
                <p className="text-sm font-medium">{t('viewDetails')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">{t('bookNow')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">{t('qualityProducts')}</p>
              </div>
            </div>

            {/* Shop Information */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="text-base font-semibold mb-4 text-gray-900 flex items-center">
                <Store className="h-5 w-5 mr-2" />
                {t('shopInformation')}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('shopName')}</p>
                  <p className="text-sm text-gray-600">{shopInfo?.name || product.shopName || t('shopNameNotAvailable')}</p>
                </div>
                {shopInfo?.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('description')}</p>
                    <p className="text-sm text-gray-600">{shopInfo.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('town')}</p>
                  <p className="text-sm text-gray-600">{shopInfo?.town || t('townNotAvailable')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('address')}</p>
                  <p className="text-sm text-gray-600">{shopInfo?.address || t('addressNotAvailable')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('contact')}</p>
                  <p className="text-sm text-gray-600">{shopInfo?.contactDetails || t('contactNotAvailable')}</p>
                </div>
                {shopInfo?.locationUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('location')}</p>
                    <a 
                      href="#"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.open(shopInfo.locationUrl.startsWith('http') ? shopInfo.locationUrl : `https://${shopInfo.locationUrl}`, '_blank')
                      }}
                    >
                      {t('viewOnMap')}
                    </a>
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('reviews')} ({reviews.length})</h2>
            <Button 
              onClick={() => setShowReviewForm(!showReviewForm)} 
              variant="outline"
              className="!border-2 !border-gray-900 !text-gray-900 hover:!bg-gray-900 hover:!text-white transition-colors"
            >
              {t('writeReview')}
            </Button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white p-6 rounded-lg border mb-6">
              <h3 className="text-lg font-medium mb-4">{t('writeAReview')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('rating')}</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`text-2xl ${
                          star <= newReview.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('comment')}</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    placeholder={t('shareExperience')}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="!bg-gray-900 hover:!bg-gray-800 !text-white !border-gray-900"
                  >
                    {submittingReview ? t('submitting') : t('submitReview')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('noReviewsYet')}
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-lg border">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium">
                      {review.userInitial}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{review.userName}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= review.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Selection Required Dialog */}
      <Dialog open={selectionDialog.isOpen} onOpenChange={(open) => !open && setSelectionDialog({ isOpen: false, message: '' })}>
        <DialogContent className="max-w-sm border-0 shadow-xl rounded-2xl animate-in slide-in-from-top-4 fade-in-0 duration-300">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">ℹ️</span>
            </div>
            <p className="text-gray-700 mb-6">{selectionDialog.message}</p>
            <Button 
              onClick={() => setSelectionDialog({ isOpen: false, message: '' })} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2 rounded-full hover:scale-105 transition-transform"
            >
              {t('gotIt')}
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
        onClose={() => setCancelBookingDialog({ isOpen: false, productName: '' })}
        onConfirm={async () => {
          setBookingLoading(true)
          try {
            await handleBookNow()
            setCancelBookingDialog({ isOpen: false, productName: '' })
          } catch (error) {
            console.error("Error cancelling booking:", error)
          } finally {
            setBookingLoading(false)
          }
        }}
        title={t('cancelBooking')}
        message={`${t('cancelBookingConfirm')} "${cancelBookingDialog.productName}"?`}
        confirmText={t('cancelBooking')}
        cancelText={t('cancel')}
        loading={bookingLoading}
        variant="danger"
      />
      
      <BottomNav />
    </div>
  )
}

export default function ProductPage() {
  return <ProductPageContent />
}