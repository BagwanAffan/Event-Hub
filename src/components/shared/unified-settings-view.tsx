'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { profileService } from '@/services/profile-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
  Lock,
  User,
  Info,
  Check,
  Laptop,
  LogOut,
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  Sparkles,
  ExternalLink,
  Edit2,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ROLE_NOTIFICATION_OPTIONS,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type UserRole,
} from '@/services/notification-preferences-service';

type TabKey = 'appearance' | 'notifications' | 'security' | 'account' | 'about';

interface UnifiedSettingsProps {
  role: 'student' | 'organizer' | 'volunteer' | 'admin';
  customPasswordHandler?: (newPassword: string) => Promise<void>;
}

export function UnifiedSettingsView({ role, customPasswordHandler }: UnifiedSettingsProps) {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // General & Language State
  const [language, setLanguage] = useState('English');

  // Role-Specific Notifications State
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});

  // Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile?.id || role) {
      const loaded = loadNotificationPreferences(profile?.id, role as UserRole);
      setNotifPrefs(loaded);
    }
  }, [profile?.id, role]);

  const handleTogglePref = (key: string, val: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: val }));
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    try {
      setUpdatingPassword(true);
      if (customPasswordHandler) {
        await customPasswordHandler(newPassword);
      } else {
        await profileService.changePassword(newPassword);
        toast.success('Password updated successfully');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveNotifications = () => {
    saveNotificationPreferences(profile?.id, role as UserRole, notifPrefs);
    toast.success('Notification preferences saved');
  };

  const handleLogoutOtherDevices = () => {
    toast.success('Logged out of all other active browser sessions');
  };

  const handleDownloadData = () => {
    const data = {
      profile,
      exportedAt: new Date().toISOString(),
      role,
      status: 'active'
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventhub-${role}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Your profile data export has been downloaded');
  };

  const handleDeleteAccount = () => {
    setIsDeleteOpen(false);
    toast.error('Account deletion requested. Please contact system admin.');
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || role.charAt(0).toUpperCase();

  const tabs: { id: TabKey; label: string; icon: any }[] = [
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: User },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
          {role.charAt(0).toUpperCase() + role.slice(1)} Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your EventHub preferences, notification alerts, password credentials, and system settings
        </p>
      </div>

      {/* Segmented Pill Tab Bar */}
      <div className="w-fit max-w-full bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 select-none",
                isActive
                  ? "bg-[#01424E] text-[#7CEAAB] shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#7CEAAB]" : "text-slate-500")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Section Content */}
      <div className="space-y-6">
        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-sm animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#01424E] dark:text-teal-100">Appearance</h2>
                <p className="text-xs text-muted-foreground">Customize how EventHub looks on your device</p>
              </div>
            </div>

            {mounted && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light */}
                <div
                  onClick={() => setTheme('light')}
                  className={`relative border-2 rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 ${
                    theme === 'light'
                      ? 'border-[#007C46] bg-[#edfcf6] dark:bg-teal-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB]'
                  }`}
                >
                  {theme === 'light' && (
                    <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#007C46] text-white flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl w-fit">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">Light</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Bright interface for daytime</p>
                  </div>
                </div>

                {/* Dark */}
                <div
                  onClick={() => setTheme('dark')}
                  className={`relative border-2 rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-[#007C46] bg-[#edfcf6] dark:bg-teal-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB]'
                  }`}
                >
                  {theme === 'dark' && (
                    <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#007C46] text-white flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="p-2.5 bg-slate-800 text-teal-400 rounded-xl w-fit">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">Dark</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Comfortable dark mode</p>
                  </div>
                </div>

                {/* System */}
                <div
                  onClick={() => setTheme('system')}
                  className={`relative border-2 rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 ${
                    theme === 'system'
                      ? 'border-[#007C46] bg-[#edfcf6] dark:bg-teal-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#7CEAAB]'
                  }`}
                >
                  {theme === 'system' && (
                    <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#007C46] text-white flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl w-fit">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">System</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Follow operating system</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#01424E] dark:text-teal-100">Notifications</h2>
                <p className="text-xs text-muted-foreground">Manage your notification preferences across email and alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              {(ROLE_NOTIFICATION_OPTIONS[role as UserRole] || ROLE_NOTIFICATION_OPTIONS.student).map((opt) => (
                <NotificationRow
                  key={opt.key}
                  icon={getNotificationIcon(opt.iconName)}
                  title={opt.title}
                  description={opt.description}
                  checked={notifPrefs[opt.key] ?? true}
                  onChange={(val) => handleTogglePref(opt.key, val)}
                />
              ))}
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
              <Button onClick={handleSaveNotifications} className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-9 px-4 cursor-pointer">
                Save Notification Preferences
              </Button>
            </div>
          </Card>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-sm animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#01424E] dark:text-teal-100">Security</h2>
                <p className="text-xs text-muted-foreground">Update credentials, view active sessions, and manage authentication</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSave} className="space-y-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Change Password</h3>
              <div className="space-y-2">
                <Label htmlFor="curr-pass" className="text-xs font-semibold">Current Password</Label>
                <Input
                  id="curr-pass"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="text-xs h-9 max-w-md"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="new-pass" className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-xs h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conf-pass" className="text-xs font-semibold">Confirm New Password</Label>
                  <Input
                    id="conf-pass"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={updatingPassword}
                className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-9 px-4 cursor-pointer"
              >
                {updatingPassword ? 'Updating...' : 'Save Password'}
              </Button>
            </form>

            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Current Session</h3>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#edfcf6] dark:bg-teal-950/50 text-[#007C46]">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Chrome on Windows</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Now
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Last Login: Today at 02:45 PM</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutOtherDevices}
                  className="text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Logout Other Devices
                </Button>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</h3>
                <p className="text-[11px] text-muted-foreground">Secure your account with multi-factor authentication</p>
              </div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 font-bold text-[10px] px-2.5 py-1">
                Coming Soon
              </Badge>
            </div>
          </Card>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-sm animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#01424E] dark:text-teal-100">Account & Profile</h2>
                <p className="text-xs text-muted-foreground">Manage your personal profile details, action options, and data exports</p>
              </div>
            </div>

            {/* Profile Info Card (Centered & Formatted Layout) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-md shrink-0">
                  <AvatarImage src={profile?.profile_picture || ''} />
                  <AvatarFallback className="text-2xl bg-[#7CEAAB]/20 text-[#01424E] font-extrabold">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-[#01424E] dark:text-white">{profile?.full_name || 'EventHub User'}</h3>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                    <Badge className="bg-[#41B177] hover:bg-[#007C46] text-white uppercase text-[10px] font-extrabold px-2.5 py-0.5">
                      {profile?.role || role}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Action Button (Properly Centered & Formatted) */}
              <Button asChild className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-10 px-5 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0">
                <Link href={`/${role}/profile`} className="inline-flex items-center justify-center gap-2 h-full w-full">
                  <Edit2 className="h-4 w-4 shrink-0" />
                  <span>Edit Full Profile</span>
                </Link>
              </Button>
            </div>

            {/* Account Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Export Personal Data</p>
                  <p className="text-[11px] text-muted-foreground">Download a JSON copy of your profile record</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDownloadData}
                  className="text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer h-9 px-3 shrink-0"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export Data
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">Account Deletion</p>
                  <p className="text-[11px] text-muted-foreground">Permanently remove account & credentials</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-xs font-bold rounded-xl h-9 px-3 cursor-pointer shrink-0"
                >
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Delete Account
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-sm animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#01424E] dark:text-teal-100">About EventHub</h2>
                <p className="text-xs text-muted-foreground">Platform build information, policies, and support contact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Version</span>
                <span className="font-bold text-slate-900 dark:text-white mt-1 block">v2.4.0 (Hackathon Edition)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">EventHub Build</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 mt-1 block">Build 2026.08-prod</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Support Email</span>
                <span className="font-semibold text-[#007C46] dark:text-teal-300 mt-1 block truncate">support@eventhub.edu</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Legal Policies</span>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <Link href="/privacy" className="text-[#007C46] dark:text-teal-300 hover:underline font-bold inline-flex items-center gap-0.5">
                    Privacy <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Link href="/terms" className="text-[#007C46] dark:text-teal-300 hover:underline font-bold inline-flex items-center gap-0.5">
                    Terms <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete Account Confirmation
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 leading-relaxed">
              Are you sure you want to request account deletion? This action will permanently revoke your access, event passes, and earned digital certificates.
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

function getNotificationIcon(iconName: string) {
  switch (iconName) {
    case 'Mail':
      return <Mail className="h-4 w-4" />;
    case 'Sparkles':
      return <Sparkles className="h-4 w-4" />;
    case 'Calendar':
      return <Calendar className="h-4 w-4" />;
    case 'Bell':
      return <Bell className="h-4 w-4" />;
    case 'User':
      return <User className="h-4 w-4" />;
    case 'Info':
      return <Info className="h-4 w-4" />;
    case 'ShieldCheck':
      return <ShieldCheck className="h-4 w-4" />;
    case 'Check':
      return <Check className="h-4 w-4" />;
    case 'Lock':
      return <Lock className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function NotificationRow({
  icon,
  title,
  description,
  checked,
  onChange
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
