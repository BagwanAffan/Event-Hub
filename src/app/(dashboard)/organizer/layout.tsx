'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ShieldAlert, LogOut, Mail, Building, GraduationCap, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return <>{children}</>;
  }

  // Allow organizer to visit verification page directly
  if (pathname === '/organizer/verify') {
    return <>{children}</>;
  }

  // Check 4 required verification fields: Head Name, Club Name, College, Club Type
  const hasHeadName = !!profile?.full_name && profile.full_name.trim().length > 0;
  const hasClubName = !!profile?.club_name && profile.club_name.trim().length > 0;
  const hasCollege = !!profile?.college && profile.college.trim().length > 0;
  const hasOrgType = !!profile?.organization_type && profile.organization_type.trim().length > 0;

  const isProfileComplete = hasHeadName && hasClubName && hasCollege && hasOrgType;
  const approvalStatus = profile?.approval_status || profile?.organizer_status || 'pending';

  if (profile?.role === 'organizer') {
    // CASE 1: Incomplete Verification Profile -> Require Verification
    if (!isProfileComplete) {
      return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 animate-fade-in">
          <Card className="max-w-lg w-full border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-center">
            <div className="h-2.5 w-full bg-[#007C46]" />
            <CardHeader className="space-y-3 pt-8 pb-4">
              <div className="w-16 h-16 rounded-3xl bg-[#edfcf6] dark:bg-teal-950/60 text-[#007C46] flex items-center justify-center mx-auto shadow-inner">
                <FileText className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100">
                Organizer Verification Profile Required
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Before accessing your Organizer Dashboard, you must complete your official Organizer Verification Profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-2">
              <Button asChild className="w-full bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold text-xs py-5">
                <Link href="/organizer/verify">
                  Complete Organizer Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
            <CardFooter className="p-4 border-t flex justify-center bg-slate-50 dark:bg-slate-900/40">
              <Button onClick={() => signOut()} variant="ghost" size="sm" className="text-xs text-red-600">
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // CASE 2 & 4: Pending Approval OR Rejected
    if (approvalStatus !== 'approved') {
      const isRejected = approvalStatus === 'rejected';

      return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 animate-fade-in">
          <Card className="max-w-lg w-full border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className={`h-2.5 w-full ${isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
            <CardHeader className="text-center space-y-3 pt-8 pb-4">
              <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-inner ${
                isRejected ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                {isRejected ? <ShieldAlert className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
              </div>
              <div>
                <CardTitle className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100">
                  {isRejected ? 'Organizer Application Rejected' : 'Your account is waiting for Admin Approval.'}
                </CardTitle>
                <CardDescription className="text-xs mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  {isRejected
                    ? 'Your organizer application has been rejected by the administrator. Please contact support or campus administration.'
                    : 'Your verification profile has been submitted and is currently being reviewed by campus administration. Once approved, you will be granted access to the Organizer Dashboard.'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 py-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-[#007C46]" /> Organization / Club:
                  </span>
                  <span className="font-bold text-[#01424E] dark:text-teal-100">
                    {profile.organization || profile.club_name || 'Campus Organization'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-[#007C46]" /> Campus:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {profile.college || 'Apex Institute'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-amber-600" /> Account Email:
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{profile.email}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 border border-[#41B177]/40 text-xs flex items-center gap-2 text-[#01424E] dark:text-teal-200">
                <CheckCircle2 className="h-4 w-4 text-[#007C46] shrink-0" />
                <span>Contact Campus Administration at <strong className="text-[#007C46]">admin@eventhub.edu</strong> for verification status updates.</span>
              </div>
            </CardContent>

            <CardFooter className="p-6 bg-slate-50/60 dark:bg-slate-900/40 border-t flex justify-center">
              <Button
                onClick={() => signOut()}
                variant="outline"
                className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out of Account
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}
