"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: "danger" | "warning" | "info"
}

export default function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText,
  cancelText,
  loading = false,
  variant = "danger"
}: ConfirmationDialogProps) {
  const { t } = useLanguage()
  
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700"
        }
      case "warning":
        return {
          icon: "text-yellow-600",
          button: "bg-yellow-600 hover:bg-yellow-700"
        }
      default:
        return {
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 p-0"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-2">
            <p className="text-gray-700">{message}</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              {cancelText || t('cancel')}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${styles.button}`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                  {t('processing') || 'Processing...'}
                </div>
              ) : (
                confirmText || t('confirm')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}