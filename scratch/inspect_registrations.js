const { createClient } = require('@supabase/supabase-js');

const url = 'https://bfcllsrjzkviyqlifsxv.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY2xsc3Jqemt2aXlxbGlmc3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxNDIyNywiZXhwIjoyMTAwOTkwMjI3fQ.LPHr0RKia7S00VbatJKzWqNsh7PMdXcZkcQDyxJR7Q0';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY2xsc3Jqemt2aXlxbGlmc3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTQyMjcsImV4cCI6MjEwMDk5MDIyN30.ZSxQyUlvAU24WE4EJKBFGWzBbYJ3mdOobJw65tTvrbI';

const supabaseAdmin = createClient(url, serviceKey);
const supabaseAnon = createClient(url, anonKey);

async function runTest() {
  console.log("Resetting student affan@gmail.com password to 'password123'...");
  const { data: updateData, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
    'e8d53dfa-d5a9-49e2-9543-1fbed7befbb1',
    { password: 'password123' }
  );

  if (updateErr) {
    console.error("Password reset failed:", updateErr.message);
    return;
  }
  console.log("Password reset successful!");

  console.log("\nLogging in as student affan@gmail.com...");
  const { data: sessionData, error: logErr } = await supabaseAnon.auth.signInWithPassword({
    email: 'affan@gmail.com',
    password: 'password123'
  });

  if (logErr) {
    console.error("Login failed:", logErr.message);
    return;
  }

  const user = sessionData.user;
  console.log("Logged in user id (auth.uid()):", user.id);

  console.log("\n1. Testing getUserRegistrations select query as student...");
  const { data: listData, error: listErr } = await supabaseAnon
    .from("registrations")
    .select(
      `*, 
      events(id, title, start_date, end_date, venue, poster_url, registration_fee, status),
      profiles!registrations_user_id_fkey(full_name, email, phone, department, year, profile_picture),
      teams(id, team_name)`
    )
    .eq("user_id", user.id);

  console.log("getUserRegistrations result count:", listData?.length);
  console.log("getUserRegistrations error:", listErr);
  if (listData && listData.length > 0) {
    console.log("First item:", JSON.stringify(listData[0]));
  }

  console.log("\n2. Testing getRegistrationById select query as student...");
  const { data: itemData, error: itemErr } = await supabaseAnon
    .from("registrations")
    .select(
      `*, 
      events(*),
      profiles!registrations_user_id_fkey(*),
      teams(*, team_members(*, profiles(*)))`
    )
    .eq("id", "15c54d81-66dd-4303-9961-1f7895172e9d")
    .single();

  console.log("getRegistrationById result:", itemData);
  console.log("getRegistrationById error:", itemErr);
}

runTest();
