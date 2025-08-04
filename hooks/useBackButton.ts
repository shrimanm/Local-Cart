"use client"

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseBackButtonOptions {
  onBack?: () => void
  fallbackUrl?: string
  preventExit?: boolean
}

export function useBackButton({ 
  onBack, 
  fallbackUrl = '/', 
  preventExit = true 
}: UseBackButtonOptions = {}) {
  const router = useRouter()

  const handleBackButton = useCallback((event: PopStateEvent) => {
    if (preventExit) {
      // Prevent the default back behavior
      event.preventDefault()
      
      // Push current state back to prevent exit
      window.history.pushState(null, '', window.location.href)
      
      // Execute custom back handler or fallback
      if (onBack) {
        onBack()
      } else {
        router.push(fallbackUrl)
      }
    }
  }, [onBack, fallbackUrl, preventExit, router])

  useEffect(() => {
    if (preventExit) {
      // Add a dummy state to history stack
      window.history.pushState(null, '', window.location.href)
      
      // Listen for back button
      window.addEventListener('popstate', handleBackButton)
      
      return () => {
        window.removeEventListener('popstate', handleBackButton)
      }
    }
  }, [handleBackButton, preventExit])

  // Manual back function for UI buttons
  const goBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      router.push(fallbackUrl)
    }
  }, [onBack, fallbackUrl, router])

  return { goBack }
}