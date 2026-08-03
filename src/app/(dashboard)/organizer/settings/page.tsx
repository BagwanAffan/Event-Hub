'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { profileService } from '@/services/profile-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Laptop, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await profileService.changePassword(newPassword);
      toast.success('Password updated successfully! 🔒');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
          Organizer Settings
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Customize display appearance and update your security credentials
        </p>
      </div>

      {/* 1. APPEARANCE SECTION */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <Sun className="h-5 w-5 text-[#007C46]" /> Appearance
          </CardTitle>
          <CardDescription className="text-xs">
            Choose your preferred theme mode for the EventHub organizer workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                theme === 'light'
                  ? 'border-[#007C46] bg-[#edfcf6]/40 dark:bg-teal-950/20 text-[#01424E] dark:text-teal-100 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Sun className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold">Light</span>
              {theme === 'light' && <CheckCircle2 className="h-4 w-4 text-[#007C46]" />}
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'border-[#007C46] bg-[#edfcf6]/40 dark:bg-teal-950/20 text-[#01424E] dark:text-teal-100 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-full bg-slate-900 text-slate-100 dark:bg-slate-800">
                <Moon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold">Dark</span>
              {theme === 'dark' && <CheckCircle2 className="h-4 w-4 text-[#007C46]" />}
            </button>

            {/* System Default */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                theme === 'system'
                  ? 'border-[#007C46] bg-[#edfcf6]/40 dark:bg-teal-950/20 text-[#01424E] dark:text-teal-100 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Laptop className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold">System</span>
              {theme === 'system' && <CheckCircle2 className="h-4 w-4 text-[#007C46]" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 2. SECURITY SECTION */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#007C46]" /> Security & Password
          </CardTitle>
          <CardDescription className="text-xs">
            Update your account password using secure Supabase authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-xs h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={savingPassword}
              className="bg-[#007C46] hover:bg-[#006036] text-white font-bold text-xs h-10 px-6"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {savingPassword ? 'Updating Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
