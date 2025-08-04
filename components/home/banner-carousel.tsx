"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const banners = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&h=600&fit=crop&crop=center",
    title: "Women's Fashion",
    subtitle: "Trendy styles for every occasion",
    category: "women",
    gradient: "from-pink-400/70 to-purple-500/70"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop&crop=center",
    title: "Men's Collection",
    subtitle: "Upgrade your wardrobe with style",
    category: "men",
    gradient: "from-green-400/70 to-emerald-600/70"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&h=600&fit=crop&crop=center",
    title: "Kids Fashion",
    subtitle: "Cute & comfortable styles for kids",
    category: "kids",
    gradient: "from-orange-400/70 to-yellow-500/70"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=1200&h=600&fit=crop&crop=center",
    title: "Beauty & Care",
    subtitle: "Premium cosmetics & skincare",
    category: "beauty",
    gradient: "from-rose-400/70 to-pink-600/70"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=600&fit=crop&crop=center",
    title: "Home & Living",
    subtitle: "Transform your space with style",
    category: "home",
    gradient: "from-amber-400/70 to-orange-600/70"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=600&fit=crop&crop=center",
    title: "Footwear",
    subtitle: "Step up your shoe game",
    category: "footwear",
    gradient: "from-slate-600/70 to-gray-800/70"
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=600&fit=crop&crop=center",
    title: "Accessories",
    subtitle: "Complete your look with style",
    category: "accessories",
    gradient: "from-purple-500/70 to-indigo-600/70"
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop&crop=center",
    title: "Sports & Fitness",
    subtitle: "Gear up for your active lifestyle",
    category: "sports",
    gradient: "from-blue-500/70 to-cyan-600/70"
  },
  {
    id: 9,
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=600&fit=crop&crop=center",
    title: "Electronics",
    subtitle: "Latest gadgets & tech accessories",
    category: "electronics",
    gradient: "from-gray-800/70 to-slate-900/70"
  }
]

export default function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleBannerClick = (category: string) => {
    router.push(`/home?category=${category}`)
  }

  return (
    <div
      className="relative w-full h-64 md:h-96 lg:h-[500px] overflow-hidden rounded-lg shadow-lg"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out cursor-pointer ${
            index === currentSlide ? "translate-x-0" : index < currentSlide ? "-translate-x-full" : "translate-x-full"
          }`}
          onClick={() => handleBannerClick(banner.category)}
        >
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />
          <div className="absolute inset-0 flex items-center justify-center text-center text-white">
            <div className="max-w-2xl px-4">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">{banner.title}</h2>
              <p className="text-lg md:text-xl mb-6 drop-shadow-md opacity-90">{banner.subtitle}</p>
              <Button
                size="lg"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                Shop Now
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
