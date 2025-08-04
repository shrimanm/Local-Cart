"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'merchant' | 'admin'
  redirectTo?: string
}

export default function RouteGuard({ children, requiredRole, redirectTo = '/' }: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not logged in
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Check role requirements
      if (requiredRole) {
        if (requiredRole === 'admin' && user.role !== 'admin') {
          router.push('/home')
          return
        }
        
        if (requiredRole === 'merchant' && user.role !== 'merchant' && user.role !== 'admin') {
          router.push('/home')
          return
        }
      }
    }
  }, [user, loading, router, requiredRole, redirectTo])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00B4D8]"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || (requiredRole && !hasRequiredRole(user.role, requiredRole))) {
    return null
  }

  return <>{children}</>
}

function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  if (requiredRole === 'admin') {
    return userRole === 'admin'
  }
  
  if (requiredRole === 'merchant') {
    return userRole === 'merchant' || userRole === 'admin'
  }
  
  return true
}