'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { teamService } from '@/services/team-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Shield, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

import { checkProfileCompletion } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';

export default function TeamsPage() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;
      if (loadedRef.current === profile.id) return;
      loadedRef.current = profile.id;
      try {
        setLoading(true);
        const data = await teamService.getUserTeams(profile.id);
        setTeams(data || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile?.id]);

  const handleJoinTeam = async () => {
    if (!profile?.id || !inviteCode.trim()) return;

    const completion = checkProfileCompletion(profile);
    if (!completion.isComplete) {
      setMissingFields(completion.missingFields.filter(f => !f.includes('Recommended')));
      setGuardOpen(true);
      return;
    }
    
    try {
      setJoining(true);
      await teamService.joinTeamByCode(inviteCode.trim(), profile.id);
      toast.success('Successfully joined team!');
      setInviteCode('');
      // Reload teams
      const data = await teamService.getUserTeams(profile.id);
      setTeams(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  const copyInviteCode = (code: string, teamId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(teamId);
    toast.success('Invite code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
          My Teams
        </h1>
        <p className="text-muted-foreground">
          Manage your team registrations and memberships
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => {
                const isLeader = team.leader_id === profile?.id;
                return (
                  <Card key={team.id} className="hover:shadow-md transition-shadow flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-xl text-[#01424E] dark:text-white flex items-center gap-2">
                            {team.name || team.team_name}
                            {isLeader && <Shield className="h-4 w-4 text-[#41B177]" />}
                          </CardTitle>
                          <p className="text-sm font-medium text-muted-foreground">{team.event?.title}</p>
                        </div>
                        <Badge variant={team.status === 'APPROVED' ? 'default' : 'outline'} className={team.status === 'APPROVED' ? 'bg-[#41B177]' : ''}>
                          {team.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Users className="h-4 w-4" />
                        <span>{team.members?.length || 0} / {team.event?.max_team_size || 'N/A'} Members</span>
                      </div>
                      
                      {isLeader && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-3 border flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Invite Code</p>
                            <p className="font-mono text-sm font-bold tracking-wider">{team.invite_code}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => copyInviteCode(team.invite_code, team.id)}>
                            {copiedId === team.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="outline" className="w-full">View Details</Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center text-center p-6">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No teams yet</h3>
              <p className="text-muted-foreground max-w-sm">
                You are not part of any teams. Join a team using an invite code or create one during event registration.
              </p>
            </Card>
          )}
        </div>

        <div>
          <Card className="border-2 border-[#01424E]/10 sticky top-20">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#007C46]" /> Join a Team
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the invite code provided by the team leader to join their team.
              </p>
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input 
                  id="invite-code" 
                  placeholder="e.g. TEAM-A1B2C3" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase tracking-wider"
                />
              </div>
              <Button 
                className="w-full bg-[#01424E] hover:bg-[#007C46]" 
                disabled={!inviteCode.trim() || joining}
                onClick={handleJoinTeam}
              >
                {joining ? 'Joining...' : 'Join Team'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProfileGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
        actionName="join or create teams"
        userRole={profile?.role || 'student'}
      />
    </div>
  );
}
