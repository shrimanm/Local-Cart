"use client"
import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, User, Users, Heart, Home, Sparkles, Zap, Package, Dumbbell, Smartphone } from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"

const getCategoriesWithTranslations = (t: any) => [
  { id: "all", name: t('all'), icon: ShoppingBag },
  { id: "men", name: t('men'), icon: User },
  { id: "women", name: t('women'), icon: Users },
  { id: "kids", name: t('kids'), icon: Heart },
  { id: "home", name: t('homeCategory'), icon: Home },
  { id: "beauty", name: t('beauty'), icon: Sparkles },
  { id: "footwear", name: t('footwear'), icon: Zap },
  { id: "accessories", name: t('accessories'), icon: Package },
  { id: "sports", name: t('sports'), icon: Dumbbell },
  { id: "electronics", name: t('electronics'), icon: Smartphone },
]

interface CategoryTabsProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  productCounts?: Record<string, number>
}

export default function CategoryTabs({ selectedCategory, onCategoryChange, productCounts = {} }: CategoryTabsProps) {
  const { t } = useLanguage()
  const categories = getCategoriesWithTranslations(t)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (scrollContainerRef.current && selectedCategory !== 'all') {
      // Add a small delay to ensure the DOM is updated
      setTimeout(() => {
        const selectedButton = scrollContainerRef.current?.querySelector(`[data-category="${selectedCategory}"]`) as HTMLElement
        if (selectedButton) {
          selectedButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }
      }, 100)
    }
  }, [selectedCategory])
  
  return (
    <div className="bg-white border-b sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={scrollContainerRef} className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category.id}
              data-category={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 border-2 ${
                selectedCategory === category.id
                  ? "border-gray-900 text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-md"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <category.icon className="h-4 w-4" />
              <span className="font-medium">{category.name}</span>
              {productCounts[category.id] && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {productCounts[category.id]}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
