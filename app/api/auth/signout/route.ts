import { NextResponse } from 'next/server'
import { createClient } from '@/lib/appwrite-server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true }, { status: 200 })
}
