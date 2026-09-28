/**
 * useLogout Hook
 * 
 * Logout mutation with loading states
 * Calls /api/auth/logout endpoint
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function useLogout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const logout = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // Even if API fails, clear client state
        console.warn('Logout API failed, clearing client state anyway')
      }

      // Redirect to login
      router.push('/login')
      router.refresh() // Refresh to clear server components

      setLoading(false)
      return { success: true }
    } catch (err) {
      // Even on error, redirect to login (fail-safe)
      console.error('Logout error:', err)
      router.push('/login')
      router.refresh()

      setLoading(false)
      return { success: true } // Always succeed to prevent stuck sessions
    }
  }

  return {
    logout,
    loading,
    error,
  }
}
