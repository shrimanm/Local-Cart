"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Users, Store, Package, ArrowLeft, Calendar, Shield, CheckCircle } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"

interface AdminAnalyticsData {
  platform?: {
    metrics: {
      totalUsers: number
      totalMerchants: number
      totalShops: number
      verifiedShops: number
      totalProducts: number
      activeProducts: number
      totalOrders: number
    }
    userGrowth: any[]
    revenueData: any[]
  }
  merchants?: {
    topMerchants: any[]
    verificationStats: any[]
  }
  products?: {
    categoryPerformance: any[]
    productTrends: any[]
  }
}

const COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]

function AdminAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData>({})
  const [period, setPeriod] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const { user, token } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (!user || !token) {
      router.push("/")
      return
    }

    if (user.role !== "admin") {
      router.push("/home")
      return
    }

    fetchAnalytics()
  }, [user, token, router, period, activeTab])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}&type=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/admin")} 
                className="mr-2 sm:mr-4 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900 mr-2 sm:mr-3" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{t('adminAnalytics')}</h1>
            </div>
            <div className="flex items-center">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-32 rounded-xl border-2 hover:border-gray-400 transition-all duration-200">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="7d">{t('last7Days')}</SelectItem>
                  <SelectItem value="30d">{t('last30Days')}</SelectItem>
                  <SelectItem value="90d">{t('last90Days')}</SelectItem>
                  <SelectItem value="1y">{t('lastYear')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-100 px-6 pt-6">
              <TabsList className="bg-gray-50 rounded-xl p-1 grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="text-[10px] sm:text-sm px-1 sm:px-4 rounded-lg">{t('overview')}</TabsTrigger>
                <TabsTrigger value="platform" className="text-[10px] sm:text-sm px-1 sm:px-4 rounded-lg">{t('growth')}</TabsTrigger>
                <TabsTrigger value="merchants" className="text-[10px] sm:text-sm px-1 sm:px-4 rounded-lg">{t('merchants')}</TabsTrigger>
                <TabsTrigger value="products" className="text-[10px] sm:text-sm px-1 sm:px-4 rounded-lg">{t('products')}</TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="overview" className="p-6 space-y-6">
            {/* Platform Metrics */}
            {analytics.platform && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{t('totalUsers')}</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.platform.metrics.totalUsers}</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{t('totalMerchants')}</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.platform.metrics.totalMerchants}</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                        <Store className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{t('verifiedShops')}</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.platform.metrics.verifiedShops}</p>
                        <p className="text-xs text-gray-500">of {analytics.platform.metrics.totalShops} total</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{t('activeProducts')}</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.platform.metrics.activeProducts}</p>
                        <p className="text-xs text-gray-500">of {analytics.platform.metrics.totalProducts} total</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Revenue */}
                {analytics.platform.revenueData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('platformRevenue')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          revenue: {
                            label: "Revenue",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.platform.revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="totalRevenue"
                              stroke="var(--color-revenue)"
                              fill="var(--color-revenue)"
                              fillOpacity={0.3}
                              name="Revenue"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="platform" className="space-y-4 sm:space-y-6">
            {analytics.platform && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 overflow-x-hidden">
                {/* User Growth */}
                {analytics.platform.userGrowth.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('userGrowth')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6">
                      <div className="w-full overflow-hidden">
                        <ChartContainer
                          config={{
                            users: {
                              label: "New Users",
                              color: "hsl(var(--chart-1))",
                            },
                            merchants: {
                              label: "New Merchants",
                              color: "hsl(var(--chart-2))",
                            },
                          }}
                          className="h-[200px] sm:h-[300px] w-full"
                        >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.platform.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="newUsers"
                              stroke="var(--color-users)"
                              strokeWidth={2}
                              name="New Users"
                            />
                            <Line
                              type="monotone"
                              dataKey="newMerchants"
                              stroke="var(--color-merchants)"
                              strokeWidth={2}
                              name="New Merchants"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Orders Growth */}
                {analytics.platform.revenueData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('ordersGrowth')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          orders: {
                            label: "Orders",
                            color: "hsl(var(--chart-3))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.platform.revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="totalOrders" fill="var(--color-orders)" name="Orders" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="merchants" className="space-y-4 sm:space-y-6">
            {analytics.merchants && (
              <>
                {/* Top Merchants */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('topPerformingMerchants')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
                    <div className="space-y-2 sm:space-y-4">
                      {analytics.merchants.topMerchants.map((merchant, index) => (
                        <div key={merchant.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-medium">{merchant.shopName}</h3>
                              <p className="text-sm text-gray-600">{merchant.totalProducts} {t('products')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatPrice(merchant.totalRevenue)}</p>
                            <p className="text-sm text-gray-600">{merchant.totalOrders} {t('orders')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Stats */}
                {analytics.merchants.verificationStats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('shopVerificationStatus')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6">
                      <div className="w-full overflow-hidden">
                        <ChartContainer
                          config={{
                            count: {
                              label: "Count",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[200px] sm:h-[300px] w-full"
                        >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.merchants.verificationStats}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ _id, percent }) => `${_id} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {analytics.merchants.verificationStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4 sm:space-y-6">
            {analytics.products && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 overflow-x-hidden">
                {/* Category Performance */}
                {analytics.products.categoryPerformance.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('categoryPerformance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          revenue: {
                            label: "Revenue",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.products.categoryPerformance} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="_id" type="category" width={80} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="totalRevenue" fill="var(--color-revenue)" name="Revenue" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Product Trends */}
                {analytics.products.productTrends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('newProductsAdded')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          products: {
                            label: "New Products",
                            color: "hsl(var(--chart-2))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.products.productTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="newProducts"
                              stroke="var(--color-products)"
                              fill="var(--color-products)"
                              fillOpacity={0.3}
                              name="New Products"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function AdminAnalytics() {
  return <AdminAnalyticsContent />
}
