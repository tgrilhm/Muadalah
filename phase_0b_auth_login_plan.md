# Phase 0B: Authentication & Login Page — Implementation Plan

## Goal Description

Membangun sistem autentikasi yang aman dan lengkap untuk platform Muadalah, termasuk login API dengan Supabase Auth dan halaman login yang modern dan profesional. Phase ini adalah **prerequisite kritis** untuk semua fitur yang memerlukan autentikasi.

**Background Context:**
- Supabase Auth sudah tersedia (email + password provider)
- Frontend design reference tersedia di `frontend/stitch_muadalah_school_management_system/login_muadalah/code.html`
- Multi-school architecture: user bisa memilih sekolah saat login
- Role-based access control (SUPER_ADMIN, ADMIN, KEPALA_SEKOLAH, GURU)
- Next.js 14+ App Router dengan Server Components dan Client Components
- Security-first approach: httpOnly cookies, CSRF protection, rate limiting

**What This Change Accomplishes:**
- Login aman dengan Supabase Auth
- Session management dengan httpOnly cookies
- Role-based middleware untuk protect routes
- School selection untuk users dengan multiple schools
- Remember me functionality
- Forgot password flow
- Login UI yang modern, responsive, dan accessible
- Rate limiting untuk mencegah brute force attacks
- Comprehensive error handling dan user feedback

---

## User Review Required

> [!IMPORTANT]
> **Security Implementation:**
> - Mengikuti **security-review** skill untuk auth best practices
> - Token disimpan di httpOnly cookies (NOT localStorage)
> - CSRF protection dengan SameSite=Strict cookies
> - Rate limiting pada login endpoint (max 5 attempts per 15 menit)
> - Password hashing dengan bcrypt (handled by Supabase)
> - Session expiry management

> [!IMPORTANT]
> **Multi-School Selection:**
> - Saat login, user bisa pilih sekolah (jika punya akses ke multiple schools)
> - SUPER_ADMIN bisa pilih "Semua Unit" atau sekolah spesifik
> - Selection tersimpan di session untuk pengalaman yang konsisten
> - School switcher tersedia di dashboard setelah login

> [!WARNING]
> **Breaking Changes:**
> - Semua protected routes harus melalui auth middleware
> - API routes harus verify authentication token
> - Existing code yang assume authenticated user perlu update

---

## Open Questions

> [!IMPORTANT]
> **Session Duration:**
> 1. Berapa lama session valid sebelum expire?
>    - **Recommendation:** 
>      - Default: 24 jam
>      - "Remember Me": 7 hari
>      - Absolute max: 30 hari
>
> 2. Apakah perlu auto-refresh token sebelum expire?
>    - **Recommendation:** Ya, refresh 5 menit sebelum expire

> [!IMPORTANT]
> **Password Reset:**
> - Implementasi "Lupa Kata Sandi" flow sekarang atau di phase berikutnya?
> - **Recommendation:** Implementasi basic flow sekarang (email reset link)

> [!IMPORTANT]
> **Social Login:**
> - Apakah perlu Google/Microsoft OAuth untuk future?
> - **Recommendation:** Defer ke Phase Extended, focus email/password dulu

---

## Proposed Changes

### Component 1: Authentication API Layer

#### [NEW] [auth/login/route.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/login/route.ts)
- `POST /api/auth/login` - User login endpoint
  - Body: `{ email: string, password: string, schoolId?: string, rememberMe?: boolean }`
  - Validates credentials dengan Supabase Auth
  - Fetches user data dari Prisma (role, schools)
  - Sets httpOnly cookie dengan session token
  - Returns: user data + available schools
  - Rate limiting: 5 attempts per 15 minutes per IP
  - Error responses: 
    - 400: Invalid input
    - 401: Invalid credentials
    - 403: Account suspended
    - 429: Too many attempts

#### [NEW] [auth/logout/route.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/logout/route.ts)
- `POST /api/auth/logout` - User logout endpoint
  - Clears session cookie
  - Invalidates Supabase session
  - Returns: 200 OK

#### [NEW] [auth/me/route.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/me/route.ts)
- `GET /api/auth/me` - Get current user info
  - Verifies authentication token
  - Returns: user profile + role + schools
  - Used by client to check auth status

#### [NEW] [auth/refresh/route.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/refresh/route.ts)
- `POST /api/auth/refresh` - Refresh session token
  - Validates existing token
  - Issues new token if valid
  - Updates cookie expiry

#### [NEW] [auth/forgot-password/route.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/forgot-password/route.ts)
- `POST /api/auth/forgot-password` - Send password reset email
  - Body: `{ email: string }`
  - Uses Supabase Auth password reset
  - Rate limiting: 3 attempts per hour per email
  - Always returns 200 (security: don't leak email existence)

#### [NEW] [auth/reset-password/route.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/reset-password/route.ts)
- `POST /api/auth/reset-password` - Reset password with token
  - Body: `{ token: string, newPassword: string }`
  - Validates reset token
  - Updates password via Supabase Auth
  - Returns: 200 OK or 400 Invalid/expired token

---

### Component 2: Validation Schemas

#### [NEW] [auth.schema.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/lib/validations/auth.schema.ts)
- `LoginSchema` - Validation untuk login request
  ```typescript
  {
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    schoolId: z.string().optional(),
    rememberMe: z.boolean().optional()
  }
  ```
- `ForgotPasswordSchema` - Email validation
- `ResetPasswordSchema` - Password reset validation dengan strength check
- `SchoolSelectionSchema` - School selection validation

---

### Component 3: Middleware & Auth Utilities

#### [NEW] [middleware.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/middleware.ts)
- Next.js middleware untuk auth protection
- Checks authentication cookie
- Redirects unauthenticated users ke `/login`
- Protects `/dashboard/*` routes
- Allows public access ke `/`, `/login`, `/api/auth/login`, etc.

#### [NEW] [auth-helpers.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/lib/auth/auth-helpers.ts)
- `verifyToken(token: string)` - Verify JWT token
- `createSession(userId, schoolId, rememberMe)` - Create session cookie
- `destroySession()` - Clear session cookie
- `getSessionFromRequest(req)` - Extract session from request
- `requireAuth(handler)` - HOC untuk protect API routes
- `requireRole(roles: UserRole[])` - HOC untuk role-based access

#### [NEW] [rate-limit.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/lib/security/rate-limit.ts)
- Rate limiting utility menggunakan Redis atau in-memory store
- `checkRateLimit(identifier, max, window)` - Check rate limit
- Different limits untuk different endpoints:
  - Login: 5 attempts / 15 min
  - Password reset: 3 attempts / 1 hour
  - API calls: 100 requests / 15 min

---

### Component 4: Login Page UI

#### [NEW] [login/page.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/(auth)/login/page.tsx)
- **Design berdasarkan `login_muadalah/code.html`**
- Modern login page dengan:
  - Background image dengan scrim overlay
  - Gradient decorative blobs
  - Glassmorphism card effect
  - Logo & branding area
  - School selection dropdown (conditional)
  - Email/username input dengan icon
  - Password input dengan show/hide toggle
  - "Remember Me" checkbox
  - "Lupa Kata Sandi?" link
  - Submit button dengan loading state & animation
  - Footer links (Bantuan, Kebijakan Privasi, Syarat & Ketentuan)
- Features:
  - Client-side validation dengan react-hook-form + Zod
  - Loading overlay saat authenticating
  - Error messages untuk invalid credentials
  - Success animation sebelum redirect
  - Accessible keyboard navigation
  - Responsive design (mobile-first)

#### [NEW] [layout.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/(auth)/layout.tsx)
- Auth layout group untuk public pages
- Simple centered layout
- No sidebar/header
- Meta tags untuk SEO

---

### Component 5: React Components

#### [NEW] [login-form.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/auth/login-form.tsx)
- Reusable login form component
- Props: `onSuccess`, `redirectTo`
- Handles form state dengan react-hook-form
- Client component with "use client"
- Features:
  - Field validation dengan visual feedback
  - Password visibility toggle
  - Remember me persistence
  - Loading states
  - Error display

#### [NEW] [school-selector.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/auth/school-selector.tsx)
- School selection dropdown component
- Shows available schools for user
- "Semua Unit" option untuk SUPER_ADMIN
- Searchable dropdown (jika banyak sekolah)
- Accessible select dengan keyboard navigation

#### [NEW] [auth-loading.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/auth/auth-loading.tsx)
- Loading overlay component
- Spinner dengan backdrop blur
- "Mengautentikasi..." text
- Smooth entrance/exit animations

---

### Component 6: Custom Hooks

#### [NEW] [use-auth.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/hooks/use-auth.ts)
- Custom hook untuk authentication
- Exports:
  - `useAuth()` - Get current user + auth status
  - `useLogin()` - Login mutation
  - `useLogout()` - Logout mutation
  - `useRequireAuth()` - Redirect if not authenticated
- Uses TanStack Query untuk caching
- Auto-refetch `/api/auth/me` on mount

#### [NEW] [use-session.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/hooks/use-session.ts)
- Session management hook
- Handles token refresh
- Auto-refresh 5 minutes before expiry
- Clears session on logout

---

### Component 7: Test Files

#### [NEW] [auth/login.test.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/__tests__/login.test.ts)
- Integration tests untuk login endpoint
- Tests:
  - Successful login dengan valid credentials
  - Failed login dengan invalid credentials
  - Rate limiting enforcement
  - Cookie setting
  - School selection
  - Remember me functionality

#### [NEW] [auth/logout.test.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/api/auth/__tests__/logout.test.ts)
- Integration tests untuk logout
- Verifies cookie clearing
- Verifies session invalidation

#### [NEW] [middleware.test.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/__tests__/middleware.test.ts)
- Tests untuk auth middleware
- Protected routes redirect to login
- Public routes accessible
- Authenticated users can access protected routes

#### [NEW] [login-form.test.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/auth/__tests__/login-form.test.tsx)
- Component tests untuk LoginForm
- Tests:
  - Renders all fields
  - Validation errors display
  - Submit with valid data
  - Password toggle works
  - Remember me checkbox
  - Loading states

#### [NEW] [login.spec.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/e2e/auth/login.spec.ts)
- E2E tests untuk login flow
- Tests:
  - Complete login flow from landing to dashboard
  - Invalid credentials show error
  - Remember me persists session
  - Logout clears session
  - Protected routes redirect to login

---

## Verification Plan

### Automated Tests

Run all tests:
```bash
# Unit & Integration tests
npm test src/app/api/auth
npm test src/components/auth
npm test middleware

# E2E tests
npx playwright test e2e/auth
```

Coverage target: 85%+ untuk auth code

### Manual Verification

1. **Login Flow:**
   - Navigate to `/login`
   - Enter valid credentials
   - Select school (jika multiple)
   - Click "Masuk ke Dashboard"
   - Verify redirect to `/dashboard`
   - Verify user info displayed correctly

2. **Invalid Credentials:**
   - Try login dengan wrong password
   - Verify error message muncul
   - Verify no redirect happens
   - Verify tidak ada cookie set

3. **Rate Limiting:**
   - Try login 6x dengan wrong password
   - Verify 6th attempt blocked dengan 429 status
   - Wait 15 minutes
   - Verify dapat login lagi

4. **Remember Me:**
   - Login dengan "Remember Me" checked
   - Close browser
   - Reopen browser
   - Navigate to `/dashboard`
   - Verify masih logged in

5. **Logout:**
   - Login successfully
   - Click logout button di dashboard
   - Verify redirect ke `/login`
   - Try access `/dashboard`
   - Verify redirect ke `/login`

6. **Forgot Password:**
   - Click "Lupa Kata Sandi?"
   - Enter email
   - Check email untuk reset link
   - Click reset link
   - Enter new password
   - Verify dapat login dengan new password

7. **Middleware Protection:**
   - Without login, try access `/dashboard`
   - Verify redirect to `/login`
   - After login, access `/dashboard`
   - Verify access granted

8. **Accessibility:**
   - Test keyboard navigation (Tab, Enter, Escape)
   - Test screen reader (NVDA/JAWS)
   - Verify form labels dan ARIA attributes
   - Check color contrast (WCAG AA)

9. **Responsive Design:**
   - Test mobile (375px)
   - Test tablet (768px)
   - Test desktop (1920px)
   - Verify layout tidak break

10. **Security Headers:**
    - Inspect response headers
    - Verify `Set-Cookie` has `HttpOnly; Secure; SameSite=Strict`
    - Verify CSRF token present
    - Verify no sensitive data in client

---

## Implementation Sequence

### Phase 1: API Layer (2-3 hours)
1. Create validation schemas (`auth.schema.ts`)
2. Create rate limiting utility (`rate-limit.ts`)
3. Create auth helpers (`auth-helpers.ts`)
4. Create login API route (`auth/login/route.ts`)
5. Create logout API route (`auth/logout/route.ts`)
6. Create me API route (`auth/me/route.ts`)
7. Create refresh API route (`auth/refresh/route.ts`)
8. Write integration tests untuk API routes
9. Test API dengan Postman/Thunder Client

### Phase 2: Middleware & Security (1-2 hours)
1. Create Next.js middleware (`middleware.ts`)
2. Implement route protection logic
3. Test middleware dengan different routes
4. Implement CSRF protection
5. Write middleware tests

### Phase 3: UI Components (2-3 hours)
1. Create auth layout (`(auth)/layout.tsx`)
2. Create LoginForm component (`login-form.tsx`)
3. Create SchoolSelector component (`school-selector.tsx`)
4. Create AuthLoading component (`auth-loading.tsx`)
5. Write component tests
6. Test components in Storybook (optional)

### Phase 4: Login Page (1-2 hours)
1. Create login page (`(auth)/login/page.tsx`)
2. Implement design dari HTML reference
3. Integrate LoginForm component
4. Add animations dengan Framer Motion
5. Test responsive design
6. Test accessibility

### Phase 5: Custom Hooks (1 hour)
1. Create useAuth hook (`use-auth.ts`)
2. Create useSession hook (`use-session.ts`)
3. Test hooks dengan React Testing Library

### Phase 6: Password Reset Flow (1-2 hours)
1. Create forgot-password API route
2. Create reset-password API route
3. Create forgot password page UI
4. Create reset password page UI
5. Test complete flow

### Phase 7: E2E Tests & Polish (2-3 hours)
1. Write E2E tests dengan Playwright
2. Run full test suite
3. Fix any bugs found
4. Performance optimization
5. Security audit
6. Update documentation

---

## Dependencies

Already installed:
- `@supabase/supabase-js` - Supabase client
- `@tanstack/react-query` - Data fetching
- `zod` - Validation
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Zod integration

Need to install:
```bash
npm install jose  # JWT handling (lightweight, zero deps)
npm install bcrypt @types/bcrypt  # Password hashing (backup/testing)
npm install rate-limiter-flexible  # Rate limiting
```

---

## Security Checklist

Based on **security-review** skill:

- [x] **Secrets Management:**
  - Supabase keys di environment variables
  - No hardcoded secrets
  - `.env.local` in `.gitignore`

- [x] **Input Validation:**
  - All inputs validated dengan Zod schemas
  - Email format validation
  - Password strength check (min 8 chars)
  - SQL injection prevented (Prisma/Supabase)

- [x] **Authentication:**
  - Tokens stored in httpOnly cookies (NOT localStorage)
  - Secure cookie flags: `HttpOnly; Secure; SameSite=Strict`
  - Session expiry management
  - Token refresh mechanism

- [x] **Authorization:**
  - Role-based middleware checks
  - Protected routes verified
  - API endpoints require auth token

- [x] **CSRF Protection:**
  - SameSite=Strict cookies
  - CSRF token for state-changing operations

- [x] **Rate Limiting:**
  - Login: 5 attempts / 15 minutes
  - Password reset: 3 attempts / 1 hour
  - API: 100 requests / 15 minutes

- [x] **Error Handling:**
  - Generic error messages untuk users
  - Detailed errors only in server logs
  - No stack traces exposed
  - No email enumeration (forgot password always returns 200)

- [x] **HTTPS:**
  - Enforced in production (Vercel default)
  - Secure cookie flag set

- [x] **Password Security:**
  - Hashed dengan bcrypt (via Supabase)
  - Min 8 characters
  - No password in logs

---

## Risk Mitigation

> [!CAUTION]
> **Session Fixation Attack:**
> - Regenerate session ID after login
> - Clear old session on logout
> - Validate session token on every request

> [!WARNING]
> **Brute Force Attacks:**
> - Rate limiting enforced
> - Account lockout after 10 failed attempts (optional)
> - CAPTCHA after 3 failed attempts (future enhancement)

> [!WARNING]
> **Token Expiry:**
> - Auto-refresh before expiry
> - Graceful logout jika refresh fails
> - User-friendly "Session expired" message

---

## Performance Considerations

- **Cookie Size:** Keep session token minimal (<4KB)
- **Database Queries:** Cache user data dengan React Query
- **Rate Limiting:** Use Redis untuk distributed rate limiting (future)
- **Supabase Calls:** Minimize calls, cache responses

---

## Time Estimate

- Phase 1 (API Layer): 2-3 hours
- Phase 2 (Middleware): 1-2 hours
- Phase 3 (Components): 2-3 hours
- Phase 4 (Login Page): 1-2 hours
- Phase 5 (Hooks): 1 hour
- Phase 6 (Password Reset): 1-2 hours
- Phase 7 (E2E & Polish): 2-3 hours

**Total: 10-16 hours**

With TDD workflow dan security review, expect 12-18 hours including testing and security audit.

---

## Design Preview

Login page akan implement design dari HTML reference dengan:
- ✅ Modern glassmorphism card
- ✅ Gradient background dengan decorative blobs
- ✅ Material Symbols icons
- ✅ Smooth transitions dan hover effects
- ✅ Password visibility toggle
- ✅ School selection dropdown
- ✅ Remember me checkbox
- ✅ Loading overlay dengan spinner
- ✅ Footer links
- ✅ Responsive mobile-first design
- ✅ Accessible keyboard navigation

---

## Next Steps After This Phase

After Phase 0B completion:
1. **Phase 0A: Landing Page** - Public homepage (can be parallel)
2. **Phase 1: Database Schema** - Setup Prisma models
3. **Phase 2: Dashboard Layout** - Protected area dengan sidebar
4. **Phase 3A: Manajemen Siswa** - Student CRUD (requires auth ✓)
