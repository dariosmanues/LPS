import { NextResponse } from 'next/server'

import crypto from 'crypto'

// --- Password Hashing (Node.js crypto) ---

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

function sha256(message: string): string {
  return crypto.createHash('sha256').update(message).digest('hex')
}

/**
 * Hash a password with a random salt.
 * Stored format: `salt:hash`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt()
  const hash = sha256(salt + password)
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
  const computedHash = sha256(salt + password)
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
