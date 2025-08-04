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
} from "recharts"
import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Package, ArrowLeft, Calendar } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useEffect as useRouterEffect } from "react"
import { useRouter as useNextRouter } from "next/router"
import { LanguageProvider } from "@/hooks/useLanguage"

interface AnalyticsData {
  sales?: {
    chartData: any[]
    metrics: {
      totalRevenue: number
      totalOrders: number
      totalItems: number
      avgOrderValue: number
    }
    comparison: {
      revenueGrowth: number
      ordersGrowth: number
    }
  }
  products?: {
    topProducts: any[]
    categoryData: any[]
  }
  customers?: {
    topCustomers: any[]
    acquisitionData: any[]
  }
}

const COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]

function MerchantAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({})
  const [period, setPeriod] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const { user, token } = useAuth()
  const router = useRouter()

  // Add custom loading bar styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      #nprogress .bar {
        background: #000 !important;
        height: 3px !important;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px #000, 0 0 5px #000 !important;
      }
      #nprogress .spinner-icon {
        border-top-color: #000 !important;
        border-left-color: #000 !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (!user || !token) {
      router.push("/")
      return
    }

    if (user.role !== "merchant" && user.role !== "admin") {
      router.push("/merchant/register")
      return
    }

    fetchAnalytics()
  }, [user, token, router, period, activeTab])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/merchant/analytics?period=${period}&type=${activeTab}`, {
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

  const formatGrowth = (growth: number) => {
    const percentage = (growth * 100).toFixed(1)
    const isPositive = growth >= 0
    return (
      <div className={`flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        {percentage}%
      </div>
    )
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/merchant")} 
                className="mr-4 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32 rounded-xl border-2 border-gray-900 hover:border-gray-700 transition-all duration-200">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-100 px-6 pt-6">
              <div className="overflow-x-auto">
                <TabsList className="bg-gray-50 rounded-xl p-1 grid w-full grid-cols-4 min-w-max">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 rounded-lg">Overview</TabsTrigger>
                  <TabsTrigger value="sales" className="text-xs sm:text-sm px-2 sm:px-4 rounded-lg">Sales</TabsTrigger>
                  <TabsTrigger value="products" className="text-xs sm:text-sm px-2 sm:px-4 rounded-lg">Products</TabsTrigger>
                  <TabsTrigger value="customers" className="text-xs sm:text-sm px-2 sm:px-4 rounded-lg">Customers</TabsTrigger>
                </TabsList>
              </div>
            </div>

          <TabsContent value="overview" className="p-6 space-y-6">
            {/* Key Metrics */}
            {analytics.sales && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatPrice(analytics.sales.metrics.totalRevenue)}</p>
                      </div>
                      <IndianRupee className="h-8 w-8 text-gray-900" />
                    </div>
                    <div className="mt-2">{formatGrowth(analytics.sales.comparison.revenueGrowth)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold">{analytics.sales.metrics.totalOrders}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-gray-900" />
                    </div>
                    <div className="mt-2">{formatGrowth(analytics.sales.comparison.ordersGrowth)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Items Sold</p>
                        <p className="text-2xl font-bold">{analytics.sales.metrics.totalItems}</p>
                      </div>
                      <Package className="h-8 w-8 text-gray-900" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                        <p className="text-2xl font-bold">{formatPrice(analytics.sales.metrics.avgOrderValue)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-gray-900" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Revenue Chart */}
            {analytics.sales && analytics.sales.chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
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
                      <LineChart data={analytics.sales.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="totalRevenue"
                          stroke="var(--color-revenue)"
                          strokeWidth={2}
                          name="Revenue"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            {analytics.sales && (
              <>
                {/* Sales Chart */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full overflow-x-auto">
                        <ChartContainer
                          config={{
                            revenue: {
                              label: "Revenue",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[250px] min-w-[300px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.sales.chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="_id" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="totalRevenue"
                                stroke="var(--color-revenue)"
                                strokeWidth={2}
                                name="Revenue"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Orders Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full overflow-x-auto">
                        <ChartContainer
                          config={{
                            orders: {
                              label: "Orders",
                              color: "hsl(var(--chart-2))",
                            },
                          }}
                          className="h-[250px] min-w-[300px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.sales.chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="_id" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="totalOrders" fill="var(--color-orders)" name="Orders" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {analytics.products && (
              <>
                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.products.topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-900">#{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-600">{product.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatPrice(product.totalRevenue)}</p>
                            <p className="text-sm text-gray-600">{product.totalSold} sold</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Category Performance */}
                {analytics.products.categoryData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Performance</CardTitle>
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
                          <PieChart>
                            <Pie
                              data={analytics.products.categoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="totalRevenue"
                            >
                              {analytics.products.categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            {analytics.customers && (
              <>
                {/* Top Customers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.customers.topCustomers.map((customer, index) => (
                        <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-900">#{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-medium">{customer.user.name || "Anonymous"}</h3>
                              <p className="text-sm text-gray-600">{customer.user.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatPrice(customer.totalSpent)}</p>
                            <p className="text-sm text-gray-600">{customer.totalOrders} orders</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Acquisition */}
                {analytics.customers.acquisitionData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Acquisition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          customers: {
                            label: "New Customers",
                            color: "hsl(var(--chart-3))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.customers.acquisitionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="newCustomers" fill="var(--color-customers)" name="New Customers" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function MerchantAnalytics() {
  return <MerchantAnalyticsContent />
}
