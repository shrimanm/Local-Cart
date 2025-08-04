"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, X, Check } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/hooks/useLanguage"

interface BookingDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  product: {
    name: string
    price: number
    images: string[]
    brand: string
  }
  loading?: boolean
}

export default function BookingDialog({ isOpen, onClose, onConfirm, product, loading = false }: BookingDialogProps) {
  const { t } = useLanguage()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            {t('confirmBooking')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Preview */}
          <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="relative w-16 h-20 bg-white rounded overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center p-1">
                <Image
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{product.brand}</p>
              <p className="font-bold text-lg mt-1">₹{product.price}</p>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="text-center py-2">
            <p className="text-gray-700 mb-2">{t('bookingConfirmMessage')}</p>
            <p className="text-sm text-gray-500">{t('cancelAnytime')}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white" />
                  {t('booking')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {t('confirmBookingButton')}
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}