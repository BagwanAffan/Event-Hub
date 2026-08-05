import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import type { Team, TeamMember } from "@/types/database.types";

const supabase = createClient();

export const teamService = {
  async createTeam(eventId: string, leaderId: string, teamName: string) {
    const { data, error } = await supabase
      .from("teams")
      .insert({
        event_id: eventId,
        leader_id: leaderId,
        team_name: teamName,
      })
      .select()
      .single();

    if (error) throw error;

    // Add leader as a team member
    await supabase.from("team_members").insert({
      team_id: data.id,
      user_id: leaderId,
      status: "accepted",
      joined_at: new Date().toISOString(),
    });

    dataSync.notify("registrations", "events");
    return data as Team;
  },

  async getTeamById(id: string) {
    const { data, error } = await supabase
      .from("teams")
      .select(
        `*, 
        team_members(*, profiles(*)),
        events(id, title, max_team_size, start_date, venue),
        profiles!teams_leader_id_fkey(full_name, email)`
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserTeams(userId: string) {
    const { data, error } = await supabase
      .from("team_members")
      .select(
        `*, 
        teams(*, events(id, title, start_date, venue, status), profiles!teams_leader_id_fkey(full_name))`
      )
      .eq("user_id", userId)
      .in("status", ["accepted", "invited"])
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async joinTeamByCode(inviteCode: string, userId: string) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*, events(max_team_size)")
      .eq("invite_code", inviteCode)
      .single();

    if (teamError || !team) {
      throw new Error("Invalid invite code");
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("user_id", userId)
      .single();

    if (existing) {
      throw new Error("You are already a member of this team");
    }

    // Check team size
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id)
      .eq("status", "accepted");

    const maxSize = (team.events as unknown as { max_team_size: number })?.max_team_size || 4;
    if ((count || 0) >= maxSize) {
      throw new Error("Team is already full");
    }

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        user_id: userId,
        status: "accepted",
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    dataSync.notify("registrations", "events");
    return data as TeamMember;
  },

  async removeMember(teamId: string, userId: string) {
    const { error } = await supabase
      .from("team_members")
      .update({ status: "removed" })
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) throw error;
    dataSync.notify("registrations", "events");
  },

  async leaveTeam(teamId: string, userId: string) {
    // Check if user is the leader
    const { data: team } = await supabase
      .from("teams")
      .select("leader_id")
      .eq("id", teamId)
      .single();

    if (team?.leader_id === userId) {
      throw new Error("Team leader cannot leave. Transfer leadership or delete the team.");
    }

    const { error } = await supabase
      .from("team_members")
      .update({ status: "removed" })
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) throw error;
    dataSync.notify("registrations", "events");
  },
};
