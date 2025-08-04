"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X, Clock, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/providers"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useLanguage } from "@/hooks/useLanguage"


export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [userTown, setUserTown] = useState<string | null>(null)
  const [availableTowns, setAvailableTowns] = useState<string[]>([])
  const [showTownSelector, setShowTownSelector] = useState(false)
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const townRef = useRef<HTMLDivElement>(null)
  
  // Get current search from URL
  useEffect(() => {
    const currentPath = window.location.pathname
    const currentSearch = new URLSearchParams(window.location.search).get('search')
    if (currentPath === '/home' && currentSearch) {
      setSearchQuery(currentSearch)
    }
  }, [router])

  // Fetch user city and available towns
  useEffect(() => {
    const fetchUserCity = async () => {
      if (!token) return
      
      try {
        const response = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (response.ok && data.user?.city) {
          // Check if user has a saved browsing town preference
          const savedTown = localStorage.getItem('selectedTown')
          setUserTown(savedTown || data.user.city)
        }
      } catch (error) {
        console.error('Error fetching user city:', error)
      }
    }
    
    const fetchTowns = async () => {
      try {
        const response = await fetch('/api/admin/towns')
        const data = await response.json()
        if (response.ok) {
          const townNames = data.towns.map((town: any) => town.name)
          setAvailableTowns(townNames)
        }
      } catch (error) {
        console.error('Error fetching towns:', error)
      }
    }
    
    fetchUserCity()
    fetchTowns()
  }, [token])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    // Close suggestions and city selector when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
      if (townRef.current && !townRef.current.contains(event.target as Node)) {
        setShowTownSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Fetch suggestions when user types
    if (searchQuery.length > 1) {
      setLoading(true)
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`)
          const data = await response.json()
          const productSuggestions = data.products.map((p: any) => p.name).slice(0, 5)
          setSuggestions(productSuggestions)
        } catch (error) {
          console.error('Error fetching suggestions:', error)
        } finally {
          setLoading(false)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
    }
  }, [searchQuery])

  const handleSearch = (query: string = searchQuery) => {
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      // Save to recent searches
      const updated = [trimmedQuery, ...recentSearches.filter(s => s !== trimmedQuery)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      
      setShowSuggestions(false)
      setSearchQuery(trimmedQuery) // Keep the search term visible
      router.push(`/home?search=${encodeURIComponent(trimmedQuery)}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowSuggestions(true)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const clearSearch = () => {
    setSearchQuery('')
    setShowSuggestions(false)
    router.push('/home')
  }

  const handleTownChange = (newTown: string) => {
    setUserTown(newTown)
    setShowTownSelector(false)
    // Save selected town to localStorage
    localStorage.setItem('selectedTown', newTown)
    // Trigger town change event for home page to listen
    window.dispatchEvent(new CustomEvent('townChanged', { detail: newTown }))
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/home" className="flex items-center space-x-2">
              <img src="/logo.png" alt="LocalCart Logo" className="h-12 w-12" />
              <h1 className="text-2xl font-black text-red-700">LocalCart</h1>
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8" ref={searchRef}>
            <div className="relative w-full">
              <Input
                ref={inputRef}
                type="text"
                placeholder={t('searchProducts')}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-4 pr-16 py-2 w-full"
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch()}
                  className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-900"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && (searchQuery.length > 0 || recentSearches.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {/* Recent Searches */}
                  {searchQuery.length === 0 && recentSearches.length > 0 && (
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{t('recentSearches')}</span>
                        <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs">
                          Clear All
                        </Button>
                      </div>
                      {recentSearches.map((search, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchQuery(search)
                            handleSearch(search)
                          }}
                          className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                        >
                          <Clock className="h-4 w-4 text-gray-400 mr-3" />
                          <span className="text-sm">{search}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Live Suggestions */}
                  {searchQuery.length > 0 && (
                    <div className="p-3">
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-gray-900 mx-auto"></div>
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => handleSearch(suggestion)}
                            className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                          >
                            <Search className="h-4 w-4 text-gray-400 mr-3" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          {t('noSuggestions')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Location Display */}
            {userTown && (
              <div className="relative" ref={townRef}>
                <div 
                  onClick={() => setShowTownSelector(!showTownSelector)}
                  className="flex items-center space-x-1 text-gray-600 bg-gray-50 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium capitalize truncate max-w-24 sm:max-w-32" title={userTown}>{userTown}</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
                {showTownSelector && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 sm:w-64 max-h-64 overflow-y-auto scrollbar-hide">
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 mb-2 px-2">{t('selectTown')}</p>
                      {availableTowns.map((town) => (
                        <div
                          key={town}
                          onClick={() => handleTownChange(town)}
                          className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-gray-200 last:border-b-0 transition-colors duration-150 ${
                            town === userTown ? 'bg-gray-100 text-gray-800 font-medium' : 'text-gray-700'
                          }`}
                          title={town}
                        >
                          {town}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Notifications */}
            <NotificationBell />
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div ref={searchRef}>
            <div className="relative">
              <Input
                type="text"
                placeholder={t('searchProducts')}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-4 pr-16 py-2 w-full"
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch()}
                  className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-900"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Mobile Search Suggestions */}
              {showSuggestions && (searchQuery.length > 0 || recentSearches.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {/* Recent Searches */}
                  {searchQuery.length === 0 && recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Recent</span>
                        <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs h-6">
                          Clear
                        </Button>
                      </div>
                      {recentSearches.map((search, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchQuery(search)
                            handleSearch(search)
                          }}
                          className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded text-sm"
                        >
                          <Clock className="h-3 w-3 text-gray-400 mr-2" />
                          <span>{search}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Live Suggestions */}
                  {searchQuery.length > 0 && (
                    <div className="p-2">
                      {loading ? (
                        <div className="text-center py-3">
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-gray-900 mx-auto"></div>
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => handleSearch(suggestion)}
                            className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded text-sm"
                          >
                            <Search className="h-3 w-3 text-gray-400 mr-2" />
                            <span>{suggestion}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-3 text-gray-500 text-xs">
                          No suggestions
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}