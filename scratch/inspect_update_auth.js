const { createClient } = require('@supabase/supabase-js');

const url = 'https://bfcllsrjzkviyqlifsxv.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY2xsc3Jqemt2aXlxbGlmc3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxNDIyNywiZXhwIjoyMTAwOTkwMjI3fQ.LPHr0RKia7S00VbatJKzWqNsh7PMdXcZkcQDyxJR7Q0';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY2xsc3Jqemt2aXlxbGlmc3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTQyMjcsImV4cCI6MjEwMDk5MDIyN30.ZSxQyUlvAU24WE4EJKBFGWzBbYJ3mdOobJw65tTvrbI';

const supabaseAdmin = createClient(url, serviceKey);

async function inspectAuthorization() {
  console.log("=== INSPECTING REGISTRATION UPDATE AUTHORIZATION ===\n");

  // 1. Fetch registrations with event information
  const { data: registrations, error: regErr } = await supabaseAdmin
    .from("registrations")
    .select(`
      id,
      event_id,
      user_id,
      status,
      payment_status,
      events!inner(
        id,
        title,
        created_by
      )
    `);

  if (regErr || !registrations || registrations.length === 0) {
    console.error("Error fetching registrations:", regErr);
    return;
  }

  // 2. Fetch all organizer users
  const { data: organizers } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "organizer");

  console.log("Organizers in system:", JSON.stringify(organizers, null, 2));

  for (const reg of registrations) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Registration ID: ${reg.id}`);
    console.log(`Registration event_id: ${reg.event_id}`);
    console.log(`Event Title: ${reg.events?.title}`);
    console.log(`Event created_by: ${reg.events?.created_by}`);

    for (const org of organizers || []) {
      const match = org.id === reg.events?.created_by;
      console.log(`\n  Organizer Check -> Email: ${org.email} (ID: ${org.id})`);
      console.log(`  auth.uid(): ${org.id}`);
      console.log(`  events.created_by: ${reg.events?.created_by}`);
      console.log(`  auth.uid() == events.created_by: ${match}`);

      if (!match) {
        console.log(`  Reason for mismatch: Organizer '${org.email}' did not create event '${reg.events?.title}'. The event was created by User ID '${reg.events?.created_by}'.`);
      }
    }
  }
}

inspectAuthorization();
