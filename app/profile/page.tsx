"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { THEME_CLASSES } from "@/lib/theme-constants"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, LogOut, Heart, Package, Store, Shield, Globe } from "lucide-react"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"
import BottomNav from "@/components/ui/bottom-nav"

function ProfilePageContent() {
  const { user, token, logout, updateUser, loading: authLoading } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    city: "",
  })
  const [availableTowns, setAvailableTowns] = useState<string[]>([])
  const [townsLoading, setTownsLoading] = useState(true)


  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/")
      return
    }

    if (user && token) {
      fetchUserProfile()
      fetchTowns()
      
      // Check for role updates every 30 seconds
      const interval = setInterval(() => {
        checkForRoleUpdate()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user, token, authLoading])

  const fetchUserProfile = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        const userData = data.user
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          age: userData.age?.toString() || "",
          gender: userData.gender || "",
          city: userData.city || "",
        })
        
        // Update user context if role has changed
        if (userData.role !== user?.role) {
          updateUser(userData)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }
  
  const checkForRoleUpdate = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        const userData = data.user
        
        // Update user context if role has changed
        if (userData.role !== user?.role) {
          console.log('Role updated from', user?.role, 'to', userData.role)
          updateUser(userData)
        }
      }
    } catch (error) {
      console.error("Error checking role update:", error)
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
    } finally {
      setTownsLoading(false)
    }
  }



  const handleSave = async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          age: formData.age ? Number.parseInt(formData.age) : null,
          gender: formData.gender,
          city: formData.city,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEditing(false)
        // Update user data in context with the response
        if (data.user) {
          updateUser(data.user)
        }
        // Re-fetch profile data to update UI
        await fetchUserProfile()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900">{t('profile')}</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <User className="h-5 w-5" />
                    {t('personalInformation')}
                  </h2>
                  <Button
                    variant={editing ? "outline" : "default"}
                    onClick={() => (editing ? setEditing(false) : setEditing(true))}
                    className={editing ? "rounded-xl border-2" : "bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-xl"}
                  >
                    {editing ? t('cancel') : t('editProfile')}
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input id="phone" value={user.phone} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500">Phone number cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">{t('age')}</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">{t('gender')}</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      disabled={!editing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t('city')}</Label>
                    {editing ? (
                      <Select
                        value={formData.city}
                        onValueChange={(value) => setFormData({ ...formData, city: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={townsLoading ? "Loading towns..." : "Select your town"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTowns.map((town) => (
                            <SelectItem key={town} value={town}>
                              {town}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="city"
                        value={formData.city}
                        disabled
                        className="bg-gray-50"
                      />
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-gray-900 hover:bg-gray-800 text-white">
                      {loading ? "Saving..." : t('saveChanges')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Language Selection */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mt-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Globe className="h-5 w-5" />
                {t('language')}
              </h3>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value as 'en' | 'kn')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('english')}</SelectItem>
                  <SelectItem value="kn">{t('kannada')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">{t('accountStatus')}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('phoneVerified')}</span>
                  <Badge variant={user.isVerified ? "default" : "secondary"}>
                    {user.isVerified ? t('verified') : t('pending')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('accountType')}</span>
                  <Badge variant="outline">{user.role.toUpperCase()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('memberSince')}</span>
                  <span className="text-sm text-gray-600">
                    {user.createdAt ? new Date(user.createdAt).getFullYear() : "2024"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">{t('quickActions')}</h3>
              </div>
              <div className="p-6 space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/wishlist")}>
                  <Heart className="h-4 w-4 mr-2" />
                  {t('myWishlist')}
                </Button>

                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/booked")}>
                  <Package className="h-4 w-4 mr-2" />
                  {t('myBookings')}
                </Button>

                <Separator className="my-2" />
                {user.role === "admin" && (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-gradient-to-r from-gray-900 to-gray-700 text-white hover:from-gray-800 hover:to-gray-600 font-bold shadow-lg border-2 border-gray-900 text-xs sm:text-sm px-2 py-2 min-h-[40px]"
                      onClick={() => router.push("/admin")}
                    >
                      <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('adminDashboard')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-gradient-to-r from-gray-900 to-gray-700 text-white hover:from-gray-800 hover:to-gray-600 font-bold shadow-lg border-2 border-gray-900 text-xs sm:text-sm px-2 py-2 min-h-[40px]"
                      onClick={() => router.push("/merchant")}
                    >
                      <Store className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('merchantDashboard')}</span>
                    </Button>
                  </>
                )}
                {user.role === "merchant" && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start bg-gradient-to-r from-gray-900 to-gray-700 text-white hover:from-gray-800 hover:to-gray-600 font-bold shadow-lg border-2 border-gray-900 text-xs sm:text-sm px-2 py-2 min-h-[40px]"
                    onClick={() => router.push("/merchant")}
                  >
                    <Store className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('merchantDashboard')}</span>
                  </Button>
                )}
                {user.role === "user" && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start bg-gradient-to-r from-gray-900 to-gray-700 text-white hover:from-gray-800 hover:to-gray-600 font-bold shadow-lg border-2 border-gray-900 text-xs sm:text-sm px-2 py-2 min-h-[40px]"
                    onClick={() => router.push("/merchant/register")}
                  >
                    <Store className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('becomeAMerchant')}</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function ProfilePage() {
  return <ProfilePageContent />
}
