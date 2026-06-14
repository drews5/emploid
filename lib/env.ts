import { z } from 'zod'

/**
 * Environment variable validation.
 * Import this at the top of any server-side entry point to fail fast
 * with clear errors instead of cryptic undefined crashes.
 */

const serverSchema = z.object({
  APPWRITE_ENDPOINT: z.string().url('APPWRITE_ENDPOINT must be a valid URL'),
  APPWRITE_PROJECT_ID: z.string().min(1, 'APPWRITE_PROJECT_ID is required'),
  APPWRITE_API_KEY: z.string().min(1, 'APPWRITE_API_KEY is required'),
  APPWRITE_DATABASE_ID: z.string().min(1).default('emploid'),
  INTERNAL_API_KEY: z.string().min(16, 'INTERNAL_API_KEY must be at least 16 characters'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
})

export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>

function validateEnv() {
  const parsed = serverSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ❌ ${key}: ${msgs?.join(', ')}`)
      .join('\n')

    console.error(
      `\n🚨 Missing or invalid environment variables:\n${formatted}\n\n` +
      `Copy .env.local.example to .env.local and fill in the values.\n`
    )

    throw new Error('Invalid environment configuration')
  }

  return parsed.data
}

/**
 * Validated server environment.
 * Throws at import time if any required vars are missing.
 */
export const env = validateEnv()
