"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { Button } from './button'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  show: boolean
  onClose: () => void
  duration?: number
}

export function Notification({ message, type, show, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-600" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-[9999] max-w-sm border rounded-lg p-4 shadow-lg transform transition-all duration-300 ease-out animate-in slide-in-from-right-full ${getStyles()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getIcon()}
          <p className="ml-2 text-sm font-medium">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-2 h-6 w-6 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({
    message: '',
    type: 'info',
    show: false
  })

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type, show: true })
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }))
  }

  return {
    notification,
    showNotification,
    hideNotification
  }
}