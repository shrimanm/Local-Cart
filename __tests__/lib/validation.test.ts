import { validateData, UserSchema, ProductSchema, LoginSchema } from '@/lib/validation'

describe('Validation', () => {
  describe('UserSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        age: 25,
        gender: 'male' as const,
        city: 'Mumbai',
        role: 'user' as const
      }

      const result = validateData(UserSchema, validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John Doe')
        expect(result.data.phone).toBe('9876543210')
      }
    })

    it('should reject invalid phone number', () => {
      const invalidUser = {
        name: 'John Doe',
        phone: '123', // Invalid phone
      }

      const result = validateData(UserSchema, invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Phone must be 10 digits')
      }
    })
  })

  describe('ProductSchema', () => {
    it('should validate correct product data', () => {
      const validProduct = {
        name: 'Test Product',
        description: 'This is a test product description',
        price: 999,
        category: 'electronics',
        images: ['https://example.com/image1.jpg'],
        stock: 10
      }

      const result = validateData(ProductSchema, validProduct)
      expect(result.success).toBe(true)
    })

    it('should reject product without images', () => {
      const invalidProduct = {
        name: 'Test Product',
        description: 'This is a test product description',
        price: 999,
        category: 'electronics',
        images: [], // No images
        stock: 10
      }

      const result = validateData(ProductSchema, invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('At least one image required')
      }
    })
  })
})