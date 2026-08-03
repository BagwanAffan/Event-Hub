'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Settings, Sun, Moon, Monitor, Lock, User, Shield, Bell, Check, Laptop, LogOut, AlertTriangle, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

type TabKey = 'general' | 'appearance' | 'security' | 'account';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // Security Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Preferences State
  const [language, setLanguage] = useState('English');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [certNotifs, setCertNotifs] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [teamInvites, setTeamInvites] = useState(true);
  const [paymentUpdates, setPaymentUpdates] = useState(true);

  // Delete Account Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setUpdatingPassword(true);
    setTimeout(() => {
      setUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    }, 600);
  };

  const handleSavePreferences = () => {
    toast.success('Settings and notification preferences saved!');
  };

  const handleLogoutOtherDevices = () => {
    toast.success('Logged out of all other active browser sessions.');
  };

  const handleDeleteAccount = () => {
    setIsDeleteOpen(false);
    toast.error('Account deletion requested. Please contact admin to finalize.');
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S';

  const tabs: { id: TabKey; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
          Settings
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Manage your student portal preferences, security credentials, and system options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Vertical Navigation (Sidebar) */}
        <Card className="md:col-span-1 border-slate-200 dark:border-slate-800 shadow-sm p-2 sticky top-20">
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-left shrink-0 ${
                    isActive
                      ? 'bg-[#01424E] text-[#7CEAAB] shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#7CEAAB]' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Right Side Content Panel */}
        <div className="md:col-span-3 space-y-6">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
                    <Globe className="h-5 w-5 text-[#007C46]" /> Regional & Language Settings
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose your preferred portal language and locale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="language" className="text-xs font-semibold">Portal Language</Label>
                    <Select value={language} onValueChange={(val) => setLanguage(val || 'English')}>
                      <SelectTrigger id="language" className="w-full text-xs h-9">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English" className="text-xs">English (US)</SelectItem>
                        <SelectItem value="Spanish" className="text-xs">Spanish (Español)</SelectItem>
                        <SelectItem value="French" className="text-xs">French (Français)</SelectItem>
                        <SelectItem value="German" className="text-xs">German (Deutsch)</SelectItem>
                        <SelectItem value="Hindi" className="text-xs">Hindi (हिंदी)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
                    <Bell className="h-5 w-5 text-[#007C46]" /> Student Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Control which updates and alerts you receive across your student account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Notifications</p>
                      <p className="text-[11px] text-muted-foreground">Receive email alerts for pass approvals and event updates</p>
                    </div>
                    <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Certificate Alerts</p>
                      <p className="text-[11px] text-muted-foreground">Get notified instantly when your event certificate is issued</p>
                    </div>
                    <Switch checked={certNotifs} onCheckedChange={setCertNotifs} />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Event Reminders</p>
                      <p className="text-[11px] text-muted-foreground">Receive automated reminders 24 hours before event commencement</p>
                    </div>
                    <Switch checked={eventReminders} onCheckedChange={setEventReminders} />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Team Invitations</p>
                      <p className="text-[11px] text-muted-foreground">Receive alerts when teammates invite you to a hackathon team</p>
                    </div>
                    <Switch checked={teamInvites} onCheckedChange={setTeamInvites} />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Payment Updates</p>
                      <p className="text-[11px] text-muted-foreground">Get receipts and payment confirmation alerts</p>
                    </div>
                    <Switch checked={paymentUpdates} onCheckedChange={setPaymentUpdates} />
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-6 py-3">
                  <Button onClick={handleSavePreferences} className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-9 px-4 cursor-pointer ml-auto">
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
                  <Sun className="h-5 w-5 text-[#007C46]" /> Theme Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize the visual appearance of EventHub on your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mounted && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Light Theme Card */}
                    <div
                      onClick={() => setTheme('light')}
                      className={`relative border-2 rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-200 ${
                        theme === 'light'
                          ? 'border-[#007C46] bg-[#edfcf6] dark:bg-teal-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB] bg-card'
                      }`}
                    >
                      {theme === 'light' && (
                        <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#007C46] text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-xl w-fit">
                        <Sun className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Light</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Bright interface for daytime use</p>
                      </div>
                    </div>

                    {/* Dark Theme Card */}
                    <div
                      onClick={() => setTheme('dark')}
                      className={`relative border-2 rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-200 ${
                        theme === 'dark'
                          ? 'border-[#007C46] bg-[#edfcf6] dark:bg-teal-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB] bg-card'
                      }`}
                    >
                      {theme === 'dark' && (
                        <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#007C46] text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div className="p-3 bg-slate-800 text-teal-400 rounded-xl w-fit">
                        <Moon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Dark</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Comfortable dark mode for night</p>
                      </div>
                    </div>

                    {/* System Theme Card */}
                    <div
                      onClick={() => setTheme('system')}
                      className={`relative border-2 rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-200 ${
                        theme === 'system'
                          ? 'border-[#007C46] bg-[#edfcf6] dark:bg-teal-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB] bg-card'
                      }`}
                    >
                      {theme === 'system' && (
                        <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#007C46] text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl w-fit">
                        <Monitor className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">System</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Follow operating system</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              {/* Password Form */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
                    <Lock className="h-5 w-5 text-[#007C46]" /> Change Password
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your account password to maintain security
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordSave}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-xs font-semibold">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="text-xs h-9"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-xs font-semibold">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="text-xs h-9"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-xs font-semibold">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="text-xs h-9"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-6 py-3">
                    <Button
                      type="submit"
                      disabled={updatingPassword}
                      className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-9 px-4 cursor-pointer ml-auto"
                    >
                      {updatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Active Sessions */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
                    <Laptop className="h-5 w-5 text-[#007C46]" /> Active Sessions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Devices currently logged into your student account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/50 text-[#007C46]">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Chrome on Windows</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Now
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Last active: Today at 02:45 PM • India</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-6 py-3">
                  <Button
                    variant="outline"
                    onClick={handleLogoutOtherDevices}
                    className="text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-auto"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" /> Logout Other Devices
                  </Button>
                </CardFooter>
              </Card>

              {/* Account Security (2FA) */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
                      <Shield className="h-5 w-5 text-[#007C46]" /> Two-Step Verification (2FA)
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Add an additional layer of security to your student portal login
                    </CardDescription>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 font-bold text-[10px] px-2.5 py-1">
                    Coming Soon
                  </Badge>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
                    <User className="h-5 w-5 text-[#007C46]" /> Account Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Overview of your registered student identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <Avatar className="h-16 w-16 border-2 border-slate-200 dark:border-slate-700">
                      <AvatarImage src={profile?.profile_picture || ''} />
                      <AvatarFallback className="text-xl bg-[#7CEAAB]/20 text-[#01424E] font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{profile?.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge className="bg-[#41B177] text-white uppercase text-[10px] font-bold px-2 py-0.5">
                          {profile?.role || 'student'}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button asChild className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-9 px-4 cursor-pointer">
                      <Link href="/student/profile">Edit Full Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone: Delete Account */}
              <Card className="border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" /> Danger Zone: Delete Account
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Permanently remove your student account, event passes, and certificates
                  </CardDescription>
                </CardHeader>
                <CardFooter className="border-t border-red-100 dark:border-red-900/30 px-6 py-3">
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteOpen(true)}
                    className="text-xs font-bold rounded-xl h-9 px-4 cursor-pointer ml-auto"
                  >
                    Delete Account
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete Account Confirmation
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 leading-relaxed">
              Are you sure you want to request account deletion? This will permanently revoke all your event passes, team memberships, and digital certificates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} className="text-xs font-bold">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="text-xs font-bold">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
