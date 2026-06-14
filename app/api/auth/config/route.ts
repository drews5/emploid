import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''

  return NextResponse.json({
    googleClientId,
    googleConfigured: Boolean(googleClientId),
    accountServiceConfigured: Boolean(
      process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY
    ),
  })
}
