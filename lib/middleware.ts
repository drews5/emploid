import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Wraps an API handler with authentication.
 * Automatically returns 401 if no valid user session exists.
 */
export function withAuth(
  handler: (
    req: NextRequest,
    context: { user: User; supabase: SupabaseClient; params?: any }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeContext?: { params?: any }) => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      return await handler(req, {
        user,
        supabase,
        params: routeContext?.params,
      });
    } catch (err: any) {
      console.error('[AUTH_MIDDLEWARE]', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wraps a public API handler with error boundaries and a Supabase client.
 * No auth required but provides consistent error handling.
 */
export function withPublic(
  handler: (
    req: NextRequest,
    context: { supabase: SupabaseClient; params?: any }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeContext?: { params?: any }) => {
    try {
      const supabase = createClient();
      return await handler(req, {
        supabase,
        params: routeContext?.params,
      });
    } catch (err: any) {
      console.error('[PUBLIC_ROUTE]', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
