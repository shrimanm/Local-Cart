"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import ImageUpload from "@/components/ui/image-upload"
import { ArrowLeft, Package, Tag, Palette, Ruler } from "lucide-react"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"

const categories = [
  "Men's Clothing",
  "Women's Clothing",
  "Kids Clothing",
  "Footwear",
  "Accessories",
  "Beauty & Personal Care",
  "Home & Living",
  "Sports & Fitness",
  "Electronics",
  "Books & Media",
]

const subcategories = {
  "Men's Clothing": ["T-Shirts", "Shirts", "Jeans", "Trousers", "Suits", "Ethnic Wear", "Innerwear"],
  "Women's Clothing": ["Tops", "Dresses", "Jeans", "Sarees", "Kurtas", "Ethnic Wear", "Innerwear"],
  "Kids Clothing": ["Boys Clothing", "Girls Clothing", "Baby Clothing", "School Uniforms"],
  Footwear: ["Casual Shoes", "Formal Shoes", "Sports Shoes", "Sandals", "Boots"],
  Accessories: ["Bags", "Watches", "Jewelry", "Sunglasses", "Belts"],
  "Beauty & Personal Care": ["Skincare", "Makeup", "Hair Care", "Fragrances", "Personal Care"],
  "Home & Living": ["Bedding", "Bath", "Kitchen", "Decor", "Furniture"],
  "Sports & Fitness": ["Sportswear", "Equipment", "Supplements", "Outdoor Gear"],
  Electronics: ["Mobile Accessories", "Gadgets", "Audio", "Gaming"],
  "Books & Media": ["Books", "Music", "Movies", "Games"],
}

const commonSizes = {
  "Men's Clothing": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  "Women's Clothing": ["XS", "S", "M", "L", "XL", "XXL"],
  "Kids Clothing": ["0-3M", "3-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "5-6Y"],
  Footwear: ["6", "7", "8", "9", "10", "11", "12"],
  default: ["One Size", "S", "M", "L", "XL"],
}

const commonColors = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Grey",
  "Navy",
  "Maroon",
  "Beige",
  "Cream",
]

function AddProductPageContent() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    subcategory: "",
    brand: "",
    images: [] as string[],
    variants: [] as { type: string; values: string[]; colors?: string[] }[],
    stock: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedVariantType, setSelectedVariantType] = useState("")
  const [customVariantValue, setCustomVariantValue] = useState("")
  const [selectedVariantColors, setSelectedVariantColors] = useState<string[]>([])

  const { user, token } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (!user) {
      return // Let auth provider handle authentication
    }
    if (user.role !== "merchant" && user.role !== "admin") {
      router.push("/merchant/register")
    }
  }, [user, router])

  const addVariant = () => {
    if (!selectedVariantType) return
    
    const newVariant = {
      type: selectedVariantType,
      values: [],
      colors: selectedVariantColors.length > 0 ? [...selectedVariantColors] : undefined
    }
    
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }))
    
    setSelectedVariantType("")
    setSelectedVariantColors([])
  }
  
  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }
  
  const addVariantValue = (variantIndex: number, value: string) => {
    if (!value) return
    
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? { ...variant, values: [...variant.values, value] }
          : variant
      )
    }))
  }
  
  const removeVariantValue = (variantIndex: number, valueIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? { ...variant, values: variant.values.filter((_, vi) => vi !== valueIndex) }
          : variant
      )
    }))
  }

  const getVariantOptions = (type: string): string[] => {
    switch (type) {
      case "size":
        return ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40", "42"]
      case "storage":
        return ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]
      case "color":
        return ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Gray", "Brown"]
      case "RAM":
        return ["4GB", "8GB", "16GB", "32GB", "64GB"]
      case "material":
        return ["Cotton", "Polyester", "Leather", "Metal", "Plastic", "Wood", "Glass"]
      case "weight":
        return ["100g", "250g", "500g", "1kg", "2kg", "5kg"]
      case "quantity":
        return ["1 piece", "2 pieces", "5 pieces", "10 pieces", "Pack of 12"]
      case "flavour":
        return ["Vanilla", "Chocolate", "Strawberry", "Mango", "Orange", "Mint"]
      case "dimensions":
        return ["Small", "Medium", "Large", "10x10cm", "20x20cm", "30x30cm"]
      case "model":
        return ["Basic", "Standard", "Premium", "Pro", "Elite"]
      case "wattage":
        return ["5W", "10W", "25W", "40W", "60W", "100W"]
      default:
        return []
    }
  }
  
  const variantTypes = [
    "size", "storage", "color", "RAM", "material", "weight", 
    "quantity", "flavour", "dimensions", "model", "wattage"
  ]

  const handleVariantColorToggle = (color: string) => {
    setSelectedVariantColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.category || formData.images.length === 0) {
      setError("Please fill in all required fields and add at least one image")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/merchant/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
          originalPrice: formData.originalPrice ? Number.parseFloat(formData.originalPrice) : null,
          stock: Number.parseInt(formData.stock) || 0,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/merchant")
      } else {
        setError(data.error || "Failed to add product")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const availableSizes = commonSizes[formData.category as keyof typeof commonSizes] || commonSizes.default

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-[100] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToDashboard')}
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">{t('addNewProduct')}</h1>
          <p className="text-gray-600 mt-2">{t('createProductListing')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('basicInformation')}
              </CardTitle>
              <CardDescription>{t('enterBasicDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('productName')} *</Label>
                  <Input
                    id="name"
                    placeholder={t('enterProductName')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">{t('brand')}</Label>
                  <Input
                    id="brand"
                    placeholder={t('enterBrandName')}
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description')} *</Label>
                <Textarea
                  id="description"
                  placeholder={t('describeProduct')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">{t('sellingPrice')} *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">{t('originalPrice')}</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    placeholder="0.00"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">{t('stockQuantity')}</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {t('categoryClassification')}
              </CardTitle>
              <CardDescription>{t('chooseCategory')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')} *</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCategory')} />
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

                {formData.category && (
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">{t('subcategory')}</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, subcategory: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectSubcategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories[formData.category as keyof typeof subcategories]?.map((subcategory) => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardHeader>
              <CardTitle>{t('productImages')} *</CardTitle>
              <CardDescription>{t('uploadImages')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.images}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                maxFiles={5}
              />
            </CardContent>
          </Card>

          {/* Variants */}
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Product Variants
              </CardTitle>
              <CardDescription>Add multiple variant types with optional colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Variant */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Add New Variant Type</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Variant Type</Label>
                    <Select value={selectedVariantType} onValueChange={setSelectedVariantType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select variant type" />
                      </SelectTrigger>
                      <SelectContent>
                        {variantTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  

                  
                  <Button type="button" onClick={addVariant} disabled={!selectedVariantType}>
                    Add Variant Type
                  </Button>
                </div>
              </div>
              
              {/* Existing Variants */}
              {formData.variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium capitalize">{variant.type}</h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeVariant(variantIndex)}
                      className="text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {variant.colors && variant.colors.length > 0 && (
                    <div className="mb-3">
                      <Label className="text-sm text-gray-600">Colors:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {variant.colors.map(color => (
                          <Badge key={color} variant="secondary" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {getVariantOptions(variant.type).map(option => (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={variant.values.includes(option) ? "default" : "outline"}
                          onClick={() => {
                            if (variant.values.includes(option)) {
                              const valueIndex = variant.values.indexOf(option)
                              removeVariantValue(variantIndex, valueIndex)
                            } else {
                              addVariantValue(variantIndex, option)
                            }
                          }}
                          className="text-xs"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Add custom ${variant.type}`}
                        value={customVariantValue}
                        onChange={(e) => setCustomVariantValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addVariantValue(variantIndex, customVariantValue)
                            setCustomVariantValue("")
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          addVariantValue(variantIndex, customVariantValue)
                          setCustomVariantValue("")
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {variant.values.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {variant.values.map((value, valueIndex) => (
                          <Badge key={valueIndex} variant="secondary" className="px-3 py-1">
                            {value}
                            <button
                              type="button"
                              onClick={() => removeVariantValue(variantIndex, valueIndex)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl border-2 hover:border-gray-400">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg">
              {loading ? t('addingProduct') : t('addProduct')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AddProductPage() {
  return <AddProductPageContent />
}
