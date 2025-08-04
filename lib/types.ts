export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  age?: number
  gender?: string
  city?: string
  interests?: string[]
  role: "user" | "merchant" | "admin"
  isVerified: boolean
  language?: string
  notifications?: {
    email: boolean
    sms: boolean
    push: boolean
    offers: boolean
  }
  createdAt?: Date
  updatedAt?: Date
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  brand: string
  images: string[]
  sizes: string[]
  variants?: string[]
  variantType?: string
  colors: string[]
  stock: number
  rating: number
  reviewCount: number
  shopId: string
  shopName?: string
  isActive: boolean
  createdAt: Date
}

export interface CartItem {
  id: string
  userId: string
  productId: string
  product: Product
  quantity: number
  size?: string
  color?: string
  createdAt: Date
}

export interface WishlistItem {
  id: string
  userId: string
  productId: string
  product: Product
  createdAt: Date
}

export interface Shop {
  id: string
  userId: string
  name: string
  description: string
  address: string
  contactDetails: string
  isVerified: boolean
  createdAt: Date
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  shippingAddress: Address
  paymentMethod: string
  paymentStatus: "pending" | "completed" | "failed"
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  color?: string
  image: string
}

export interface Address {
  id: string
  userId: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "order" | "promotion" | "system" | "reminder"
  isRead: boolean
  createdAt: Date
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  images?: string[]
  createdAt: Date
}

export interface Analytics {
  totalSales: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  salesGrowth: number
  orderGrowth: number
  customerGrowth: number
  productGrowth: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  salesByCategory: Array<{
    category: string
    sales: number
    revenue: number
  }>
  recentOrders: Order[]
}
