"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, ArrowLeft, MapPin, Phone, Building2, FileText } from "lucide-react"
import { Notification, useNotification } from "@/components/ui/notification"
import { useLanguage } from "@/hooks/useLanguage"

function MerchantRegisterContent() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    town: "",
    locationUrl: "",
    contactDetails: "",
  })
  const [towns, setTowns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [townsLoading, setTownsLoading] = useState(true)
  const [error, setError] = useState("")
  const { user, token } = useAuth()
  const router = useRouter()
  const { notification, showNotification, hideNotification } = useNotification()
  const { t } = useLanguage()

  useEffect(() => {
    if (!user || !token) {
      router.push("/")
      return
    }

    if (user.role === "merchant") {
      router.push("/merchant")
      return
    }

    fetchTowns()
  }, [user, token, router])

  const fetchTowns = async () => {
    try {
      const response = await fetch("/api/admin/towns")
      if (response.ok) {
        const data = await response.json()
        setTowns(data.towns)
      }
    } catch (error) {
      console.error("Error fetching towns:", error)
    } finally {
      setTownsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address || !formData.town || !formData.contactDetails) {
      setError(t('fillRequiredFields') || "Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/merchant/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        showNotification(t('shopRegisteredSuccess') || "Shop registered successfully! Redirecting...", "success")
        // Force refresh to update user context
        setTimeout(() => {
          window.location.href = "/profile"
        }, 1500)
      } else {
        setError(data.error || t('failedToRegisterShop') || "Failed to register shop")
      }
    } catch (error) {
      setError(t('networkError') || "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={hideNotification}
      />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/profile")} 
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">{t('registerYourShop') || 'Register Your Shop'}</h1>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('becomeAMerchant')}</h2>
            <p className="text-white/90 text-sm max-w-md mx-auto">
              {t('shopRegistrationDesc') || 'Fill in the details below to register your shop and start selling on our platform'}
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shop Name */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-900" />
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    {t('shopName')} *
                  </Label>
                </div>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('enterShopName') || "Enter your shop name"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl border-2 focus:border-gray-900 transition-all duration-200"
                  required
                />
              </div>

              {/* Shop Description */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-900" />
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    {t('description')}
                  </Label>
                </div>
                <Textarea
                  id="description"
                  placeholder={t('describeShop') || "Describe your shop and what you sell"}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl border-2 focus:border-gray-900 transition-all duration-200 resize-none"
                  rows={3}
                />
              </div>

              {/* Shop Address */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-900" />
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                    {t('address')} *
                  </Label>
                </div>
                <Textarea
                  id="address"
                  placeholder={t('enterCompleteAddress') || "Enter your complete shop address"}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl border-2 focus:border-gray-900 transition-all duration-200 resize-none"
                  required
                  rows={3}
                />
              </div>

              {/* Town Selection */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-900" />
                  <Label htmlFor="town" className="text-sm font-semibold text-gray-700">
                    {t('town')} *
                  </Label>
                </div>
                <Select value={formData.town} onValueChange={(value) => setFormData({ ...formData, town: value })}>
                  <SelectTrigger className="rounded-xl border-2 hover:border-gray-900 transition-all duration-200">
                    <SelectValue placeholder={townsLoading ? t('loadingTowns') || "Loading towns..." : t('selectTown')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {towns.map((town) => (
                      <SelectItem key={town._id} value={town.name}>
                        {town.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location URL */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-900" />
                  <Label htmlFor="locationUrl" className="text-sm font-semibold text-gray-700">
                    {t('locationUrl') || 'Location URL (Google Maps)'}
                  </Label>
                </div>
                <Input
                  id="locationUrl"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={formData.locationUrl}
                  onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                  className="rounded-xl border-2 focus:border-gray-900 transition-all duration-200"
                />
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-900" />
                  <Label htmlFor="contactDetails" className="text-sm font-semibold text-gray-700">
                    {t('contact')} *
                  </Label>
                </div>
                <Input
                  id="contactDetails"
                  type="text"
                  placeholder={t('enterContactDetails') || "Phone number, email, etc."}
                  value={formData.contactDetails}
                  onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })}
                  className="rounded-xl border-2 focus:border-gray-900 transition-all duration-200"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{t('registering') || 'Registering...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Store className="h-4 w-4" />
                    <span>{t('registerShop') || 'Register Shop'}</span>
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function MerchantRegisterPage() {
  return <MerchantRegisterContent />
}
