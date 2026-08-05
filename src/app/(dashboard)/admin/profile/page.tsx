'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { profileService } from '@/services/profile-service';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, Mail, Phone, Building, Edit2, Upload, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');

  const supabase = createClient();

  // Keep form state synced with profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setCollege(profile.college || '');
    }
  }, [profile]);

  const handleOpenDialog = (open: boolean) => {
    if (open && profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setCollege(profile.college || '');
    }
    setIsEditOpen(open);
  };

  if (!profile) return null;

  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Name validation
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      toast.error('Name must be at least 3 characters long');
      return;
    }

    // 2. Email validation
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // 3. Phone validation
    const trimmedPhone = phone.trim();
    const digitsOnlyPhone = trimmedPhone.replace(/\D/g, '');
    if (digitsOnlyPhone.length < 7 || digitsOnlyPhone.length > 15) {
      toast.error('Please enter a valid phone number (10 digits)');
      return;
    }

    // 4. College validation
    const trimmedCollege = college.trim();
    if (!trimmedCollege) {
      toast.error('College is required');
      return;
    }

    setSaving(true);
    try {
      // If email was changed, update auth user email
      if (trimmedEmail !== profile.email) {
        try {
          await supabase.auth.updateUser({ email: trimmedEmail });
        } catch (authErr) {
          console.warn('[AdminProfile] Auth email update note:', authErr);
        }
      }

      // Update profile in database (with graceful fallback if email column is restricted)
      const updateData: Record<string, any> = {
        full_name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        college: trimmedCollege,
        updated_at: new Date().toISOString(),
      };

      try {
        await profileService.updateProfile(profile.id, updateData);
      } catch (dbErr) {
        console.warn('[AdminProfile] Primary update failed, retrying without email key:', dbErr);
        delete updateData.email;
        await profileService.updateProfile(profile.id, updateData);
      }

      await refreshProfile();
      toast.success('Profile updated successfully.');
      setIsEditOpen(false);
    } catch (error: any) {
      console.error('Error updating admin profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      setUploading(true);
      await profileService.uploadProfilePicture(profile.id, file);
      await refreshProfile();
      toast.success('Profile picture updated successfully.');
    } catch (err: any) {
      console.error('Failed to upload picture:', err);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
            Admin Profile
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            System administrator details and account profile
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog(true)}
          className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-10 px-5 inline-flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Edit2 className="h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Large Profile Avatar Card */}
        <Card className="md:col-span-1 border-2 border-[#01424E]/10 shadow-sm">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-slate-50 dark:border-slate-800 shadow-md">
                <AvatarImage src={profile.profile_picture || ''} />
                <AvatarFallback className="text-4xl bg-[#7CEAAB]/20 text-[#01424E] font-extrabold">{initials}</AvatarFallback>
              </Avatar>

              {/* Upload Button Overlay */}
              <Label
                htmlFor="admin-avatar-upload"
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#01424E] text-white shadow hover:bg-[#007C46] transition-colors"
                title="Upload Profile Picture"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin text-[#7CEAAB]" /> : <Upload className="h-4 w-4 text-[#7CEAAB]" />}
                <span className="sr-only">Upload picture</span>
              </Label>
              <Input
                id="admin-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
                disabled={uploading}
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-[#01424E] dark:text-white">{profile.full_name || 'Admin User'}</h2>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>

            <Badge className="bg-[#01424E] text-[#7CEAAB] px-3.5 py-1 uppercase tracking-widest text-[10px] font-extrabold shadow-xs">
              <ShieldCheck className="w-3 h-3 mr-1 text-[#7CEAAB]" /> ADMIN
            </Badge>
          </CardContent>
        </Card>

        {/* Personal Information Card (ONLY 4 fields) */}
        <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <User className="h-5 w-5 text-[#007C46]" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoField icon={<User />} label="Full Name" value={profile.full_name || 'Not provided'} />
            <InfoField icon={<Mail />} label="Email Address" value={profile.email || 'Not provided'} />
            <InfoField icon={<Phone />} label="Phone Number" value={profile.phone || 'Not provided'} />
            <InfoField icon={<Building />} label="College" value={profile.college || 'Not provided'} />
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={handleOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#01424E] dark:text-teal-100 font-bold text-lg flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[#007C46]" /> Edit Admin Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="admin-fullName" className="text-xs font-semibold">Full Name *</Label>
              <Input
                id="admin-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                required
                className="text-xs h-10"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-xs font-semibold">Email Address *</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eventhub.edu"
                required
                className="text-xs h-10"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-phone" className="text-xs font-semibold">Phone Number *</Label>
              <Input
                id="admin-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="7972837812"
                maxLength={15}
                required
                className="text-xs h-10"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-college" className="text-xs font-semibold">College *</Label>
              <Input
                id="admin-college"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Enter college or university name"
                required
                className="text-xs h-10"
                autoComplete="off"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="text-xs font-bold rounded-xl h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-10 px-5 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#7CEAAB]" /> Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#007C46] mt-0.5 shrink-0">
        <div className="h-4 w-4">{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-sm text-[#01424E] dark:text-teal-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
