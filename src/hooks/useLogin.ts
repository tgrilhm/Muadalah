/**
 * useLogin Hook
 * 
 * Login mutation with loading/error states
 * Calls /api/auth/login endpoint
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LoginCredentials {
  email: string
  password: string
  schoolId?: string
  rememberMe?: boolean
}

interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string | null
    role: string
  }
  error?: string
  field?: string
}

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data: LoginResponse = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || 'Login gagal')
        setLoading(false)
        return { success: false, error: data.message }
      }

      // Login successful - redirect to dashboard
      router.push('/dashboard')
      router.refresh() // Refresh to update server components

      setLoading(false)
      return { success: true, user: data.user }
    } catch (err) {
      const errorMessage = 'Terjadi kesalahan pada jaringan'
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }

  const clearError = () => setError(null)

  return {
    login,
    loading,
    error,
    clearError,
  }
}
