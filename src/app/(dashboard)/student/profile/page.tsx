'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, Building, BookOpen, Calendar, Edit2, Activity, Award, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { profileService } from '@/services/profile-service';
import { notificationService } from '@/services/notification-service';
import { checkProfileCompletion } from '@/hooks/use-profile-completion';
import { toast } from 'sonner';

const PREDEFINED_DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science',
  'Computer Science',
  'Electrical Engineering',
  'Chemical Engineering',
  'Production Engineering',
  'Instrumentation Engineering',
];

const PREDEFINED_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Final Year',
];

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedDept, setSelectedDept] = useState<string>('');
  const [customDept, setCustomDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [customYear, setCustomYear] = useState<string>('');

  if (!profile) return null;

  const completion = checkProfileCompletion(profile);
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const handleOpenDialog = (open: boolean) => {
    if (open && profile) {
      const currentDept = profile.department || '';
      if (PREDEFINED_DEPARTMENTS.includes(currentDept)) {
        setSelectedDept(currentDept);
        setCustomDept('');
      } else if (currentDept) {
        setSelectedDept('Other');
        setCustomDept(currentDept);
      } else {
        setSelectedDept('');
        setCustomDept('');
      }

      const currentYear = profile.year || '';
      if (PREDEFINED_YEARS.includes(currentYear)) {
        setSelectedYear(currentYear);
        setCustomYear('');
      } else if (currentYear) {
        setSelectedYear('Other');
        setCustomYear(currentYear);
      } else {
        setSelectedYear('');
        setCustomYear('');
      }
    }
    setIsEditOpen(open);
  };

  const handleSaveProfile = async (form: HTMLFormElement) => {
    const finalDept = selectedDept === 'Other' ? customDept.trim() : selectedDept;
    const finalYear = selectedYear === 'Other' ? customYear.trim() : selectedYear;

    if (!finalDept) {
      toast.error('Please select or enter your department');
      return;
    }
    if (!finalYear) {
      toast.error('Please select or enter your year of study');
      return;
    }

    setSaving(true);
    try {
      await profileService.updateProfile(profile.id, {
        full_name: (form.elements.namedItem('fullName') as HTMLInputElement).value,
        phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
        department: finalDept,
        year: finalYear,
      });
      await refreshProfile();
      const reloaded = await profileService.getProfile(profile.id);
      const after = checkProfileCompletion(reloaded);
      try {
        await notificationService.syncProfileReminder(reloaded);
      } catch (syncErr) {
        console.warn('Profile reminder sync failed:', syncErr);
      }
      if (after.isComplete) {
        toast.success('Profile complete! Reminder removed.');
      } else {
        toast.success('Profile updated. Add ' + after.missingFields.join(', ') + ' to complete your profile.');
      }
      setIsEditOpen(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      setUploading(true);
      await profileService.uploadProfilePicture(profile.id, file);
      await refreshProfile();
      const reloaded = await profileService.getProfile(profile.id);
      try {
        await notificationService.syncProfileReminder(reloaded);
      } catch (syncErr) {
        console.warn('Profile reminder sync failed:', syncErr);
      }
      toast.success('Profile picture uploaded');
    } catch (err) {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information
          </p>
          {!completion.isComplete && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              Missing: {completion.missingFields.join(', ')}
            </p>
          )}
        </div>
        <Dialog open={isEditOpen} onOpenChange={handleOpenDialog}>
          <DialogTrigger
            render={
              <Button className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl h-10 px-4 flex items-center gap-2 cursor-pointer shadow-sm">
                <Edit2 className="h-4 w-4" /> Edit Profile
              </Button>
            }
          />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#01424E] dark:text-teal-100 font-bold">Edit Profile Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <form
                className="space-y-4"
                autoComplete="off"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSaveProfile(e.target as HTMLFormElement);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-semibold">Full Name</Label>
                  <Input id="fullName" name="fullName" defaultValue={profile.full_name} required autoComplete="off" className="text-xs" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                  <Input id="phone" name="phone" defaultValue={profile.phone || ''} required autoComplete="off" className="text-xs" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department-select" className="text-xs font-semibold">Department</Label>
                  <Select value={selectedDept} onValueChange={(val) => setSelectedDept(val || '')}>
                    <SelectTrigger id="department-select" className="w-full text-xs h-9">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-xs">
                          {dept}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other" className="text-xs font-bold">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedDept === 'Other' && (
                    <Input
                      placeholder="Enter your department"
                      value={customDept}
                      onChange={(e) => setCustomDept(e.target.value)}
                      className="mt-2 text-xs"
                      autoComplete="off"
                      required
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year-select" className="text-xs font-semibold">Year of Study</Label>
                  <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val || '')}>
                    <SelectTrigger id="year-select" className="w-full text-xs h-9">
                      <SelectValue placeholder="Select Year of Study" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_YEARS.map((yr) => (
                        <SelectItem key={yr} value={yr} className="text-xs">
                          {yr}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other" className="text-xs font-bold">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedYear === 'Other' && (
                    <Input
                      placeholder="Enter year"
                      value={customYear}
                      onChange={(e) => setCustomYear(e.target.value)}
                      className="mt-2 text-xs"
                      autoComplete="off"
                      required
                    />
                  )}
                </div>
                <Button type="submit" className="w-full h-10 bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl cursor-pointer" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-2 border-[#01424E]/10">
          <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-md">
                <AvatarImage src={profile.profile_picture || ''} />
                <AvatarFallback className="text-4xl bg-[#7CEAAB]/20 text-[#01424E]">{initials}</AvatarFallback>
              </Avatar>
              <Label
                htmlFor="student-avatar-upload"
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#01424E] text-white shadow hover:bg-[#007C46] transition-colors"
              >
                <Upload className="h-4 w-4 text-[#7CEAAB]" />
                <span className="sr-only">Upload picture</span>
              </Label>
              <Input
                id="student-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
                disabled={uploading}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#01424E] dark:text-white">{profile.full_name}</h2>
              <p className="text-muted-foreground text-xs">{profile.email}</p>
            </div>
            <Badge className="bg-[#41B177] hover:bg-[#007C46] px-3 py-1 uppercase tracking-widest text-[10px] font-bold">
              {profile.role}
            </Badge>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-[#01424E] dark:text-teal-100 font-bold">
                <User className="h-5 w-5 text-[#007C46]" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoField icon={<Mail />} label="Email" value={profile.email} />
              <InfoField icon={<Phone />} label="Phone" value={profile.phone || 'Not provided'} />
              <InfoField icon={<Building />} label="College" value={profile.college || 'Not provided'} />
              <InfoField icon={<BookOpen />} label="Department" value={profile.department || 'Not provided'} />
              <InfoField icon={<Calendar />} label="Year" value={profile.year || 'Not provided'} />
              <InfoField icon={<User />} label="Joined" value={profile.created_at ? format(new Date(profile.created_at), 'MMM dd, yyyy') : 'N/A'} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-[#7CEAAB]/20 rounded-full text-[#01424E] dark:text-[#7CEAAB]">
                  <Activity className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Events Participated</p>
                  <p className="text-3xl font-extrabold text-[#01424E] dark:text-teal-100 mt-0.5">12</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-[#41B177]/20 rounded-full text-[#41B177]">
                  <Award className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Certificates Earned</p>
                  <p className="text-3xl font-extrabold text-[#01424E] dark:text-teal-100 mt-0.5">5</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#007C46] mt-0.5">
        <div className="h-4 w-4">{icon}</div>
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-sm text-[#01424E] dark:text-teal-100">{value}</p>
      </div>
    </div>
  );
}
