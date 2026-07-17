import { NextResponse } from 'next/server'

// --- Password Hashing (Web Crypto API, no external deps) ---

async function generateSalt(): Promise<string> {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a password with a random salt.
 * Stored format: `salt:hash`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt()
  const hash = await sha256(salt + password)
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored `salt:hash` string.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const computedHash = await sha256(salt + password)
  return computedHash === hash
}

// --- Cookie Helper ---

const AUTH_COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

/**
 * Set auth cookie on a NextResponse with the user ID as value.
 */
export function setAuthCookie(response: NextResponse, userId: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}
