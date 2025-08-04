"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import ImageUpload from "@/components/ui/image-upload"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"


interface Product {
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
  isActive: boolean
}

function EditProductPageContent() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  const { user, token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { t } = useLanguage()

  useEffect(() => {
    if (!user || !token) {
      return // Don't redirect immediately, let auth provider handle it
    }

    if (user.role !== "merchant" && user.role !== "admin") {
      router.push("/merchant/register")
      return
    }

    // Get product data from URL parameters or fetch from API
    const urlParams = new URLSearchParams(window.location.search)
    const productData = urlParams.get('data')
    
    if (productData) {
      try {
        const parsedProduct = JSON.parse(decodeURIComponent(productData))
        setProduct({
          id: parsedProduct.id,
          name: parsedProduct.name,
          description: parsedProduct.description || "",
          price: parsedProduct.price,
          originalPrice: parsedProduct.originalPrice,
          category: parsedProduct.category,
          brand: parsedProduct.brand || "",
          images: parsedProduct.images || [],
          sizes: parsedProduct.sizes || [],
          variants: parsedProduct.variants || [],
          variantType: parsedProduct.variantType || "size",
          colors: parsedProduct.colors || [],
          stock: parsedProduct.stock,
          isActive: parsedProduct.isActive
        })
        setLoading(false)
      } catch (error) {
        console.error("Error parsing product data:", error)
        fetchProductFromAPI()
      }
    } else {
      // Fallback: fetch product data from API
      fetchProductFromAPI()
    }
    
    // Fetch categories
    fetchCategories()
  }, [user, token, router, productId])

  const fetchProductFromAPI = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.product) {
        setProduct({
          id: data.product.id,
          name: data.product.name,
          description: data.product.description || "",
          price: data.product.price,
          originalPrice: data.product.originalPrice,
          category: data.product.category,
          brand: data.product.brand || "",
          images: data.product.images || [],
          sizes: data.product.sizes || [],
          variants: data.product.variants || [],
          variantType: data.product.variantType || "size",
          colors: data.product.colors || [],
          stock: data.product.stock,
          isActive: data.product.isActive
        })
      } else {
        router.push("/merchant")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      router.push("/merchant")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/filters')
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback categories
      setCategories(['Men', 'Women', 'Kids', 'Home', 'Beauty', 'Footwear', 'Accessories', 'Sports', 'Electronics'])
    }
  }

  const handleSave = async () => {
    if (!product) return

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        console.log("Product updated successfully!")
        router.push("/merchant")
      } else {
        console.log("Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (urls: string[]) => {
    if (product) {
      setProduct({ ...product, images: [...product.images, ...urls] })
    }
  }

  const removeImage = (index: number) => {
    if (product) {
      const newImages = product.images.filter((_, i) => i !== index)
      setProduct({ ...product, images: newImages })
    }
  }

  const addVariant = (variant: string) => {
    if (product && variant && !(product.variants || []).includes(variant)) {
      setProduct({ ...product, variants: [...(product.variants || []), variant] })
    }
  }

  const removeVariant = (variant: string) => {
    if (product) {
      setProduct({ ...product, variants: (product.variants || []).filter(v => v !== variant) })
    }
  }

  const getVariantOptions = (type: string): string[] => {
    switch (type) {
      case "size":
        return ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40", "42"]
      case "storage":
        return ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]
      case "color":
        return ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Gray", "Brown"]
      case "capacity":
        return ["500ml", "750ml", "1L", "1.5L", "2L", "100g", "250g", "500g", "1kg"]
      default:
        return []
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t('productNotFound')}</h2>
          <Button onClick={() => router.push("/merchant")} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl">{t('backToDashboard')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/merchant")} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">{t('editProduct')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Details */}
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardHeader>
              <CardTitle>{t('productInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('productName')}</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">{t('price')} (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">{t('originalPrice')} (₹)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={product.originalPrice || ""}
                    onChange={(e) => setProduct({ ...product, originalPrice: Number(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select value={product.category} onValueChange={(value) => setProduct({ ...product, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="brand">{t('brand')}</Label>
                  <Input
                    id="brand"
                    value={product.brand}
                    onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stock">{t('stockQuantity')}</Label>
                <Input
                  id="stock"
                  type="number"
                  value={product.stock}
                  onChange={(e) => setProduct({ ...product, stock: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={product.isActive}
                  onChange={(e) => setProduct({ ...product, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">{t('productIsActive')}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Images and Variants */}
          <div className="space-y-6">
            {/* Images */}
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader>
                <CardTitle>{t('productImages')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload 
                  value={product.images} 
                  onChange={(urls) => setProduct({ ...product, images: urls })} 
                />
                
                {product.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variants */}
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader>
                <CardTitle>{t('productVariants')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>{t('variantType')}</Label>
                    <Select value={product.variantType || "size"} onValueChange={(value) => setProduct({ ...product, variantType: value, variants: [] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="size">{t('size')}</SelectItem>
                        <SelectItem value="storage">{t('storage')}</SelectItem>
                        <SelectItem value="color">{t('color')}</SelectItem>
                        <SelectItem value="capacity">{t('capacity')}</SelectItem>
                        <SelectItem value="none">{t('noVariants')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {product.variantType && product.variantType !== "none" && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(product.variants || []).map((variant) => (
                          <Badge key={variant} variant="secondary" className="cursor-pointer" onClick={() => removeVariant(variant)}>
                            {variant} ×
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {getVariantOptions(product.variantType).map((option) => (
                          <Button
                            key={option}
                            variant="outline"
                            size="sm"
                            onClick={() => addVariant(option)}
                            disabled={(product.variants || []).includes(option)}
                            className="text-xs"
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button type="button" variant="outline" onClick={() => router.push("/merchant")} className="rounded-xl border-2 hover:border-gray-400">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </main>
      

    </div>
  )
}

export default function EditProductPage() {
  return <EditProductPageContent />
}