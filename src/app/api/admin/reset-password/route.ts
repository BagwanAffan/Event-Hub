import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Invalid user ID or password length (min 6 chars)' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Supabase admin password update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Password updated directly successfully' });
  } catch (err: any) {
    console.error('Reset password server error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error resetting password' }, { status: 500 });
  }
}
