/**
 * Auth API Route - Logout endpoint
 * POST /api/auth/logout
 * 
 * Security Features:
 * - Invalidates Supabase session
 * - Clears httpOnly cookies
 * - Safe to call even if already logged out
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase server client
    const supabase = await createClient()

    // Sign out from Supabase (clears session and cookies)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error.message)
      
      // Don't fail on logout errors - user might already be logged out
      return NextResponse.json(
        {
          success: true,
          message: 'Session cleared',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logout berhasil',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected logout error:', error)

    // Always succeed logout to prevent stuck sessions
    return NextResponse.json(
      {
        success: true,
        message: 'Session cleared',
      },
      { status: 200 }
    )
  }
}
