"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, Package, TrendingUp, Users, Plus, Edit, Eye, Trash2, ArrowLeft } from "lucide-react"
import RouteGuard from "@/components/auth/route-guard"
import { formatPrice } from "@/lib/utils"
import { Notification, useNotification } from "@/components/ui/notification"
import ConfirmationDialog from "@/components/ui/confirmation-dialog"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"

interface Shop {
  id: string
  name: string
  description: string
  address: string
  town: string
  contactDetails: string
  locationUrl?: string
  isVerified: boolean
  createdAt: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  isActive: boolean
  category: string
}

interface Order {
  id: string
  orderId: string
  totalAmount: number
  status: string
  createdAt: string
}

function MerchantDashboardContent() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; productId: string; productName: string }>({ isOpen: false, productId: '', productName: '' })
  const [deleting, setDeleting] = useState(false)
  const [editingShop, setEditingShop] = useState(false)
  const [shopFormData, setShopFormData] = useState({
    name: '',
    description: '',
    address: '',
    town: '',
    contactDetails: '',
    locationUrl: ''
  })
  const [availableTowns, setAvailableTowns] = useState<string[]>([])
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

    if (user.role !== "merchant" && user.role !== "admin") {
      router.push("/merchant/register")
      return
    }

    fetchDashboardData()
  }, [user, token, router, authLoading])

  // Update stats whenever products or orders change
  useEffect(() => {
    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.isActive).length
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)

    setStats({
      totalProducts,
      activeProducts,
      totalOrders,
      totalRevenue,
    })
  }, [products, orders])

  const handleDeleteClick = (productId: string, productName: string) => {
    setDeleteDialog({ isOpen: true, productId, productName })
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/products/${deleteDialog.productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const deletedProduct = products.find(p => p.id === deleteDialog.productId)
        // Update products list
        setProducts(products.filter(p => p.id !== deleteDialog.productId))
        // Update stats immediately
        setStats(prev => ({
          ...prev,
          totalProducts: prev.totalProducts - 1,
          activeProducts: deletedProduct?.isActive ? prev.activeProducts - 1 : prev.activeProducts
        }))
        showNotification('Product deleted successfully', 'success')
      } else {
        showNotification('Failed to delete product', 'error')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      showNotification('Error deleting product', 'error')
    } finally {
      setDeleting(false)
      setDeleteDialog({ isOpen: false, productId: '', productName: '' })
    }
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch shop details
      const shopResponse = await fetch("/api/merchant/shop", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (shopResponse.ok) {
        const shopData = await shopResponse.json()
        setShop(shopData.shop)
        // Initialize form data
        setShopFormData({
          name: shopData.shop.name || '',
          description: shopData.shop.description || '',
          address: shopData.shop.address || '',
          town: shopData.shop.town || '',
          contactDetails: shopData.shop.contactDetails || '',
          locationUrl: shopData.shop.locationUrl || ''
        })
        
        // Fetch available towns
        const townsResponse = await fetch('/api/admin/towns')
        if (townsResponse.ok) {
          const townsData = await townsResponse.json()
          const townNames = townsData.towns.map((town: any) => town.name)
          setAvailableTowns(townNames)
        }
      }

      // Fetch products
      const productsResponse = await fetch("/api/merchant/products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.products)
      }

      // Fetch orders
      const ordersResponse = await fetch("/api/merchant/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.orders)
      }

      // Stats will be calculated in useEffect when data changes
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShopUpdate = async () => {
    try {
      const response = await fetch('/api/merchant/shop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(shopFormData)
      })

      if (response.ok) {
        const data = await response.json()
        // Update shop state with new data
        if (shop) {
          setShop({
            ...shop,
            ...shopFormData,
            // Keep the fields that don't change
            id: shop.id,
            isVerified: shop.isVerified,
            createdAt: shop.createdAt
          })
        }
        setEditingShop(false)
        showNotification('Shop details updated successfully', 'success')
      } else {
        showNotification('Failed to update shop details', 'error')
      }
    } catch (error) {
      console.error('Error updating shop:', error)
      showNotification('Error updating shop details', 'error')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16">
            <div className="flex items-center mb-4 sm:mb-0">
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 mr-2 sm:mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{t('merchantDashboard')}</h1>
                {shop && <p className="text-xs sm:text-sm text-gray-600 font-medium">{shop.name}</p>}
              </div>
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
                onClick={() => router.push("/merchant/analytics")}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm rounded-xl border-2 hover:border-gray-400 transition-all duration-200"
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t('analytics')}
              </Button>
              <Button 
                onClick={() => router.push("/merchant/products/add")} 
                className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl" 
                size="sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t('addProduct')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Shop Status */}
        {shop && !shop.isVerified && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <p className="text-yellow-800">
                Your shop is pending verification. You can add products, but they won't be visible to customers until
                verification is complete.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-3 sm:mb-0">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('totalProducts')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-3 sm:mb-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('activeProducts')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-3 sm:mb-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('totalOrders')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-3 sm:mb-0">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('totalRevenue')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Tabs defaultValue="products" className="">
            <div className="border-b border-gray-100 px-6 pt-6">
              <TabsList className="bg-gray-50 rounded-xl p-1">
                <TabsTrigger value="products" className="rounded-lg">{t('products')}</TabsTrigger>
                <TabsTrigger value="orders" className="rounded-lg">{t('orders')}</TabsTrigger>
                <TabsTrigger value="shop" className="rounded-lg">{t('shopDetails')}</TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="products" className="p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('yourProducts')}</h3>
              <div>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">{t('noProductsYet')}</h3>
                    <p className="text-gray-500 mb-4">{t('addFirstProduct')}</p>
                    <Button
                      onClick={() => router.push("/merchant/products/add")}
                      className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
                    >
                      {t('addProduct')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm sm:text-base">{product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{product.category}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                            <span className="font-bold text-sm sm:text-base">{formatPrice(product.price)}</span>
                            <span className="text-xs sm:text-sm text-gray-600">{t('stock')}: {product.stock}</span>
                            <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                              {product.isActive ? t('active') : t('inactive')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2 self-end sm:self-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/product/${product.id}`)}
                            title="View Product"
                            className="p-2"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/merchant/products/edit/${product.id}?data=${encodeURIComponent(JSON.stringify(product))}`)}
                            title="Edit Product"
                            className="p-2"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(product.id, product.name)}
                            title="Delete Product"
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('recentOrders')}</h3>
              <div>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600">{t('noOrdersYet')}</h3>
                    <p className="text-gray-500">{t('ordersWillAppear')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(order.totalAmount)}</p>
                          <Badge variant={order.status === "confirmed" ? "default" : "secondary"}>{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shop" className="p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('shopInformation')}</h3>
              <div>
                {shop ? (
                  <div className="space-y-6">
                    {editingShop ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="font-medium text-gray-900">Shop Name</Label>
                          <Input
                            value={shopFormData.name}
                            onChange={(e) => setShopFormData({...shopFormData, name: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-medium text-gray-900">Town</Label>
                          <Select 
                            value={shopFormData.town} 
                            onValueChange={(value) => setShopFormData({...shopFormData, town: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select town" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTowns.map((town) => (
                                <SelectItem key={town} value={town}>
                                  {town}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="font-medium text-gray-900">Contact Details</Label>
                          <Input
                            value={shopFormData.contactDetails}
                            onChange={(e) => setShopFormData({...shopFormData, contactDetails: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="font-medium text-gray-900">Location URL (Optional)</Label>
                          <Input
                            value={shopFormData.locationUrl}
                            onChange={(e) => setShopFormData({...shopFormData, locationUrl: e.target.value})}
                            placeholder="Google Maps link or location URL"
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="font-medium text-gray-900">Description</Label>
                          <Textarea
                            value={shopFormData.description}
                            onChange={(e) => setShopFormData({...shopFormData, description: e.target.value})}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="font-medium text-gray-900">Address</Label>
                          <Textarea
                            value={shopFormData.address}
                            onChange={(e) => setShopFormData({...shopFormData, address: e.target.value})}
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                          <Button onClick={handleShopUpdate} className="bg-gray-900 hover:bg-gray-800">
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditingShop(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="font-medium text-gray-900">Shop Name</Label>
                          <p className="text-gray-600 mt-1">{shop.name}</p>
                        </div>
                        <div>
                          <Label className="font-medium text-gray-900">Town</Label>
                          <p className="text-gray-600 mt-1">{shop.town}</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="font-medium text-gray-900">Description</Label>
                          <p className="text-gray-600 mt-1">{shop.description || "No description provided"}</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="font-medium text-gray-900">Address</Label>
                          <p className="text-gray-600 mt-1">{shop.address}</p>
                        </div>
                        <div>
                          <Label className="font-medium text-gray-900">Contact Details</Label>
                          <p className="text-gray-600 mt-1">{shop.contactDetails}</p>
                        </div>
                        {shop.locationUrl && (
                          <div>
                            <Label className="font-medium text-gray-900">Location</Label>
                            <a 
                              href={shop.locationUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 mt-1 block"
                            >
                              View on Map
                            </a>
                          </div>
                        )}
                        <div>
                          <Label className="font-medium text-gray-900">Member Since</Label>
                          <p className="text-gray-600 mt-1">{new Date(shop.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="font-medium text-gray-900">Verification Status</Label>
                          <div className="mt-1">
                            <Badge variant={shop.isVerified ? "default" : "secondary"}>
                              {shop.isVerified ? "Verified" : "Pending Verification"}
                            </Badge>
                          </div>
                        </div>
                        <div className="md:col-span-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingShop(true)}
                            className="rounded-xl border-2 hover:border-gray-400"
                          >
                            Edit Shop Details
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">{t('noShopInfoAvailable')}</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, productId: '', productName: '' })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
        variant="danger"
      />
    </div>
  )
}

export default function MerchantDashboard() {
  return (
    <RouteGuard requiredRole="merchant">
      <MerchantDashboardContent />
    </RouteGuard>
  )
}
