import * as jwt from 'jsonwebtoken'
import { AuthenticationError, AuthorizationError } from './errors'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  phone: string
  role: 'user' | 'merchant' | 'admin'
  iat?: number
  exp?: number
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!JWT_SECRET) {
    throw new AuthenticationError('JWT secret not configured')
  }
  
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
  } catch (error) {
    throw new AuthenticationError('Failed to generate authentication token')
  }
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token')
  }
}



export function extractTokenFromHeader(authHeader: string | null): string {
  if (!authHeader) {
    throw new AuthenticationError('Authorization header missing')
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Invalid authorization header format')
  }

  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    throw new AuthenticationError('Token missing from authorization header')
  }

  return token
}

export function requireRole(userRole: string, requiredRoles: string[]): void {
  if (!requiredRoles.includes(userRole)) {
    throw new AuthorizationError(`Access denied. Required roles: ${requiredRoles.join(', ')}`)
  }
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}