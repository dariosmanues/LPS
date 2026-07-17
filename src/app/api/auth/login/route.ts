import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, setAuthCookie } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // Set auth cookie and return success
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    })

    setAuthCookie(response, user.id)
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
