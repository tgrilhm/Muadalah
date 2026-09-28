/**
 * Auth Validation Schemas - Zod schemas for auth operations
 */

import { z } from 'zod'

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Email tidak valid')
    .min(3, 'Email minimal 3 karakter'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  schoolId: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
})

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Email tidak valid')
    .min(3, 'Email minimal 3 karakter'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, 'Token tidak valid'),
  newPassword: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
