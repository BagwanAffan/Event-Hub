'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { profileService } from '@/services/profile-service';
import { volunteerService, parseSkills, PREDEFINED_SKILLS } from '@/services/volunteer-service';
import { certificateService } from '@/services/certificate-service';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, Building, BookOpen, Calendar, Edit2, Award, ClipboardList, CheckCircle2, Loader2, Upload, Plus, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification-service';
import { checkProfileCompletion } from '@/hooks/use-profile-completion';

export default function VolunteerProfilePage() {
  const { profile, loading: authLoading, refreshProfile } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, certificatesCount: 0, assignedEventsCount: 0, totalHours: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [college, setCollege] = useState('');
  const [uploading, setUploading] = useState(false);

  // Skills state
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');

  useEffect(() => {
    if (profile) {
      const activeProfile = profile;
      setFullName(activeProfile.full_name || '');
      setPhone(activeProfile.phone || '');
      setDepartment(activeProfile.department || '');
      setYear(activeProfile.year || '');
      setCollege(activeProfile.college || '');

      (async () => {
        try {
          setStatsLoading(true);
          const [vStats, certs] = await Promise.all([
            volunteerService.getVolunteerStats(activeProfile.id),
            certificateService.getCertificates({ user_id: activeProfile.id }),
          ]);
          setStats({
            totalTasks: vStats.totalTasks || 0,
            completedTasks: vStats.completedTasks || 0,
            certificatesCount: certs?.length || 0,
            assignedEventsCount: vStats.assignedEventsCount || 0,
            totalHours: vStats.totalHours || 0,
          });
        } catch (error) {
          console.error('Error fetching volunteer stats:', error);
        } finally {
          setStatsLoading(false);
        }
      })();
    }
  }, [profile]);

  if (authLoading || !profile) {
    return (
      <div className="space-y-6 fade-in max-w-5xl mx-auto">
        <PageHeader title="My Profile" description="Manage your personal information and volunteer details" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-1 rounded-xl" />
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nameParts = (profile.full_name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'V';

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (!s) return;
    if (selectedSkills.includes(s)) {
      setCustomSkill('');
      return;
    }
    setSelectedSkills([...selectedSkills, s]);
    setCustomSkill('');
  };

  const openEditWithSkills = () => {
    const currentSkills = parseSkills((profile as any).skills);
    setSelectedSkills(currentSkills.length > 0 ? currentSkills : []);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await profileService.updateProfile(profile.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        year: year.trim() || undefined,
        college: college.trim() || undefined,
      });

      if (selectedSkills.length > 0) {
        try {
          const { data: existingVols } = await volunteerService.getVolunteers({
            user_id: profile.id,
            limit: 1,
          });
          if (existingVols && existingVols.length > 0) {
            const volId = existingVols[0].id;
            const skillsJson = JSON.stringify(selectedSkills);
            const sb = createClient();
            await sb.from('volunteers').update({ skills: skillsJson }).eq('id', volId);
          }
        } catch (skillsErr) {
          console.warn('Could not update volunteer skills:', skillsErr);
        }
        (profile as any).skills = selectedSkills;
      }

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
      console.error('Error updating profile:', error);
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

  const completion = checkProfileCompletion(profile);
  const profileSkills = parseSkills((profile as any).skills);

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and volunteer details"
      >
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger
            render={
              <Button onClick={openEditWithSkills} className="bg-[#01424E] hover:bg-[#007C46] text-white dark:bg-[#7CEAAB] dark:text-[#01424E] dark:hover:bg-[#7CEAAB]/90">
                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year of Study</Label>
                  <Input
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 3rd Year"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College / Organization</Label>
                <Input
                  id="college"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Enter college name"
                />
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    <Sparkles className="inline h-4 w-4 mr-1 text-[#007C46]" />
                    Volunteer Skills
                  </Label>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {selectedSkills.length} selected
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        selectedSkills.includes(skill)
                          ? 'bg-[#007C46] text-white border-[#007C46] shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#41B177] hover:text-[#007C46]'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                {selectedSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#7CEAAB]/20 text-[#01424E] dark:bg-[#7CEAAB]/10 dark:text-[#7CEAAB] border border-[#41B177]/30"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="hover:text-red-600 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add custom skill..."
                    value={customSkill}
                    onChange={e => setCustomSkill(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" onClick={addCustomSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full bg-[#01424E] hover:bg-[#007C46] text-white dark:bg-[#7CEAAB] dark:text-[#01424E] mt-4"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-2 border-[#01424E]/10 dark:border-slate-800">
          <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-md">
                <AvatarImage src={profile.profile_picture || ''} />
                <AvatarFallback className="text-4xl bg-[#7CEAAB]/20 text-[#01424E] dark:text-[#7CEAAB]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="volunteer-avatar-upload"
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#01424E] text-white shadow hover:bg-[#007C46]"
              >
                <Upload className="h-4 w-4" />
                <span className="sr-only">Upload picture</span>
              </Label>
              <Input
                id="volunteer-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
                disabled={uploading}
              />
            </div>
            {!completion.isComplete && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 px-3 -mt-1">
                Missing: {completion.missingFields.join(', ')}
              </p>
            )}
            <div>
              <h2 className="text-2xl font-bold text-[#01424E] dark:text-white">
                {profile.full_name || 'Volunteer'}
              </h2>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>
            <Badge className="bg-[#41B177] hover:bg-[#007C46] text-white px-3 py-1 uppercase tracking-widest text-xs">
              {profile.role || 'Volunteer'}
            </Badge>
            {profileSkills.length > 0 && (
              <div className="w-full pt-4 border-t">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Top Skills
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {profileSkills.slice(0, 6).map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-[#41B177]/40 bg-[#41B177]/5 text-[#01424E] dark:text-[#7CEAAB]">
                      {skill}
                    </Badge>
                  ))}
                  {profileSkills.length > 6 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{profileSkills.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-[#007C46] dark:text-[#7CEAAB]" /> Personal Information
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#7CEAAB]/20 rounded-full text-[#01424E] dark:text-[#7CEAAB]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Assigned Events</p>
                  <p className="text-xl font-bold">{statsLoading ? '-' : stats.assignedEventsCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#7CEAAB]/20 rounded-full text-[#01424E] dark:text-[#7CEAAB]">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-xl font-bold">{statsLoading ? '-' : stats.totalTasks}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#41B177]/20 rounded-full text-[#41B177]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{statsLoading ? '-' : stats.completedTasks}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#01424E]/20 dark:bg-[#7CEAAB]/20 rounded-full text-[#01424E] dark:text-[#7CEAAB]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Certificates</p>
                  <p className="text-xl font-bold">{statsLoading ? '-' : stats.certificatesCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">
        <div className="h-5 w-5">{icon}</div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground text-sm">{value}</p>
      </div>
    </div>
  );
}
