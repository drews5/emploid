import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { SignupSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Insert into users table (requires the INSERT RLS policy we added)
    if (data.user) {
      const supabaseAdmin = createServiceClient();
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: data.user.id,
        email,
        name,
        is_pro: false,
      });

      if (userError) {
        console.error('[SIGNUP] Failed to create user profile:', userError);
        // Don't fail the entire signup — the auth user was created.
        // A background job or next login can reconcile the missing profile.
        return NextResponse.json(
          { user: data.user, warning: 'Profile creation delayed' },
          { status: 201 }
        );
      }
    }

    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (err) {
    console.error('[SIGNUP]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
