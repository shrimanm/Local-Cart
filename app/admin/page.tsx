"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Users, Store, Package, TrendingUp, Search, CheckCircle, XCircle, Trash2, ArrowLeft } from "lucide-react"
import { Notification, useNotification } from "@/components/ui/notification"
import ConfirmationDialog from "@/components/ui/confirmation-dialog"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"

interface User {
  id: string
  phone: string
  name: string
  email: string
  role: string
  isVerified: boolean
  createdAt: string
}

interface Shop {
  id: string
  name: string
  description: string
  address: string
  town: string
  contactDetails: string
  locationUrl?: string
  isVerified: boolean
  ownerName: string
  createdAt: string
}

interface Town {
  _id: string
  name: string
  createdAt: string
}

function AdminPanelContent() {
  const [users, setUsers] = useState<User[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [towns, setTowns] = useState<Town[]>([])
  const [newTownName, setNewTownName] = useState("")
  const [addingTown, setAddingTown] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMerchants: 0,
    totalShops: 0,
    verifiedShops: 0,
    totalProducts: 0,
    totalOrders: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterShopStatus, setFilterShopStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ isOpen: boolean; userId: string; userName: string }>({ isOpen: false, userId: '', userName: '' })
  const [deleteShopDialog, setDeleteShopDialog] = useState<{ isOpen: boolean; shopId: string; shopName: string }>({ isOpen: false, shopId: '', shopName: '' })
  const [deleteTownDialog, setDeleteTownDialog] = useState<{ isOpen: boolean; townId: string; townName: string }>({ isOpen: false, townId: '', townName: '' })
  const [deleting, setDeleting] = useState(false)
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const { notification, showNotification, hideNotification } = useNotification()
  const { t } = useLanguage()

  useEffect(() => {
    if (authLoading) return
    
    if (!user || !token) {
      router.push("/")
      return
    }

    if (user.role !== "admin") {
      router.push("/home")
      return
    }

    fetchAdminData()
  }, [user, token, router, authLoading])

  const fetchAdminData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }

      // Fetch shops
      const shopsResponse = await fetch("/api/admin/shops", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (shopsResponse.ok) {
        const shopsData = await shopsResponse.json()
        setShops(shopsData.shops)
      }

      // Fetch stats
      const statsResponse = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Fetch towns
      const townsResponse = await fetch("/api/admin/towns", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (townsResponse.ok) {
        const townsData = await townsResponse.json()
        setTowns(townsData.towns)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/admin/users/role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
        showNotification("User role updated successfully", "success")
      }
    } catch (error) {
      showNotification("Failed to update user role", "error")
    }
  }

  const handleDeleteUserClick = (userId: string, userName: string) => {
    setDeleteUserDialog({ isOpen: true, userId, userName })
  }

  const confirmDeleteUser = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/users?userId=${deleteUserDialog.userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const deletedUser = users.find(u => u.id === deleteUserDialog.userId)
        setUsers(users.filter((u) => u.id !== deleteUserDialog.userId))
        setStats(prev => ({
          ...prev,
          totalUsers: prev.totalUsers - 1,
          totalMerchants: deletedUser?.role === 'merchant' ? prev.totalMerchants - 1 : prev.totalMerchants
        }))
        showNotification("User deleted successfully", "success")
      } else {
        showNotification("Failed to delete user", "error")
      }
    } catch (error) {
      showNotification("Failed to delete user", "error")
    } finally {
      setDeleting(false)
      setDeleteUserDialog({ isOpen: false, userId: '', userName: '' })
    }
  }

  const verifyShop = async (shopId: string, isVerified: boolean) => {
    try {
      const response = await fetch("/api/admin/shops/verify", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shopId, isVerified }),
      })

      if (response.ok) {
        setShops(shops.map((s) => (s.id === shopId ? { ...s, isVerified } : s)))
        showNotification(`Shop ${isVerified ? "verified" : "unverified"} successfully`, isVerified ? "success" : "info")
      }
    } catch (error) {
      showNotification("Failed to update shop verification", "error")
    }
  }

  const handleDeleteShopClick = (shopId: string, shopName: string) => {
    setDeleteShopDialog({ isOpen: true, shopId, shopName })
  }

  const confirmDeleteShop = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/shops?shopId=${deleteShopDialog.shopId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const deletedShop = shops.find(s => s.id === deleteShopDialog.shopId)
        setShops(shops.filter((s) => s.id !== deleteShopDialog.shopId))
        setStats(prev => ({
          ...prev,
          totalShops: prev.totalShops - 1,
          verifiedShops: deletedShop?.isVerified ? prev.verifiedShops - 1 : prev.verifiedShops
        }))
        showNotification("Shop deleted successfully", "success")
      } else {
        showNotification("Failed to delete shop", "error")
      }
    } catch (error) {
      showNotification("Failed to delete shop", "error")
    } finally {
      setDeleting(false)
      setDeleteShopDialog({ isOpen: false, shopId: '', shopName: '' })
    }
  }

  const addTown = async () => {
    if (!newTownName.trim()) return
    
    setAddingTown(true)
    try {
      const response = await fetch("/api/admin/towns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTownName.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setTowns([...towns, { _id: data.townId, name: newTownName.trim(), createdAt: new Date().toISOString() }])
        setNewTownName("")
        showNotification("Town added successfully", "success")
      } else {
        const data = await response.json()
        showNotification(data.error || "Failed to add town", "error")
      }
    } catch (error) {
      showNotification("Failed to add town", "error")
    } finally {
      setAddingTown(false)
    }
  }

  const handleDeleteTownClick = (townId: string, townName: string) => {
    setDeleteTownDialog({ isOpen: true, townId, townName })
  }

  const confirmDeleteTown = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/towns?townId=${deleteTownDialog.townId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setTowns(towns.filter((t) => t._id !== deleteTownDialog.townId))
        showNotification("Town deleted successfully", "success")
      } else {
        showNotification("Failed to delete town", "error")
      }
    } catch (error) {
      showNotification("Failed to delete town", "error")
    } finally {
      setDeleting(false)
      setDeleteTownDialog({ isOpen: false, townId: '', townName: '' })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const filteredShops = shops.filter((shop) => {
    if (filterShopStatus === "all") return true
    if (filterShopStatus === "verified") return shop.isVerified
    if (filterShopStatus === "unverified") return !shop.isVerified
    return true
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={hideNotification}
      />
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center mb-3">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 mr-2 sm:mr-3" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{t('adminPanel')}</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push("/home")} 
                variant="outline" 
                size="sm" 
                className="text-xs sm:text-sm rounded-xl border-2 hover:border-gray-400 transition-all duration-200"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t('backToHome')}
              </Button>
              <Button
                onClick={() => router.push("/admin/analytics")}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm rounded-xl border-2 hover:border-gray-400 transition-all duration-200"
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t('analytics')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="sm:ml-3">
                <p className="text-xs text-gray-600">{t('totalUsers')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-3 sm:p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="sm:ml-3">
                <p className="text-xs text-gray-600">{t('merchants')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.totalMerchants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="sm:ml-3">
                <p className="text-xs text-gray-600">{t('totalShops')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.totalShops}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-3 sm:p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="sm:ml-3">
                <p className="text-xs text-gray-600">{t('verifiedShops')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.verifiedShops}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="sm:ml-3">
                <p className="text-xs text-gray-600">{t('products')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-3 sm:p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </div>
              <div className="sm:ml-3">
                <p className="text-xs text-gray-600">{t('orders')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Tabs defaultValue="users">
            <div className="border-b border-gray-100 pt-6">
              <TabsList className="bg-gray-50 rounded-xl p-1 grid w-full grid-cols-4">
                <TabsTrigger value="users" className="text-xs sm:text-sm rounded-lg px-2 sm:px-4">{t('users')}</TabsTrigger>
                <TabsTrigger value="shops" className="text-xs sm:text-sm rounded-lg px-2 sm:px-4">{t('shops')}</TabsTrigger>
                <TabsTrigger value="towns" className="text-xs sm:text-sm rounded-lg px-2 sm:px-4">{t('towns')}</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm rounded-lg px-2 sm:px-4">{t('analytics')}</TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="users" className="p-2 sm:p-4">
            <div>
              <CardHeader>
                <CardTitle>{t('userManagement')}</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t('searchUsers')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allRoles')}</SelectItem>
                      <SelectItem value="user">{t('user')}</SelectItem>
                      <SelectItem value="merchant">{t('merchant')}</SelectItem>
                      <SelectItem value="admin">{t('admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border rounded-lg space-y-4 sm:space-y-0 bg-white shadow-sm">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm sm:text-base">{user.name || "Unnamed User"}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{user.phone}</p>
                        {user.email && <p className="text-xs sm:text-sm text-gray-600">{user.email}</p>}
                        <p className="text-xs text-gray-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Badge variant={user.isVerified ? "default" : "secondary"} className="text-sm w-fit">
                          {user.isVerified ? t('verified') : t('unverified')}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value)}>
                            <SelectTrigger className="w-32 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="merchant">Merchant</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUserClick(user.id, user.name || 'Unnamed User')}
                            className="px-3 py-2"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t('delete')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </TabsContent>

          <TabsContent value="shops" className="p-2 sm:p-4">
            <div>
              <CardHeader>
                <CardTitle>{t('shopManagement')}</CardTitle>
                <div className="flex justify-end">
                  <Select value={filterShopStatus} onValueChange={setFilterShopStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allShops')}</SelectItem>
                      <SelectItem value="verified">{t('verified')}</SelectItem>
                      <SelectItem value="unverified">{t('unverified')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredShops.map((shop) => (
                    <div key={shop.id} className="border rounded-lg p-4 sm:p-6 space-y-4 bg-white shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{shop.name}</h3>
                          <div className="space-y-1">
                            <p className="text-sm"><span className="font-medium text-gray-700">Owner:</span> {shop.ownerName}</p>
                            <p className="text-sm"><span className="font-medium text-gray-700">Town:</span> {shop.town}</p>
                            <p className="text-sm"><span className="font-medium text-gray-700">Contact:</span> {shop.contactDetails}</p>
                            <p className="text-sm"><span className="font-medium text-gray-700">Created:</span> {new Date(shop.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-gray-700 text-sm">Description:</span>
                              <p className="text-sm text-gray-600 mt-1">{shop.description || 'No description provided'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 text-sm">Address:</span>
                              <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                            </div>
                            {shop.locationUrl && (
                              <div>
                                <span className="font-medium text-gray-700 text-sm">Location:</span>
                                <a 
                                  href={shop.locationUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                                >
                                  View on Map
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t space-y-3 sm:space-y-0">
                        <Badge variant={shop.isVerified ? "default" : "secondary"} className="text-sm w-fit">
                          {shop.isVerified ? "✓ Verified" : "⏳ Pending Verification"}
                        </Badge>
                        <div className="flex flex-wrap gap-3">
                          {!shop.isVerified && (
                            <Button
                              size="sm"
                              onClick={() => verifyShop(shop.id, true)}
                              className="bg-green-600 hover:bg-green-700 text-sm px-4 py-2"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t('verifyShop')}
                            </Button>
                          )}
                          {shop.isVerified && (
                            <Button size="sm" variant="destructive" onClick={() => verifyShop(shop.id, false)} className="text-sm px-4 py-2">
                              <XCircle className="h-4 w-4 mr-2" />
                              {t('unverify')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteShopClick(shop.id, shop.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </TabsContent>

          <TabsContent value="towns" className="p-2 sm:p-4">
            <div>
              <CardHeader>
                <CardTitle>{t('townManagement')}</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('enterTownName')}
                    value={newTownName}
                    onChange={(e) => setNewTownName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTown()}
                    className="flex-1"
                  />
                  <Button
                    onClick={addTown}
                    disabled={addingTown || !newTownName.trim()}
                    className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
                  >
                    {addingTown ? t('adding') : t('addTown')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {towns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No towns added yet. Add the first town above.
                    </div>
                  ) : (
                    towns.map((town) => (
                      <div key={town._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border rounded-lg bg-white shadow-sm space-y-3 sm:space-y-0">
                        <div>
                          <h3 className="font-medium">{town.name}</h3>
                          <p className="text-sm text-gray-500">
                            Added: {new Date(town.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTownClick(town._id, town.name)}
                          className="px-4 py-2 w-fit"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete')}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="p-2 sm:p-4">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{t('userGrowth')}</h3>
                </div>
                <div>
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t('analyticsComingSoon')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{t('revenueAnalytics')}</h3>
                </div>
                <div>
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Revenue charts coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>
      
      {/* Delete User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteUserDialog.isOpen}
        onClose={() => setDeleteUserDialog({ isOpen: false, userId: '', userName: '' })}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteUserDialog.userName}"? This will permanently delete all their data including orders, wishlist, and bookings.`}
        confirmText="Delete User"
        loading={deleting}
        variant="danger"
      />
      
      {/* Delete Shop Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteShopDialog.isOpen}
        onClose={() => setDeleteShopDialog({ isOpen: false, shopId: '', shopName: '' })}
        onConfirm={confirmDeleteShop}
        title="Delete Shop"
        message={`Are you sure you want to delete "${deleteShopDialog.shopName}"? This will permanently delete the shop and all its products.`}
        confirmText="Delete Shop"
        loading={deleting}
        variant="danger"
      />
      
      {/* Delete Town Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteTownDialog.isOpen}
        onClose={() => setDeleteTownDialog({ isOpen: false, townId: '', townName: '' })}
        onConfirm={confirmDeleteTown}
        title="Delete Town"
        message={`Are you sure you want to delete "${deleteTownDialog.townName}"? This action cannot be undone.`}
        confirmText="Delete Town"
        loading={deleting}
        variant="danger"
      />
    </div>
  )
}

export default function AdminPanel() {
  return <AdminPanelContent />
}
