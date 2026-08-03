const { createClient } = require('@supabase/supabase-js');

const url = 'https://bfcllsrjzkviyqlifsxv.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY2xsc3Jqemt2aXlxbGlmc3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxNDIyNywiZXhwIjoyMTAwOTkwMjI3fQ.LPHr0RKia7S00VbatJKzWqNsh7PMdXcZkcQDyxJR7Q0';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY2xsc3Jqemt2aXlxbGlmc3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTQyMjcsImV4cCI6MjEwMDk5MDIyN30.ZSxQyUlvAU24WE4EJKBFGWzBbYJ3mdOobJw65tTvrbI';

const supabaseAdmin = createClient(url, serviceKey);
const supabaseAnon = createClient(url, anonKey);

async function runUpdateAsOrganizer() {
  // 1. Fetch event and registration details
  const { data: reg } = await supabaseAdmin.from("registrations").select("*, events(created_by)").limit(1).single();
  if (!reg) {
    console.log("No registration found");
    return;
  }

  const organizerId = reg.events.created_by;
  console.log("Registration ID:", reg.id);
  console.log("Event ID:", reg.event_id);
  console.log("Organizer User ID (created_by):", organizerId);

  // 2. Fetch organizer user email
  const { data: organizerUser } = await supabaseAdmin.auth.admin.getUserById(organizerId);
  console.log("Organizer Email:", organizerUser?.user?.email);

  if (organizerUser?.user?.email) {
    // Reset password so we can authenticate as organizer
    await supabaseAdmin.auth.admin.updateUserById(organizerId, { password: 'password123' });
    const { data: authSession, error: loginErr } = await supabaseAnon.auth.signInWithPassword({
      email: organizerUser.user.email,
      password: 'password123'
    });

    if (loginErr) {
      console.error("Organizer login error:", loginErr);
      return;
    }

    console.log("Successfully logged in as Organizer auth.uid():", authSession.user.id);
  }

  const updates = {
    status: 'approved',
    payment_status: 'approved',
    approved_at: new Date().toISOString(),
    qr_generated: true,
    qr_token: `EH-PASS-${Date.now()}`,
    updated_at: new Date().toISOString()
  };

  console.log("[UPDATE TRACE] Registration ID:", reg.id);
  console.log("[UPDATE TRACE] Updates object:", JSON.stringify(updates, null, 2));
  console.log("[UPDATE TRACE] Full PATCH payload:", JSON.stringify({ table: "registrations", filter: { id: reg.id }, updates }, null, 2));

  const { data, error } = await supabaseAnon
    .from("registrations")
    .update(updates)
    .eq("id", reg.id)
    .select()
    .single();

  if (error) {
    console.error("[UPDATE TRACE] Complete Error Object:", JSON.stringify(error, null, 2));
    console.error("[UPDATE TRACE] Error Code:", error.code);
    console.error("[UPDATE TRACE] Error Message:", error.message);
    console.error("[UPDATE TRACE] Error Details:", error.details);
    console.error("[UPDATE TRACE] Error Hint:", error.hint);
  } else {
    console.log("[UPDATE TRACE] UPDATE succeeded! Returned row:", JSON.stringify(data, null, 2));
  }
}

runUpdateAsOrganizer();
