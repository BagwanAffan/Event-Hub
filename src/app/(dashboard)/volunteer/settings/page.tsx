'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { profileService } from '@/services/profile-service';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Moon, Sun, User, Palette, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const accountSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
  college: z.string().optional(),
});

const securitySchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

export default function VolunteerSettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Account form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [college, setCollege] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Security form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDepartment(profile.department || '');
      setYear(profile.year || '');
      setCollege(profile.college || '');
    }
  }, [profile]);

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const validation = accountSchema.safeParse({
      fullName,
      phone,
      department,
      year,
      college,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Validation error';
      toast.error(firstError);
      return;
    }

    try {
      setSavingAccount(true);
      await profileService.updateProfile(profile.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        year: year.trim() || undefined,
        college: college.trim() || undefined,
      });
      await refreshProfile();
      toast.success('Account information updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account information');
    } finally {
      setSavingAccount(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = securitySchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Validation error';
      toast.error(firstError);
      return;
    }

    try {
      setSavingSecurity(true);
      await profileService.changePassword(newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage your account details, appearance preferences, and security options"
      />

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full md:w-[480px] grid-cols-3">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>
        
        {/* Account Tab */}
        <TabsContent value="account" className="mt-6">
          <Card>
            <form onSubmit={handleAccountSave}>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  Update your personal details and academic information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Full Name</Label>
                  <Input
                    id="account-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-phone">Phone Number</Label>
                  <Input
                    id="account-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-department">Department</Label>
                    <Input
                      id="account-department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Engineering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-year">Year of Study</Label>
                    <Input
                      id="account-year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 3rd Year"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-college">College / Organization</Label>
                  <Input
                    id="account-college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Main Campus University"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="bg-[#01424E] hover:bg-[#007C46] text-white dark:bg-[#7CEAAB] dark:text-[#01424E]"
                  disabled={savingAccount}
                >
                  {savingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>
                Customize how EventHub looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mounted && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`border-2 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${theme === 'light' ? 'border-[#007C46] bg-[#007C46]/5 dark:border-[#7CEAAB]' : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB]'}`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Sun className="h-6 w-6 text-orange-500" />
                    </div>
                    <span className="font-medium">Light</span>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${theme === 'dark' ? 'border-[#007C46] bg-[#007C46]/5 dark:border-[#7CEAAB]' : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB]'}`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="p-3 bg-slate-900 rounded-full shadow-sm">
                      <Moon className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="font-medium">Dark</span>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${theme === 'system' ? 'border-[#007C46] bg-[#007C46]/5 dark:border-[#7CEAAB]' : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB]'}`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm">
                      <Monitor className="h-6 w-6 text-slate-500" />
                    </div>
                    <span className="font-medium">System</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <form onSubmit={handlePasswordSave}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="bg-[#01424E] hover:bg-[#007C46] text-white dark:bg-[#7CEAAB] dark:text-[#01424E]"
                  disabled={savingSecurity}
                >
                  {savingSecurity ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
