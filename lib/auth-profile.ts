import type { SupabaseClient, User } from '@supabase/supabase-js'

function profileNameFromUser(user: User) {
  const metadata = user.user_metadata || {}
  const composedName = [metadata.given_name, metadata.family_name].filter(Boolean).join(' ')

  return (
    metadata.full_name ||
    metadata.name ||
    composedName ||
    user.email?.split('@')[0] ||
    'Emploid user'
  )
}

function profileAvatarFromUser(user: User) {
  const metadata = user.user_metadata || {}
  return metadata.avatar_url || metadata.picture || null
}

function profileProviderFromUser(user: User) {
  return user.app_metadata?.provider || user.identities?.[0]?.provider || 'email'
}

export async function upsertUserProfile(supabase: SupabaseClient, user: User) {
  const profile = {
    id: user.id,
    email: user.email || null,
    name: profileNameFromUser(user),
    avatar_url: profileAvatarFromUser(user),
    auth_provider: profileProviderFromUser(user),
    last_sign_in_at: user.last_sign_in_at || new Date().toISOString(),
  }

  return supabase
    .from('users')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
}
