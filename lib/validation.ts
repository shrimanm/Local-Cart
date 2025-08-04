import { z } from 'zod'

// User validation schemas
export const UserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  age: z.number().min(13, 'Must be at least 13').max(120, 'Invalid age').optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  city: z.string().max(50, 'City name too long').optional(),
  role: z.enum(['user', 'merchant', 'admin']).default('user')
})

// Product validation schemas
export const ProductSchema = z.object({
  name: z.string().min(1, 'Product name required').max(200, 'Name too long'),
  description: z.string().min(10, 'Description too short').max(2000, 'Description too long'),
  price: z.number().positive('Price must be positive').max(1000000, 'Price too high'),
  originalPrice: z.number().positive().optional(),
  category: z.string().min(1, 'Category required'),
  brand: z.string().max(100, 'Brand name too long').optional(),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image required').max(10, 'Too many images'),
  sizes: z.array(z.string()).optional(),
  variants: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  stock: z.number().min(0, 'Stock cannot be negative').max(10000, 'Stock too high'),
  isActive: z.boolean().default(true)
})

// Order validation schemas
export const OrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID required'),
    quantity: z.number().min(1, 'Quantity must be at least 1').max(100, 'Quantity too high'),
    price: z.number().positive('Price must be positive'),
    size: z.string().optional(),
    color: z.string().optional()
  })).min(1, 'At least one item required'),
  shippingAddress: z.object({
    name: z.string().min(1, 'Name required'),
    phone: z.string().regex(/^\d{10}$/, 'Invalid phone'),
    address: z.string().min(10, 'Address too short'),
    city: z.string().min(1, 'City required'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode')
  }),
  totalAmount: z.number().positive('Total amount must be positive')
})

// Auth validation schemas
export const LoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
})

// Shop validation schemas
export const ShopSchema = z.object({
  name: z.string().min(1, 'Shop name required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  address: z.string().min(10, 'Address too short').max(200, 'Address too long'),
  category: z.string().min(1, 'Category required'),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GST number').optional()
})

// Review validation schemas
export const ReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(500, 'Comment too long').optional()
})

// Validation helper function
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Validation failed' }
  }
}