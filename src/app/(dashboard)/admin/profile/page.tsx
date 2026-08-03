'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, ShieldCheck, KeyRound, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [profilePicture, setProfilePicture] = useState(profile?.profile_picture || '');
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          profile_picture: profilePicture || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      await refreshProfile();
      toast.success('Admin profile updated successfully! 👤');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update admin profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Administrator Profile</h1>
          <p className="text-muted-foreground text-sm">Personal details, profile photo, and system clearance</p>
        </div>
        <Badge className="bg-[#01424E] text-[#7CEAAB] font-bold">SUPER ADMIN</Badge>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <User className="h-5 w-5 text-[#007C46]" /> Edit Admin Account Profile
          </CardTitle>
          <CardDescription className="text-xs">Update your display credentials shown on admin audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border">
              <Avatar className="h-16 w-16 border-2 border-[#007C46]">
                <AvatarImage src={profilePicture || ''} />
                <AvatarFallback className="bg-[#01424E] text-[#7CEAAB] font-bold text-xl">
                  {fullName?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <Label className="text-xs font-semibold">Profile Photo URL</Label>
                <Input
                  placeholder="https://..."
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="System Administrator"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Admin Email (Read-Only)</Label>
                <Input
                  value={profile?.email || 'admin@eventhub.edu'}
                  disabled
                  className="text-xs bg-slate-100 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Contact Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="text-xs"
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Profile Details
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
