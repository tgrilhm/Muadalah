import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "KEPALA_SEKOLAH" | "GURU";

interface RBACOptions {
  allowedRoles: UserRole[];
  requireSchool?: boolean;
}

/**
 * RBAC Middleware for API Routes
 * Validates user authentication and role-based permissions
 * 
 * Usage in API routes:
 * ```typescript
 * const auth = await checkAuth(request, { allowedRoles: ["ADMIN", "SUPER_ADMIN"] });
 * if (!auth.authorized) {
 *   return auth.response;
 * }
 * // Continue with authorized logic
 * const { user, role, schoolId } = auth;
 * ```
 */
export async function checkAuth(
  request: NextRequest,
  options: RBACOptions
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Get user role from metadata or database
  // TODO: Implement actual role fetching from SchoolUser table
  const userRole = (user.user_metadata?.role as UserRole) || "GURU";

  // Check role authorization
  if (!options.allowedRoles.includes(userRole)) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  // Check school context if required
  if (options.requireSchool) {
    const schoolId = user.user_metadata?.schoolId;
    if (!schoolId) {
      return {
        authorized: false as const,
        response: NextResponse.json(
          { error: "Bad Request", message: "School context required" },
          { status: 400 }
        ),
      };
    }
  }

  // Return authorized with user context
  return {
    authorized: true as const,
    user,
    role: userRole,
    schoolId: user.user_metadata?.schoolId as string | undefined,
  };
}

/**
 * Helper to check if user has specific role
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Helper to check if user is admin or above
 */
export function isAdmin(role: UserRole): boolean {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}
