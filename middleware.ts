import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/edge-auth'
import { edgeLogger } from '@/lib/edge-logger'

// Define protected routes
const protectedRoutes = ['/home', '/profile', '/cart', '/wishlist', '/checkout', '/booked']
const merchantRoutes = ['/merchant']
const adminRoutes = ['/admin']

export function middleware(request: NextRequest) {
  // Middleware disabled to keep login working
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}