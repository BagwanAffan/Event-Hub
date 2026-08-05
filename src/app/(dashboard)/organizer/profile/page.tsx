'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Edit2,
  Upload,
  Award,
  Phone,
  Briefcase,
  CalendarCheck,
  Clock,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { profileService } from '@/services/profile-service';
import { toast } from 'sonner';

export const PICT_CLUB_OPTIONS = [
  'CSI Student Chapter',
  'ACM Student Chapter',
  'IEEE Student Branch',
  'EESA',
  'PICT Robotics Club',
  'PICT Coding Club',
  'PICT Debating Club',
  'PICT Drama Club',
  'PICT Dance Club',
  'PICT Music Club',
  'PICT Photography Club',
  'PICT Art Club',
  'PICT Sports Club',
  'PICT NSS',
  'PICT Entrepreneurship Cell (E-Cell)',
  'PICT GDSC / Google Developer Groups',
  'PICT Innovation Club',
  'PICT AI Club',
  'PICT Open Source Club',
  'PICT Literary Club',
  'Other'
];

export default function OrganizerProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit form state
  const [headName, setHeadName] = useState(profile?.full_name || '');
  const [facultyAdvisorName, setFacultyAdvisorName] = useState(profile?.faculty_advisor_name || '');
  
  const [selectedClubOption, setSelectedClubOption] = useState(() => {
    const existing = profile?.organization || profile?.club_name || '';
    if (!existing) return PICT_CLUB_OPTIONS[0];
    return PICT_CLUB_OPTIONS.includes(existing) ? existing : 'Other';
  });
  
  const [customClubName, setCustomClubName] = useState(() => {
    const existing = profile?.organization || profile?.club_name || '';
    return PICT_CLUB_OPTIONS.includes(existing) ? '' : existing;
  });

  const [orgType, setOrgType] = useState(profile?.organization_type || '');
  const [designation, setDesignation] = useState(profile?.designation || 'Club President / Head');
  const [phone, setPhone] = useState(profile?.phone || '');

  if (!profile) return null;

  const initials = (profile.organization || profile.club_name || profile.full_name || 'O')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleOpenEdit = () => {
    setHeadName(profile.full_name || '');
    setFacultyAdvisorName(profile.faculty_advisor_name || '');
    
    const existingClub = profile.organization || profile.club_name || '';
    if (PICT_CLUB_OPTIONS.includes(existingClub)) {
      setSelectedClubOption(existingClub);
      setCustomClubName('');
    } else if (existingClub) {
      setSelectedClubOption('Other');
      setCustomClubName(existingClub);
    } else {
      setSelectedClubOption(PICT_CLUB_OPTIONS[0]);
      setCustomClubName('');
    }

    setOrgType(profile.organization_type || '');
    setDesignation(profile.designation || 'Club President / Head');
    setPhone(profile.phone || '');
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalClubName = selectedClubOption === 'Other' ? customClubName.trim() : selectedClubOption;

      await profileService.updateProfile(profile.id, {
        full_name: headName.trim(),
        faculty_advisor_name: facultyAdvisorName.trim(),
        organization: finalClubName,
        club_name: finalClubName,
        organization_type: orgType.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
      });

      await refreshProfile();
      toast.success('Organizer profile updated successfully! 🎉');
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
      toast.success('Organization logo uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const approvalStatus = profile.approval_status || profile.organizer_status || 'approved';
  const createdDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';
  const approvedDate = profile.approved_at
    ? new Date(profile.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : createdDate;

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
            Organizer Profile
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Official event management, organization credentials, and signatory details
          </p>
        </div>

        <Button onClick={handleOpenEdit} className="bg-[#01424E] hover:bg-[#007C46] text-white font-bold text-xs">
          <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      {/* Main Profile Card Layout with FLUSH TOP CORNERS (Zero White Gap) */}
      <Card className="p-0 pt-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-md rounded-xl">
        {/* ORGANIZATION BRANDING BANNER - Flush with top corners */}
        <div className="bg-gradient-to-r from-[#01424E] to-[#007C46] p-6 text-white relative rounded-t-xl w-full">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl bg-white dark:bg-slate-800 text-[#01424E] dark:text-teal-200">
                <AvatarImage src={profile.profile_picture || ''} className="object-cover" />
                <AvatarFallback className="text-2xl bg-white dark:bg-slate-800 text-[#01424E] dark:text-teal-200 font-bold">{initials}</AvatarFallback>
              </Avatar>
              <Label
                htmlFor="organizer-logo-upload"
                className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-800 text-[#01424E] dark:text-teal-200 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="sr-only">Upload Organization Logo</span>
              </Label>
              <Input
                id="organizer-logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
                disabled={uploading}
              />
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  {profile.organization || profile.club_name || 'Campus Organization'}
                </h2>
                <Badge
                  className={`capitalize font-bold text-[10px] px-2.5 py-0.5 border-0 ${
                    approvalStatus === 'approved'
                      ? 'bg-[#7CEAAB] text-[#01424E]'
                      : approvalStatus === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-400 text-slate-900'
                  }`}
                >
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  {approvalStatus}
                </Badge>
              </div>
              <p className="text-xs text-white/80 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#7CEAAB]" />
                {profile.organization_type || 'Campus Event Organization'}
              </p>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <CardContent className="p-6 space-y-6">
          {/* Reordered Organizer Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-4 w-4 text-[#007C46]" /> Key Personnel & Event Signatory
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Club / Organization Head (Most Prominent - Spans Full Width) */}
              <div className="sm:col-span-2 p-4 rounded-xl border bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-[#007C46] text-white shrink-0 shadow-sm">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#007C46] dark:text-[#7CEAAB]">
                      Club / Organization Head
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {profile.full_name || 'Organizer Head'}
                    </p>
                    {profile.designation && (
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        {profile.designation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Club Name */}
              <ProfileItem
                icon={<Building2 className="h-4 w-4 text-[#007C46]" />}
                label="Club Name"
                value={profile.organization || profile.club_name || 'Not specified'}
              />

              {/* 3. Club Type */}
              <ProfileItem
                icon={<Briefcase className="h-4 w-4 text-indigo-500" />}
                label="Club Type"
                value={profile.organization_type || 'Campus Event Organization'}
              />

              {/* 4. Faculty Advisor */}
              <ProfileItem
                icon={<Award className="h-4 w-4 text-amber-500" />}
                label="Faculty Advisor"
                value={profile.faculty_advisor_name || 'Not specified'}
                highlight={!!profile.faculty_advisor_name}
              />

              {/* 5. Email */}
              <ProfileItem
                icon={<Mail className="h-4 w-4 text-cyan-600" />}
                label="Email"
                value={profile.email || 'organizer@eventhub.edu'}
              />

              {/* 6. Approval Status */}
              <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Approval Status</p>
                    <p className="text-xs font-bold capitalize text-slate-900 dark:text-white mt-0.5">{approvalStatus}</p>
                  </div>
                </div>
                <Badge className={`capitalize font-bold text-xs ${
                  approvalStatus === 'approved' ? 'bg-[#007C46] text-white' :
                  approvalStatus === 'rejected' ? 'bg-red-600 text-white' :
                  'bg-amber-500 text-slate-900'
                }`}>
                  {approvalStatus}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Metadata */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#007C46]" /> Account History & Verification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileItem
                icon={<Clock className="h-4 w-4 text-slate-500" />}
                label="Account Created"
                value={createdDate}
              />
              <ProfileItem
                icon={<CalendarCheck className="h-4 w-4 text-[#007C46]" />}
                label="Approved On"
                value={approvedDate}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100">
              Edit Organizer Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs pt-2">
            <div className="space-y-1.5">
              <Label className="font-bold">Club / Organization Head Name *</Label>
              <Input
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>

            {/* Club Name Dropdown */}
            <div className="space-y-1.5">
              <Label className="font-bold">Club / Organization Name *</Label>
              <Select value={selectedClubOption} onValueChange={(val) => val && setSelectedClubOption(val)}>
                <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Select Club Name" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {PICT_CLUB_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClubOption === 'Other' && (
                <Input
                  placeholder="Enter Club Name"
                  value={customClubName}
                  onChange={(e) => setCustomClubName(e.target.value)}
                  required
                  className="text-xs h-9 mt-1.5"
                />
              )}
            </div>

            <div className="space-y-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Label className="font-bold text-[#007C46] dark:text-[#7CEAAB]">Faculty Advisor Name *</Label>
              <Input
                placeholder="e.g. Dr. Priya Mehta"
                value={facultyAdvisorName}
                onChange={(e) => setFacultyAdvisorName(e.target.value)}
                required
                className="text-xs h-9 bg-white dark:bg-slate-900"
              />
              <p className="text-[10px] text-muted-foreground">Official signatory printed on event certificates</p>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">Club Type *</Label>
              <Input
                placeholder="e.g. Technical Club / Department Association"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">Designation</Label>
                <Input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-[#01424E] hover:bg-[#007C46] text-white font-bold h-10 mt-2">
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileItem({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
      highlight
        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
    }`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">{label}</p>
        <p className="text-xs font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
