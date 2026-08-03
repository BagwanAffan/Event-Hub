import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUserClient = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, title, message, type = 'info', actionUrl } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required notification parameters (userId, title, message)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Server notification insertion error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to insert notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Unexpected error sending notification:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
