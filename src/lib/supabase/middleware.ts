import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Public routes - no auth required
const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/api/auth/login", "/api/auth/logout"]

export async function updateSession(request: NextRequest) {
  try {
    // Get current pathname
    const pathname = request.nextUrl.pathname

    // Allow public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.next({
        request,
      })
    }

    // Create Supabase client to check session
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and route is protected, redirect to login
    if (!session) {
      // Store return path for post-login redirect
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Session exists - continue request
    return NextResponse.next({
      request,
    })
  } catch (error) {
    console.error("Middleware error:", error)

    // On error, allow request (fail-open for UX)
    return NextResponse.next({
      request,
    })
  }
}
