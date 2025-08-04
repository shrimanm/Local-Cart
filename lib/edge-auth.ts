import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  phone: string
  role: 'user' | 'merchant' | 'admin'
  iat?: number
  exp?: number
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}