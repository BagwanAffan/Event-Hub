import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required for event deletion' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log(`[Delete Event API] Starting cascade deletion for event ${eventId}...`);

    // 1. Fetch team IDs belonging to event
    const { data: teamRows } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('event_id', eventId);

    if (teamRows && teamRows.length > 0) {
      const teamIds = teamRows.map((t: any) => t.id);
      await supabaseAdmin.from('team_members').delete().in('team_id', teamIds);
    }

    // 2. Delete teams
    await supabaseAdmin.from('teams').delete().eq('event_id', eventId);

    // 3. Delete payments
    await supabaseAdmin.from('payments').delete().eq('event_id', eventId);

    // 4. Delete attendance
    await supabaseAdmin.from('attendance').delete().eq('event_id', eventId);

    // 5. Delete certificates
    await supabaseAdmin.from('certificates').delete().eq('event_id', eventId);

    // 6. Delete volunteer tasks
    await supabaseAdmin.from('volunteer_tasks').delete().eq('event_id', eventId);

    // 7. Delete volunteers
    await supabaseAdmin.from('volunteers').delete().eq('event_id', eventId);

    // 8. Delete registrations
    await supabaseAdmin.from('registrations').delete().eq('event_id', eventId);

    // 9. Delete announcements
    await supabaseAdmin.from('announcements').delete().eq('event_id', eventId);

    // 10. Delete event FAQs
    await supabaseAdmin.from('event_faqs').delete().eq('event_id', eventId);

    // 11. Delete event galleries
    await supabaseAdmin.from('event_galleries').delete().eq('event_id', eventId);

    // 12. Delete feedback
    await supabaseAdmin.from('feedback').delete().eq('event_id', eventId);

    // 13. Delete notifications referencing event URL
    await supabaseAdmin
      .from('notifications')
      .delete()
      .ilike('action_url', `%${eventId}%`);

    // 14. Delete AI history mentioning event
    await supabaseAdmin
      .from('ai_histories')
      .delete()
      .ilike('prompt', `%${eventId}%`);

    // 15. Delete event row permanently
    const { error: deleteErr } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteErr) {
      console.error('[Delete Event API] Error deleting event row:', deleteErr);
      return NextResponse.json(
        { success: false, error: deleteErr.message },
        { status: 500 }
      );
    }

    console.log(`[Delete Event API] Event ${eventId} and all dependent records permanently deleted.`);

    return NextResponse.json({
      success: true,
      message: 'Event and all dependent records permanently deleted.',
    });
  } catch (err: any) {
    console.error('[Delete Event API] Internal server error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error during event deletion' },
      { status: 500 }
    );
  }
}
