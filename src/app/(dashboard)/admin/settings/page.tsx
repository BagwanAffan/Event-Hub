'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, KeyRound, ShieldCheck, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { profile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Admin password updated successfully! 🔒');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Administrator Settings</h1>
          <p className="text-muted-foreground text-sm">Security credentials, system access, and administrative settings</p>
        </div>
        <Badge className="bg-[#01424E] text-[#7CEAAB] font-bold">SYSTEM CONTROL</Badge>
      </div>

      {/* Account Info Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#007C46]" /> Active Admin Account
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Admin Name:</span>
            <span className="font-bold text-[#01424E] dark:text-teal-100">{profile?.full_name || 'System Administrator'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Admin Email:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{profile?.email || 'admin@eventhub.edu'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Role Clearance:</span>
            <Badge className="bg-[#007C46] text-white capitalize font-bold text-[10px]">Super Administrator</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#007C46]" /> Change Administrator Password
          </CardTitle>
          <CardDescription className="text-xs">Update your credentials using official Supabase Authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Current Password</Label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">New Password *</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Confirm New Password *</Label>
              <Input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Credentials...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
