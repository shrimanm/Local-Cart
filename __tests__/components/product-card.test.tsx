import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '@/components/products/product-card'

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 999,
  originalPrice: 1299,
  images: ['https://example.com/image.jpg'],
  rating: 4.5,
  reviewCount: 10,
  category: 'electronics',
  brand: 'TestBrand',
  stock: 5,
  isActive: true
}

const mockProps = {
  product: mockProduct,
  isWishlisted: false,
  onWishlistToggle: jest.fn(),
  onAddToCart: jest.fn()
}

describe('ProductCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders product information correctly', () => {
    render(<ProductCard {...mockProps} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('₹999')).toBeInTheDocument()
    expect(screen.getByText('₹1,299')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('calls onWishlistToggle when wishlist button is clicked', () => {
    render(<ProductCard {...mockProps} />)
    
    const wishlistButton = screen.getByRole('button', { name: /wishlist/i })
    fireEvent.click(wishlistButton)
    
    expect(mockProps.onWishlistToggle).toHaveBeenCalledWith('1')
  })

  it('shows wishlisted state correctly', () => {
    render(<ProductCard {...mockProps} isWishlisted={true} />)
    
    const wishlistButton = screen.getByRole('button', { name: /wishlist/i })
    expect(wishlistButton).toHaveClass('bg-[#0077B6]')
  })

  it('calls onAddToCart when add to cart button is clicked', () => {
    render(<ProductCard {...mockProps} />)
    
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addToCartButton)
    
    expect(mockProps.onAddToCart).toHaveBeenCalledWith('1')
  })
})