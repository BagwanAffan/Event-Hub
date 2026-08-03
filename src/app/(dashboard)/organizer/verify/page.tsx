'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { profileService } from '@/services/profile-service';
import { toast } from 'sonner';

export const CLUB_NAME_OPTIONS = [
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
  'Other',
];

export const COLLEGE_OPTIONS = [
  'PICT',
  'Other',
];

export default function OrganizerVerifyPage() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();

  const [headName, setHeadName] = useState(profile?.full_name || '');
  const [selectedClub, setSelectedClub] = useState(() => {
    const existing = profile?.club_name || '';
    if (!existing) return '';
    return CLUB_NAME_OPTIONS.includes(existing) ? existing : 'Other';
  });
  const [customClubName, setCustomClubName] = useState(() => {
    const existing = profile?.club_name || '';
    return CLUB_NAME_OPTIONS.includes(existing) ? '' : existing;
  });

  const [selectedCollege, setSelectedCollege] = useState(() => {
    const existing = profile?.college || '';
    if (!existing) return 'PICT';
    return COLLEGE_OPTIONS.includes(existing) ? existing : 'Other';
  });
  const [customCollegeName, setCustomCollegeName] = useState(() => {
    const existing = profile?.college || '';
    return COLLEGE_OPTIONS.includes(existing) ? '' : existing;
  });

  const [orgType, setOrgType] = useState(profile?.organization_type || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!headName.trim()) {
      return toast.error('Please enter Club / Organization Head Name');
    }

    const finalClubName = selectedClub === 'Other' ? customClubName.trim() : selectedClub;
    if (!finalClubName) {
      return toast.error('Please select or enter Club / Organization Name');
    }

    const finalCollege = selectedCollege === 'Other' ? customCollegeName.trim() : selectedCollege;
    if (!finalCollege) {
      return toast.error('Please select or enter College Name');
    }

    if (!orgType.trim()) {
      return toast.error('Please enter Type of Club / Organization');
    }

    setLoading(true);
    try {
      await profileService.updateProfile(profile.id, {
        full_name: headName.trim(),
        club_name: finalClubName,
        college: finalCollege,
        organization_type: orgType.trim(),
        organizer_status: profile.organizer_status === 'approved' ? 'approved' : 'pending',
        approval_status: profile.approval_status === 'approved' ? 'approved' : 'pending',
        verification_status: 'pending',
      });

      await refreshProfile();
      toast.success('Organizer Verification Profile saved successfully! 🎉');
      router.push('/organizer/dashboard');
    } catch (err: any) {
      console.error('Failed to save organizer verification profile:', err);
      toast.error(err?.message || 'Failed to save verification details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16 pt-4">
      <div className="text-center space-y-2">
        <Badge className="bg-[#01424E] text-[#7CEAAB] px-3 py-1 font-bold">REQUIRED STEP</Badge>
        <h1 className="text-3xl font-extrabold text-[#01424E] dark:text-teal-100">Organizer Verification Profile</h1>
        <p className="text-muted-foreground text-xs max-w-md mx-auto leading-relaxed">
          Please complete your official organizer details to submit your profile for verification and access your Organizer Dashboard.
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#007C46]" /> Organizer Information
            </CardTitle>
            <CardDescription className="text-xs">
              All 4 fields are required before accessing the Organizer Dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 py-6 text-xs">
            {/* 1. Head Name */}
            <div className="space-y-2">
              <Label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                1. Club / Organization Head Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Club / Organization Head Name"
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                className="text-xs h-10"
                required
              />
            </div>

            {/* 2. Club Name */}
            <div className="space-y-2">
              <Label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                2. Club / Organization Name <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedClub} onValueChange={(val) => val && setSelectedClub(val)}>
                <SelectTrigger className="text-xs h-10"><SelectValue placeholder="Select Club / Organization Name" /></SelectTrigger>
                <SelectContent>
                  {CLUB_NAME_OPTIONS.map((club) => (
                    <SelectItem key={club} value={club}>
                      {club}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClub === 'Other' && (
                <div className="pt-2">
                  <Input
                    placeholder="Enter Club / Organization Name"
                    value={customClubName}
                    onChange={(e) => setCustomClubName(e.target.value)}
                    className="text-xs h-10"
                    required
                  />
                </div>
              )}
            </div>

            {/* 3. College */}
            <div className="space-y-2">
              <Label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                3. College / Institution <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedCollege} onValueChange={(val) => val && setSelectedCollege(val)}>
                <SelectTrigger className="text-xs h-10"><SelectValue placeholder="Select College / Institution" /></SelectTrigger>
                <SelectContent>
                  {COLLEGE_OPTIONS.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCollege === 'Other' && (
                <div className="pt-2">
                  <Input
                    placeholder="Enter College Name"
                    value={customCollegeName}
                    onChange={(e) => setCustomCollegeName(e.target.value)}
                    className="text-xs h-10"
                    required
                  />
                </div>
              )}
            </div>

            {/* 4. Type of Club */}
            <div className="space-y-2">
              <Label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                4. Type of Club / Organization <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Technical Club, Cultural Club, Sports Club, Department Association, Student Council, NGO"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="text-xs h-10"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Examples: Technical Club, Cultural Club, Sports Club, Department Association, Student Council, NGO
              </p>
            </div>
          </CardContent>

          <CardFooter className="border-t p-4 flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold text-xs px-6 py-5 shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Profile...
                </>
              ) : (
                <>
                  Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
