import type { AppwriteBackendClient, AppwriteUser } from '@/lib/appwrite-server'

function profileNameFromUser(user: NonNullable<AppwriteUser>) {
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

function profileAvatarFromUser(user: NonNullable<AppwriteUser>) {
  const metadata = user.user_metadata || {}
  return metadata.avatar_url || metadata.picture || null
}

function profileProviderFromUser(user: NonNullable<AppwriteUser>) {
  return user.app_metadata?.provider || user.identities?.[0]?.provider || 'email'
}

export async function upsertUserProfile(supabase: AppwriteBackendClient, user: NonNullable<AppwriteUser>) {
  const profile = {
    id: user.id,
    email: user.email || null,
    name: profileNameFromUser(user),
    avatar_url: profileAvatarFromUser(user),
    auth_provider: profileProviderFromUser(user),
    last_sign_in_at: user.accessedAt || new Date().toISOString(),
  }

  return supabase
    .from('users')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
}
