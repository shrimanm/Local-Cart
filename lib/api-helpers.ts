import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './auth'
import { handleError } from './errors'

export function withAuth(handler: (request: NextRequest, context: any, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    try {
      const authHeader = request.headers.get('authorization')
      const token = extractTokenFromHeader(authHeader)
      const user = verifyToken(token)
      
      return await handler(request, context, user)
    } catch (error) {
      const { message, statusCode } = handleError(error)
      return NextResponse.json({ error: message }, { status: statusCode })
    }
  }
}

export function withValidation<T>(schema: any, handler: (request: NextRequest, context: any, data: T) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    try {
      const body = await request.json()
      const validation = schema.safeParse(body)
      
      if (!validation.success) {
        const errorMessage = validation.error.errors.map((err: { path: (string | number)[]; message: string }) => `${err.path.join('.')}: ${err.message}`).join(', ')
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
      
      return await handler(request, context, validation.data)
    } catch (error) {
      const { message, statusCode } = handleError(error)
      return NextResponse.json({ error: message }, { status: statusCode })
    }
  }
}