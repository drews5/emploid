import { NextRequest, NextResponse } from 'next/server'
import { ID, Query } from 'node-appwrite'
import { OAuth2Client } from 'google-auth-library'
import {
  createAdminServices,
  createServiceClient,
  mapAppwriteUser,
  setAppwriteSessionCookie,
} from '@/lib/appwrite-server'
import { upsertUserProfile } from '@/lib/auth-profile'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const credential = typeof body?.credential === 'string' ? body.credential : ''
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''

    if (!credential || !clientId) {
      return NextResponse.json({ error: 'Google sign-in is not configured' }, { status: 400 })
    }

    const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken: credential, audience: clientId })
    const payload = ticket.getPayload()
    if (!payload?.email || payload.email_verified === false) {
      return NextResponse.json({ error: 'Unable to verify Google account' }, { status: 401 })
    }

    const { account, users } = createAdminServices()
    const existing = await users.list({ queries: [Query.equal('email', payload.email), Query.limit(1)] })
    const appwriteUser = existing.users[0] || await users.create({
      userId: ID.unique(),
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
    })

    const token = await users.createToken({ userId: appwriteUser.$id, length: 64, expire: 900 })
    const session = await account.createSession({ userId: appwriteUser.$id, secret: token.secret })
    setAppwriteSessionCookie(session.secret, session.expire)

    const user = mapAppwriteUser({ ...appwriteUser, prefs: { avatar_url: payload.picture, provider: 'google' } })
    const { data: profile, error: profileError } = await upsertUserProfile(createServiceClient() as any, user)

    if (profileError) {
      console.error('[GOOGLE_AUTH] Failed to sync profile:', profileError)
      return NextResponse.json({ user, warning: 'Signed in, but profile sync is delayed' }, { status: 200 })
    }

    return NextResponse.json({ user, profile }, { status: 200 })
  } catch (err: any) {
    console.error('[GOOGLE_AUTH]', err)
    return NextResponse.json({ error: err?.message || 'Unable to sign in with Google' }, { status: 401 })
  }
}
