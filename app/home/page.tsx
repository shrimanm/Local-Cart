"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, Menu } from "lucide-react"
import BannerCarousel from "@/components/home/banner-carousel"
import CategoryTabs from "@/components/home/category-tabs"
import ProductCard from "@/components/products/product-card"
import Header from "@/components/home/header"
import BottomNav from "@/components/ui/bottom-nav"
import RouteGuard from "@/components/auth/route-guard"
import { useBackButton } from "@/hooks/useBackButton"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"
import type { Product } from "@/lib/types"

function HomePageContent() {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [priceRange, setPriceRange] = useState([0, 10000])


  const [showFilters, setShowFilters] = useState(false)
  const [isClosingFilters, setIsClosingFilters] = useState(false)
  const [activeFilterSection, setActiveFilterSection] = useState<string>('price')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedShops, setSelectedShops] = useState<string[]>([])
  const [selectedTowns, setSelectedTowns] = useState<string[]>([])
  const [userTown, setUserTown] = useState<string | null>(null)
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [availableShops, setAvailableShops] = useState<string[]>([])
  const [availableTowns, setAvailableTowns] = useState<string[]>([])
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([])
  const [customMinPrice, setCustomMinPrice] = useState('')
  const [customMaxPrice, setCustomMaxPrice] = useState('')
  
  // Temporary filter states (only applied on "Apply Filters" click)
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>([])
  const [tempSelectedShops, setTempSelectedShops] = useState<string[]>([])
  const [tempSelectedTowns, setTempSelectedTowns] = useState<string[]>([])
  const [tempSelectedPriceRanges, setTempSelectedPriceRanges] = useState<string[]>([])
  const [tempCustomMinPrice, setTempCustomMinPrice] = useState('')
  const [tempCustomMaxPrice, setTempCustomMaxPrice] = useState('')
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [brandSearch, setBrandSearch] = useState('')
  const [shopSearch, setShopSearch] = useState('')
  const [townSearch, setTownSearch] = useState('')
  const [wishlistedItems, setWishlistedItems] = useState<Set<string>>(new Set())

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [profileChecking, setProfileChecking] = useState(true)

  // Prevent app exit on back button
  const { goBack } = useBackButton({
    preventExit: true,
    fallbackUrl: "/home"
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    // Check if user needs to complete profile (only for truly new users)
    if (!user.name) {
      router.push("/onboarding")
      return
    }



    // Profile is complete, allow home page to load
    setProfileChecking(false)
  }, [user, router])

  useEffect(() => {
    if (user && user.name) {
      fetchUserTown()
      fetchWishlist()
      fetchFilterOptions()
      loadFilters()
      
      // Handle category from URL parameter
      const categoryParam = searchParams.get('category')
      if (categoryParam) {
        const trimmedCategory = categoryParam.trim()
        setSelectedCategories([trimmedCategory])
        
        // Also set the category tab based on banner category
        const categoryMapping: Record<string, string> = {
          "Women's Clothing": "women",
          "Men's Clothing": "men", 
          "Kids Clothing": "kids",
          "Beauty & Personal Care": "beauty",
          "Home & Living": "home",
          "Footwear": "footwear",
          "Accessories": "accessories",
          "Sports & Fitness": "sports",
          "Electronics": "electronics"
        }
        
        // Tab selection is now handled in the fetchProducts useEffect
      }
    }
  }, [user, token, searchParams])

  // Sync all temp filters with actual filters when filter opens
  useEffect(() => {
    if (showFilters) {
      setTempSelectedBrands(selectedBrands)
      setTempSelectedShops(selectedShops)
      setTempSelectedTowns(selectedTowns)
      setTempSelectedPriceRanges(selectedPriceRanges)
      setTempCustomMinPrice(customMinPrice)
      setTempCustomMaxPrice(customMaxPrice)
      setTempSelectedCategories(selectedCategories)
    }
  }, [showFilters, selectedBrands, selectedShops, selectedTowns, selectedPriceRanges, customMinPrice, customMaxPrice, selectedCategories])

  useEffect(() => {
    if (user && user.name && selectedTowns.length > 0) {
      saveFilters()
      fetchProducts()
    }
  }, [selectedCategory, sortBy, searchQuery, selectedBrands, selectedShops, selectedTowns, selectedPriceRanges, customMinPrice, customMaxPrice, selectedCategories, pagination.page])

  const saveFilters = () => {
    const filters = {
      searchQuery, selectedCategory, selectedBrands, selectedShops, selectedTowns,
      selectedCategories, selectedPriceRanges, customMinPrice, customMaxPrice, sortBy
    }
    sessionStorage.setItem('homeFilters', JSON.stringify(filters))
  }

  const loadFilters = () => {
    try {
      const saved = sessionStorage.getItem('homeFilters')
      if (saved) {
        const filters = JSON.parse(saved)
        setSearchQuery(filters.searchQuery || '')
        setSelectedCategory(filters.selectedCategory || 'all')
        setSelectedBrands(filters.selectedBrands || [])
        setSelectedShops(filters.selectedShops || [])
        if (filters.selectedTowns?.length) setSelectedTowns(filters.selectedTowns)
        setSelectedCategories(filters.selectedCategories || [])
        setSelectedPriceRanges(filters.selectedPriceRanges || [])
        setCustomMinPrice(filters.customMinPrice || '')
        setCustomMaxPrice(filters.customMaxPrice || '')
        setSortBy(filters.sortBy || 'rating')
      }
    } catch (e) {}
  }



  // Refetch filter options when towns change
  useEffect(() => {
    if (selectedTowns.length > 0) {
      fetchFilterOptions(selectedTowns)
      // Clear selected shops when towns change to avoid conflicts
      setSelectedShops([])
      setTempSelectedShops([])
    }
  }, [selectedTowns])

  // Also refetch when temp towns change (for immediate filter modal update)
  useEffect(() => {
    if (showFilters && tempSelectedTowns.length > 0) {
      fetchFilterOptions(tempSelectedTowns)
    }
  }, [tempSelectedTowns, showFilters])

  const fetchUserTown = async () => {
    if (!token) return
    
    try {
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.user?.city) {
        // Check if user has a saved browsing town preference
        const savedTown = localStorage.getItem('selectedTown')
        const townToUse = savedTown || data.user.city
        setUserTown(townToUse)
        // Set selected town as default filter
        setSelectedTowns([townToUse])
      }
    } catch (error) {
      console.error('Error fetching user town:', error)
    }
  }

  // Listen for town changes from header
  useEffect(() => {
    const handleTownChange = (event: any) => {
      const newTown = event.detail
      console.log('Town changed to:', newTown)
      setUserTown(newTown)
      setSelectedTowns([newTown])
      // Reset pagination when town changes
      setPagination(prev => ({ ...prev, page: 1 }))
    }

    window.addEventListener('townChanged', handleTownChange)
    return () => window.removeEventListener('townChanged', handleTownChange)
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        sort: sortBy,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchQuery) params.append("search", searchQuery)

      // Handle price filtering - only apply if filters are actually set
      if (customMinPrice || customMaxPrice || selectedPriceRanges.length > 0) {
        let minPrice = 0
        let maxPrice = 50000
        
        // Custom price range takes priority
        if (customMinPrice) minPrice = parseInt(customMinPrice)
        if (customMaxPrice) maxPrice = parseInt(customMaxPrice)
        
        // If no custom price, use selected price ranges
        if (!customMinPrice && !customMaxPrice && selectedPriceRanges.length > 0) {
          const ranges = selectedPriceRanges.map(range => {
            if (range === '0-500') return { min: 0, max: 500 }
            if (range === '501-1000') return { min: 501, max: 1000 }
            if (range === '1001-1500') return { min: 1001, max: 1500 }
            if (range === '1501-2000') return { min: 1501, max: 2000 }
            if (range === '2001-3000') return { min: 2001, max: 3000 }
            if (range === '3000+') return { min: 3000, max: 50000 }
            return { min: 0, max: 50000 }
          })
          minPrice = Math.min(...ranges.map(r => r.min))
          maxPrice = Math.max(...ranges.map(r => r.max))
        }
        
        if (minPrice > 0) params.append("minPrice", minPrice.toString())
        if (maxPrice < 50000) params.append("maxPrice", maxPrice.toString())
      }
      if (selectedBrands.length > 0) params.append("brands", selectedBrands.join(','))
      if (selectedShops.length > 0) params.append("shops", selectedShops.join(','))
      if (selectedTowns.length > 0) {
        console.log('Filtering by towns:', selectedTowns)
        params.append("towns", selectedTowns.join(','))
      } else {
        console.log('No town filter - this should not happen, defaulting to user town')
        // If no towns selected, default to user's current town
        if (userTown) {
          params.append("towns", userTown)
        }
      }
      if (selectedCategories.length > 0) {
        console.log('Applying category filter:', selectedCategories)
        params.append("categories", selectedCategories.join(','))
      }

      const url = `/api/products?${params}`
      console.log('Fetching products with URL:', url)
      const response = await fetch(url)
      const data = await response.json()
      console.log('Products response:', data.products?.length, 'products found')

      if (response.ok) {
        console.log('Products fetched:', data.products?.length, 'Total:', data.pagination?.total)
        console.log('Current page:', data.pagination?.page, 'Total pages:', data.pagination?.pages)
        console.log('Product names:', data.products?.map((p: any) => p.name))
        setProducts(data.products || [])
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 0 })
      } else {
        console.error('Failed to fetch products:', response.status, data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWishlist = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (response.ok) {
        const wishlistedIds = new Set<string>(data.items.map((item: any) => item.productId))
        setWishlistedItems(wishlistedIds)
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
    }
  }

  const fetchFilterOptions = async (towns = selectedTowns) => {
    try {
      // Fetch product filters (brands, shops, categories) with town filter
      const params = new URLSearchParams()
      if (towns.length > 0) {
        params.append('towns', towns.join(','))
      }
      
      const response = await fetch(`/api/products/filters?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('Filter options:', data)
        setAvailableBrands(data.brands || [])
        setAvailableShops(data.shops || [])
        setAvailableCategories(data.categories || [])
      }
      
      // Fetch towns from admin API
      const townsResponse = await fetch('/api/admin/towns')
      const townsData = await townsResponse.json()
      
      if (townsResponse.ok) {
        const townNames = townsData.towns.map((town: any) => town.name)
        setAvailableTowns(townNames)
        console.log('Available towns:', townNames)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
      // Fallback to sample data
      console.log('Filter API error:', error)
      setAvailableBrands(['Nike', 'Adidas', 'Puma', 'Reebok'])
      setAvailableShops(['Fashion Store', 'Style Hub', 'Trendy Shop'])
    }
  }

  const handleWishlistToggle = async (productId: string) => {
    if (!token) return

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
        const data = await response.json()
        setWishlistedItems((prev) => {
          const newSet = new Set(prev)
          if (data.action === "added") {
            newSet.add(productId)
          } else {
            newSet.delete(productId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }



  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSortBy("rating")
    setPriceRange([0, 10000])
    setSelectedBrands([])
    setSelectedShops([])
    // Reset to current user's town (from header)
    setSelectedTowns(userTown ? [userTown] : [])
    setSelectedPriceRanges([])
    setCustomMinPrice('')
    setCustomMaxPrice('')
    setSelectedCategories([])
    setBrandSearch('')
    setShopSearch('')
    setTownSearch('')
    
    // Also reset temporary states to current town
    setTempSelectedBrands([])
    setTempSelectedShops([])
    setTempSelectedTowns(userTown ? [userTown] : [])
    setTempSelectedPriceRanges([])
    setTempCustomMinPrice('')
    setTempCustomMaxPrice('')
    setTempSelectedCategories([])

    setPagination((prev) => ({ ...prev, page: 1 }))
    
    // Clear saved filters
    sessionStorage.removeItem('homeFilters')
  }

  // Show loading while checking profile completion or waiting for town
  if (profileChecking || (user && user.name && selectedTowns.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Banner Carousel */}
        <div className="py-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <BannerCarousel />
          </div>
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={(category) => {
            setSelectedCategory(category)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
        />

        {/* Filter Controls */}
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Side - Filter and Clear */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)} 
                className="px-3 py-1.5 rounded-lg border hover:border-gray-400 transition-all duration-200 text-xs whitespace-nowrap"
              >
                <svg className="h-3 w-3 mr-1.5" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="2" width="14" height="1.5" rx="0.75" />
                  <rect x="3" y="6" width="10" height="1.5" rx="0.75" />
                  <rect x="5" y="10" width="6" height="1.5" rx="0.75" />
                </svg>
                {t('filters')}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters} 
                className="border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs whitespace-nowrap"
              >
                {t('clearAll')}
              </Button>
            </div>

            {/* Right Side - Sort Options */}
            <div className="min-w-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-auto min-w-[120px] rounded-lg border hover:border-gray-400 transition-all duration-200 text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="rating">{t('highestRated')}</SelectItem>
                  <SelectItem value="createdAt">{t('newestFirst')}</SelectItem>
                  <SelectItem value="price">{t('priceLowToHigh')}</SelectItem>
                  <SelectItem value="-price">{t('priceHighToLow')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div 
              className={`fixed inset-0 bg-black/50 z-50 ${isClosingFilters ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-300'}`}
              onClick={() => {
                setIsClosingFilters(true)
                setTimeout(() => {
                  setShowFilters(false)
                  setIsClosingFilters(false)
                }, 300)
              }}
            >
              <div 
                className={`absolute top-0 left-1/2 transform -translate-x-1/2 bg-white rounded-b-2xl max-h-[80vh] overflow-y-auto w-full max-w-4xl ${isClosingFilters ? 'animate-out slide-out-to-top duration-300 ease-in' : 'animate-in slide-in-from-top duration-500 ease-out'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="text-base font-medium">{t('filters')}</h3>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-900">
                        {t('clearAll')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setIsClosingFilters(true)
                        setTimeout(() => {
                          setShowFilters(false)
                          setIsClosingFilters(false)
                        }, 300)
                      }}>
                        ✕
                      </Button>
                    </div>
                  </div>

                  {/* AJIO Style Filter Layout */}
                  <div className="flex h-96">
                    {/* Left Column - Filter Categories */}
                    <div className="w-2/5 bg-gray-50 space-y-0 shadow-lg">
                      <div 
                        onClick={() => setActiveFilterSection('price')}
                        className={`p-4 border-b cursor-pointer text-sm font-medium ${
                          activeFilterSection === 'price' 
                            ? 'bg-white border-l-4 border-l-gray-900 text-gray-900' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('price')}
                      </div>
                      <div 
                        onClick={() => setActiveFilterSection('brand')}
                        className={`p-4 border-b cursor-pointer text-sm font-medium ${
                          activeFilterSection === 'brand' 
                            ? 'bg-white border-l-4 border-l-gray-900 text-gray-900' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('brand')}
                      </div>
                      <div 
                        onClick={() => setActiveFilterSection('shop')}
                        className={`p-4 border-b cursor-pointer text-sm font-medium ${
                          activeFilterSection === 'shop' 
                            ? 'bg-white border-l-4 border-l-gray-900 text-gray-900' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('shop')}
                      </div>
                      <div 
                        onClick={() => setActiveFilterSection('town')}
                        className={`p-4 border-b cursor-pointer text-sm font-medium ${
                          activeFilterSection === 'town' 
                            ? 'bg-white border-l-4 border-l-gray-900 text-gray-900' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('town')}
                      </div>
                      <div 
                        onClick={() => setActiveFilterSection('category')}
                        className={`p-4 border-b cursor-pointer text-sm font-medium ${
                          activeFilterSection === 'category' 
                            ? 'bg-white border-l-4 border-l-gray-900 text-gray-900' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('category')}
                      </div>
                    </div>
                    
                    {/* Right Column - Filter Options */}
                    <div className="w-3/5 bg-white p-4 overflow-y-auto shadow-lg">
                      {/* Price Range Section */}
                      {activeFilterSection === 'price' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-800">{t('price')}</h4>
                            <button 
                              onClick={() => {
                                setTempSelectedPriceRanges([])
                                setTempCustomMinPrice('')
                                setTempCustomMaxPrice('')
                              }}
                              className="text-xs text-gray-900 hover:underline"
                            >
                              {t('clear')}
                            </button>
                          </div>
                          
                          {/* Predefined Price Ranges */}
                          <div className="space-y-3">
                            {[
                              { label: 'Below ₹500', value: '0-500' },
                              { label: '₹501 - ₹1000', value: '501-1000' },
                              { label: '₹1001 - ₹1500', value: '1001-1500' },
                              { label: '₹1501 - ₹2000', value: '1501-2000' },
                              { label: '₹2001 - ₹3000', value: '2001-3000' },
                              { label: 'More than ₹3000', value: '3000+' }
                            ].map((range) => (
                              <label key={range.value} className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={tempSelectedPriceRanges.includes(range.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTempSelectedPriceRanges([...tempSelectedPriceRanges, range.value])
                                    } else {
                                      setTempSelectedPriceRanges(tempSelectedPriceRanges.filter(r => r !== range.value))
                                    }
                                  }}
                                  className="w-4 h-4 text-[#00B4D8] border-gray-300 rounded focus:ring-[#00B4D8]"
                                />
                                <span className="text-sm text-gray-700">{range.label}</span>
                              </label>
                            ))}
                          </div>
                          
                          {/* Custom Price Range */}
                          <div className="pt-4 border-t border-gray-200">
                            <h5 className="text-xs font-medium mb-3 text-gray-800">{t('customRange')}</h5>
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <Input 
                                  type="number" 
                                  placeholder={t('min')} 
                                  value={tempCustomMinPrice}
                                  onChange={(e) => setTempCustomMinPrice(e.target.value)}
                                  className="text-sm border-gray-300 focus:border-gray-900"
                                />
                              </div>
                              <span className="text-gray-400 text-sm">{t('to')}</span>
                              <div className="flex-1">
                                <Input 
                                  type="number" 
                                  placeholder={t('max')} 
                                  value={tempCustomMaxPrice}
                                  onChange={(e) => setTempCustomMaxPrice(e.target.value)}
                                  className="text-sm border-gray-300 focus:border-gray-900"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Brand Section */}
                      {activeFilterSection === 'brand' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-800">{t('brand')}</h4>
                            <button 
                              onClick={() => {
                                setTempSelectedBrands([])
                                setBrandSearch('')
                              }}
                              className="text-xs text-[#00B4D8] hover:underline"
                            >
                              CLEAR
                            </button>
                          </div>
                          <Input 
                            type="text" 
                            placeholder={t('searchBrands')} 
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            className="text-sm border-gray-300 focus:border-[#00B4D8]"
                          />
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {availableBrands.length > 0 ? availableBrands
                              .filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                              .map((brand) => (
                              <label key={brand} className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={tempSelectedBrands.includes(brand)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTempSelectedBrands([...tempSelectedBrands, brand])
                                    } else {
                                      setTempSelectedBrands(tempSelectedBrands.filter(b => b !== brand))
                                    }
                                  }}
                                  className="w-4 h-4 text-[#00B4D8] border-gray-300 rounded focus:ring-[#00B4D8]"
                                />
                                <span className="text-sm text-gray-700">{brand}</span>
                              </label>
                            )) : (
                              <div className="text-center py-4 text-gray-500 text-sm">{t('loadingBrands')}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Shop Section */}
                      {activeFilterSection === 'shop' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-800">{t('shop')}</h4>
                            <button 
                              onClick={() => {
                                setTempSelectedShops([])
                                setShopSearch('')
                              }}
                              className="text-xs text-[#00B4D8] hover:underline"
                            >
                              CLEAR
                            </button>
                          </div>
                          <Input 
                            type="text" 
                            placeholder={t('searchShops')} 
                            value={shopSearch}
                            onChange={(e) => setShopSearch(e.target.value)}
                            className="text-sm border-gray-300 focus:border-[#00B4D8]"
                          />
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {availableShops.length > 0 ? availableShops
                              .filter(shop => shop.toLowerCase().includes(shopSearch.toLowerCase()))
                              .map((shop) => (
                              <label key={shop} className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={tempSelectedShops.includes(shop)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTempSelectedShops([...tempSelectedShops, shop])
                                    } else {
                                      setTempSelectedShops(tempSelectedShops.filter(s => s !== shop))
                                    }
                                  }}
                                  className="w-4 h-4 text-[#00B4D8] border-gray-300 rounded focus:ring-[#00B4D8]"
                                />
                                <span className="text-sm text-gray-700">{shop}</span>
                              </label>
                            )) : (
                              <div className="text-center py-4 text-gray-500 text-sm">{t('loadingShops')}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Town Section */}
                      {activeFilterSection === 'town' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-800">{t('town')}</h4>
                            <button 
                              onClick={() => {
                                setTempSelectedTowns([])
                                setTownSearch('')
                              }}
                              className="text-xs text-[#00B4D8] hover:underline"
                            >
                              CLEAR
                            </button>
                          </div>
                          <Input 
                            type="text" 
                            placeholder={t('searchTowns')} 
                            value={townSearch}
                            onChange={(e) => setTownSearch(e.target.value)}
                            className="text-sm border-gray-300 focus:border-[#00B4D8]"
                          />
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {availableTowns.length > 0 ? availableTowns
                              .filter(town => town.toLowerCase().includes(townSearch.toLowerCase()))
                              .map((town) => (
                              <label key={town} className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={tempSelectedTowns.includes(town)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTempSelectedTowns([...tempSelectedTowns, town])
                                    } else {
                                      setTempSelectedTowns(tempSelectedTowns.filter(t => t !== town))
                                    }
                                  }}
                                  className="w-4 h-4 text-[#00B4D8] border-gray-300 rounded focus:ring-[#00B4D8]"
                                />
                                <span className="text-sm text-gray-700">{town}</span>
                              </label>
                            )) : (
                              <div className="text-center py-4 text-gray-500 text-sm">{t('loadingTowns')}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Category Section */}
                      {activeFilterSection === 'category' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-800">{t('category')}</h4>
                            <button 
                              onClick={() => {
                                setTempSelectedCategories([])
                              }}
                              className="text-xs text-[#00B4D8] hover:underline"
                            >
                              CLEAR
                            </button>
                          </div>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {availableCategories.length > 0 ? availableCategories.map((category) => (
                              <label key={category} className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={tempSelectedCategories.includes(category)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTempSelectedCategories([...tempSelectedCategories, category])
                                    } else {
                                      setTempSelectedCategories(tempSelectedCategories.filter(c => c !== category))
                                    }
                                  }}
                                  className="w-4 h-4 text-[#00B4D8] border-gray-300 rounded focus:ring-[#00B4D8]"
                                />
                                <span className="text-sm text-gray-700">{category}</span>
                              </label>
                            )) : (
                              <div className="text-center py-4 text-gray-500 text-sm">{t('loadingCategories')}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        // Apply the temporary filters to actual filter states
                        setSelectedBrands(tempSelectedBrands)
                        setSelectedShops(tempSelectedShops)
                        setSelectedTowns(tempSelectedTowns.length > 0 ? tempSelectedTowns : (userTown ? [userTown] : []))
                        setSelectedPriceRanges(tempSelectedPriceRanges)
                        setCustomMinPrice(tempCustomMinPrice)
                        setCustomMaxPrice(tempCustomMaxPrice)
                        setSelectedCategories(tempSelectedCategories)
                        
                        setIsClosingFilters(true)
                        setTimeout(() => {
                          setShowFilters(false)
                          setIsClosingFilters(false)
                        }, 300)
                      }} 
                      className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
                    >
                      {t('applyFilters')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        
        {/* Products Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <div className="aspect-[3/4] bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">🔍</div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900">{t('noProductsFound')}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-8">{t('tryAdjusting')}</p>
                  <Button 
                    onClick={resetFilters} 
                    className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {t('clearFilters')}
                  </Button>
                </div>
              </div>
            ) : (
              <>


                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onWishlistToggle={handleWishlistToggle}
                      isWishlisted={wishlistedItems.has(product.id)}
                    />
                  ))}
                </div>

                {/* Modern Load More Button */}
                {pagination.page < pagination.pages && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white px-12 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    >
                      {t('loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function HomePage() {
  return (
    <RouteGuard>
      <HomePageContent />
    </RouteGuard>
  )
}
