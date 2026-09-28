/**
 * Auth API Route - Login endpoint
 * POST /api/auth/login
 * 
 * Security Features:
 * - Supabase signInWithPassword (bcrypt hashing)
 * - httpOnly cookies via Supabase SSR
 * - CSRF protection (SameSite=Strict)
 * - Input validation with Zod
 * - Secure error messages (no user enumeration)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LoginSchema } from '@/lib/validations/auth.schema'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const validatedData = LoginSchema.parse(body)

    // Create Supabase server client (handles cookies)
    const supabase = await createClient()

    // Attempt sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    // Handle authentication errors
    if (error) {
      console.error('Supabase auth error:', error.message)

      // Return generic error (prevent user enumeration)
      return NextResponse.json(
        {
          success: false,
          message: 'Email atau password tidak sesuai',
          error: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    // Authentication successful
    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Terjadi kesalahan saat login',
          error: 'SESSION_ERROR',
        },
        { status: 500 }
      )
    }

    // TODO: Fetch user profile from database (role, school, etc.)
    // For now, return basic user info from Supabase Auth
    const userData = {
      id: data.user.id,
      email: data.user.email,
      emailVerified: data.user.email_confirmed_at != null,
      createdAt: data.user.created_at,
      // Role will come from database in future
      role: data.user.user_metadata?.role || 'GURU',
    }

    // Return success response
    // Session cookie automatically set by Supabase SSR
    return NextResponse.json(
      {
        success: true,
        message: 'Login berhasil',
        user: userData,
        session: {
          expiresAt: data.session.expires_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        {
          success: false,
          message: firstError.message,
          error: 'VALIDATION_ERROR',
          field: firstError.path[0],
        },
        { status: 400 }
      )
    }

    // Handle unexpected errors
    console.error('Unexpected login error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * Rate Limiting TODO:
 * - Add Redis/Upstash for rate limiting
 * - Limit: 5 attempts per 15 minutes per IP
 * - Block on excessive failures
 * 
 * Example with Upstash:
 * const ratelimit = new Ratelimit({
 *   redis: Redis.fromEnv(),
 *   limiter: Ratelimit.slidingWindow(5, "15 m"),
 * })
 * const { success } = await ratelimit.limit(ip)
 */
