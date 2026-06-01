import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { upsertUserProfile } from '@/lib/auth-profile'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const credential = typeof body?.credential === 'string' ? body.credential : ''
    const nonce = typeof body?.nonce === 'string' ? body.nonce : undefined

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
      nonce,
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Unable to sign in with Google' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await upsertUserProfile(supabase, data.user)

    if (profileError) {
      console.error('[GOOGLE_AUTH] Failed to sync profile:', profileError)
      return NextResponse.json(
        { user: data.user, warning: 'Signed in, but profile sync is delayed' },
        { status: 200 }
      )
    }

    return NextResponse.json({ user: data.user, profile }, { status: 200 })
  } catch (err) {
    console.error('[GOOGLE_AUTH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
