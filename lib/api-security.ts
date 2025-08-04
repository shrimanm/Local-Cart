import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthenticatedUser {
  userId: string
  phone: string
  role: 'user' | 'merchant' | 'admin'
}

export function authenticateRequest(request: NextRequest): AuthenticatedUser {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid')
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedUser
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function requireRole(user: AuthenticatedUser, allowedRoles: string[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
  }
}

export function validateInput(data: any, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} is required`)
    }
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function createSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({ 
    success: true, 
    ...(message && { message }),
    ...data 
  })
}