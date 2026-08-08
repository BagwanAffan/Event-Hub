import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, requestId, adminId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required for account deletion' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'SUPABASE_SERVICE_ROLE_KEY environment variable is not configured. Service role key is required for Auth user deletion.'
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(`[Account Deletion API] Starting complete deletion workflow for user ${userId}...`);

    // Step 0: Prevent deletion if user owns active events
    const { count: ownedEventsCount } = await supabaseAdmin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId);

    if (ownedEventsCount && ownedEventsCount > 0) {
      console.warn(`[Account Deletion API] User ${userId} owns ${ownedEventsCount} active events. Deletion blocked.`);
      return NextResponse.json(
        {
          success: false,
          error: 'This organizer owns active events. Delete or transfer these events before deleting the organizer.',
          ownsEvents: true,
          eventsCount: ownedEventsCount
        },
        { status: 400 }
      );
    }

    // Step 1: Safe ordered cascade delete of child database records before parent records
    try {
      // 1. Delete certificates
      await supabaseAdmin.from('certificates').delete().eq('user_id', userId);

      // 2. Delete attendance
      await supabaseAdmin.from('attendance').delete().eq('user_id', userId);

      // 3. Delete payments
      await supabaseAdmin.from('payments').delete().eq('user_id', userId);

      // 4. Delete feedback
      await supabaseAdmin.from('feedback').delete().eq('user_id', userId);

      // 5. Delete notifications
      await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

      // 6. Delete volunteer tasks for this user's volunteer records
      const { data: userVolunteers } = await supabaseAdmin
        .from('volunteers')
        .select('id')
        .eq('user_id', userId);

      if (userVolunteers && userVolunteers.length > 0) {
        const volIds = userVolunteers.map(v => v.id);
        await supabaseAdmin.from('volunteer_tasks').delete().in('volunteer_id', volIds);
      }

      // 7. Delete volunteer records
      await supabaseAdmin.from('volunteers').delete().eq('user_id', userId);

      // 8. Delete team_members
      await supabaseAdmin.from('team_members').delete().eq('user_id', userId);

      // 9. Delete registrations
      await supabaseAdmin.from('registrations').delete().eq('user_id', userId);

      // 10. Delete organizer verifications
      await supabaseAdmin.from('organizer_verifications').delete().eq('user_id', userId);

      // 11. Delete deletion requests for this user (except optionally keeping status update)
      if (requestId) {
        await supabaseAdmin.from('account_deletion_requests').delete().eq('id', requestId);
      }
      await supabaseAdmin.from('account_deletion_requests').delete().eq('user_id', userId);

      // 12. Delete audit logs & AI history
      await supabaseAdmin.from('audit_logs').delete().eq('user_id', userId);
      await supabaseAdmin.from('ai_histories').delete().eq('user_id', userId);

      // 13. Clean up events created by this user if organizer
      await supabaseAdmin.from('events').delete().eq('created_by', userId);

      // 14. Delete profile record
      const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
      if (profileErr) {
        console.warn('[Account Deletion API] Warning deleting profile row:', profileErr.message);
      }
    } catch (dbCascadeErr: any) {
      console.error('[Account Deletion API] Error during database cascade delete:', dbCascadeErr);
      return NextResponse.json(
        {
          success: false,
          error: `Database cascade delete failed: ${dbCascadeErr?.message || 'Unknown database error'}`
        },
        { status: 500 }
      );
    }

    // Step 2: Delete the user from Supabase Authentication (auth.users)
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authErr) {
      console.error('[Account Deletion API] Supabase Auth deleteUser error:', authErr);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete user from Supabase Auth: ${authErr.message}`
        },
        { status: 400 }
      );
    }

    console.log(`[Account Deletion API] User ${userId} and all related database & Auth records permanently deleted by admin ${adminId || 'system'}.`);

    return NextResponse.json({
      success: true,
      message: 'User account and Supabase Authentication record permanently deleted.'
    });
  } catch (err: any) {
    console.error('[Account Deletion API] Internal server error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error during account deletion' },
      { status: 500 }
    );
  }
}
