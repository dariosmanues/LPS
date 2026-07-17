import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0, // Expire immediately
  }

  response.cookies.set('auth_token', '', cookieOptions)
  response.cookies.set('admin_token', '', cookieOptions)

  return response
}
