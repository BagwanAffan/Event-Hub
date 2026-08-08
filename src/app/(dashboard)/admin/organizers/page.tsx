'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Users,
  Search,
  Eye,
  Building,
  KeyRound,
  Trash2,
  UserX,
  UserCheck,
  RefreshCw,
  Calendar,
  FileText,
  ExternalLink,
  MapPin,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '@/services/admin-service';
import { organizerVerificationService } from '@/services/organizer-verification-service';
import { Profile, OrganizerStatus, OrganizerVerification } from '@/types/database.types';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminOrganizersPage() {
  const { profile: currentAdmin } = useAuth();
  const supabase = createClient();
  const [organizers, setOrganizers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // View Profile & History Modal State
  const [selectedOrg, setSelectedOrg] = useState<Profile | null>(null);
  const [verificationData, setVerificationData] = useState<OrganizerVerification | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [orgHistory, setOrgHistory] = useState<{ createdEvents: any[] }>({ createdEvents: [] });

  // Direct Reset Password Modal State
  const [resetOrg, setResetOrg] = useState<Profile | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Permanent Delete Modal State
  const [orgToDelete, setOrgToDelete] = useState<Profile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [ownedEventsCount, setOwnedEventsCount] = useState<number>(0);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getOrganizerApplications({
        status: statusFilter as OrganizerStatus | 'all',
        search,
      });
      setOrganizers(res.data || []);
    } catch (err) {
      console.error('Failed to load organizers:', err);
      toast.error('Failed to load organizers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrganizers();
  };

  const handleToggleStatus = async (org: Profile) => {
    const nextStatus = org.status === 'active' ? 'suspended' : 'active';
    setProcessingId(org.id);
    try {
      await adminService.toggleUserStatus(org.id, nextStatus);
      toast.success(`Organizer "${org.full_name}" is now ${nextStatus}.`);
      fetchOrganizers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update organizer status');
    } finally {
      setProcessingId(null);
    }
  };

  const openDeleteOrgModal = async (org: Profile) => {
    if (org.id === currentAdmin?.id) {
      toast.error("You cannot delete your own logged-in admin account.");
      return;
    }
    setOrgToDelete(org);
    setConfirmDeleteText('');
    setOwnedEventsCount(0);
    setIsDeleteModalOpen(true);

    try {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', org.id);

      if (count && count > 0) {
        setOwnedEventsCount(count);
        toast.error("This organizer owns active events. Delete or transfer these events before deleting the organizer.");
      }
    } catch (err) {
      console.error('Error checking owned events:', err);
    }
  };

  const handleConfirmPermanentDeleteOrg = async () => {
    if (!orgToDelete) return;
    if (orgToDelete.id === currentAdmin?.id) {
      toast.error("You cannot delete your own logged-in admin account.");
      return;
    }
    if (ownedEventsCount > 0) {
      toast.error("This organizer owns active events. Delete or transfer these events before deleting the organizer.");
      return;
    }
    if (confirmDeleteText.trim() !== 'DELETE') {
      toast.error('Please type DELETE to confirm organizer deletion');
      return;
    }

    try {
      setDeletingOrg(true);
      const res = await fetch('/api/admin/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: orgToDelete.id, adminId: currentAdmin?.id }),
      });

      const result = await res.json();
      if (!result.success) {
        if (result.error?.includes('owns active events')) {
          toast.error("This organizer owns active events. Delete or transfer these events before deleting the organizer.");
        } else {
          toast.error(result.error || 'Failed to delete organizer account');
        }
        return;
      }

      toast.success(`Organizer "${orgToDelete.full_name}" (${orgToDelete.email}) and Supabase Auth record permanently deleted.`);
      setIsDeleteModalOpen(false);
      setOrgToDelete(null);
      setConfirmDeleteText('');
      fetchOrganizers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete organizer account');
    } finally {
      setDeletingOrg(false);
    }
  };

  const handleOpenResetModal = (org: Profile) => {
    setResetOrg(org);
    setNewPassword('');
    setConfirmPassword('');
    setIsResetOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOrg) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResetting(true);
    try {
      await adminService.resetUserPasswordDirect(resetOrg.id, newPassword);
      toast.success(`Password for organizer "${resetOrg.full_name}" reset directly! 🔒`);
      setIsResetOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleViewProfile = async (org: Profile) => {
    setSelectedOrg(org);
    setIsProfileOpen(true);
    try {
      const [verif, history] = await Promise.all([
        organizerVerificationService.getVerificationByUserId(org.id),
        adminService.getUserHistory(org.id),
      ]);
      setVerificationData(verif);
      setOrgHistory({ createdEvents: history.createdEvents || [] });
    } catch {
      setVerificationData(null);
      setOrgHistory({ createdEvents: [] });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Organizers Directory</h1>
          <p className="text-muted-foreground text-sm">Full administrative oversight, verified documents, direct password resets, and hosting records</p>
        </div>
        <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] px-3 py-1 text-xs font-bold">
          {organizers.length} Organizers Registered
        </Badge>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, club, email, college..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Approval Status:</span>
              <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizers</SelectItem>
                  <SelectItem value="approved">Approved Active</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary" size="sm" className="shrink-0 font-semibold">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Organizers Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#007C46]" /> Campus Organizers Directory
          </CardTitle>
          <CardDescription className="text-xs">Live registry of student conveners and faculty event managers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!loading && organizers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                  <TableHead className="font-bold text-xs uppercase">Organizer Profile</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Club & Designation</TableHead>
                  <TableHead className="font-bold text-xs uppercase">College & Campus</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Approval Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Account Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizers.map((org) => {
                  const orgStatus = org.approval_status || org.organizer_status || 'pending';
                  return (
                    <TableRow key={org.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={org.profile_picture || ''} />
                            <AvatarFallback className="bg-[#01424E] text-[#7CEAAB] font-bold text-xs">
                              {org.full_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-[#01424E] dark:text-teal-100">{org.full_name}</div>
                            <div className="text-[11px] text-muted-foreground">{org.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{org.organization || org.club_name || 'Campus Club'}</div>
                        <div className="text-[11px] text-muted-foreground">{org.designation || org.position || 'Convener'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{org.college || 'Apex Institute'}</div>
                        <div className="text-[11px] text-muted-foreground">{org.department || 'General'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize font-bold text-[10px] ${
                          orgStatus === 'approved' ? 'bg-[#007C46] text-white' :
                          orgStatus === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-amber-500 text-white'
                        }`}>
                          {orgStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize font-bold text-[10px] ${
                          org.status === 'active' ? 'bg-[#edfcf6] text-[#007C46] border border-[#41B177]' :
                          'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        }`}>
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProfile(org)}
                          className="h-8 text-xs font-semibold"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5 text-[#01424E]" /> View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResetModal(org)}
                          className="h-8 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          title="Direct password reset"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === org.id}
                          onClick={() => handleToggleStatus(org)}
                          className={`h-8 text-xs ${org.status === 'active' ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30' : 'text-[#007C46]'}`}
                        >
                          {org.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === org.id || org.id === currentAdmin?.id}
                          onClick={() => openDeleteOrgModal(org)}
                          className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40"
                          title={org.id === currentAdmin?.id ? "Cannot delete your own logged-in admin account" : "Permanently delete organizer"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No matching organizer profiles found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Profile Modal with Real Verification Profile */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <Users className="h-5 w-5 text-[#007C46]" /> Verified Organizer Profile & Hosting Records
            </DialogTitle>
            <DialogDescription>Full verification data and uploaded identity documents</DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-4 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                <Avatar className="h-14 w-14 border-2 border-[#007C46]">
                  <AvatarImage src={verificationData?.profile_picture || selectedOrg.profile_picture || ''} />
                  <AvatarFallback className="bg-[#01424E] text-[#7CEAAB] font-bold text-lg">
                    {selectedOrg.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-base text-[#01424E] dark:text-teal-100">{verificationData?.full_name || selectedOrg.full_name}</h4>
                  <p className="text-muted-foreground">{selectedOrg.email} • {verificationData?.phone || selectedOrg.phone || 'No phone'}</p>
                  <Badge className="mt-1 capitalize text-[10px] bg-[#007C46] text-white">
                    {selectedOrg.approval_status || selectedOrg.organizer_status || 'pending'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 border rounded-xl bg-white dark:bg-slate-900">
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Organization / Club</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationData?.organization_name || selectedOrg.organization || selectedOrg.club_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Designation</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationData?.designation || selectedOrg.designation || selectedOrg.position || 'Convener'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Campus College</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationData?.college || selectedOrg.college || 'Apex Institute'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Prior Experience</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationData?.years_experience || selectedOrg.experience || '2+ Years'}</span>
                </div>
              </div>

              {/* Uploaded Documents Links */}
              {verificationData && (
                <div className="space-y-2 border p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Uploaded Verification Documents</span>
                  <div className="flex flex-wrap gap-2">
                    {verificationData.govt_id_url && (
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <a href={verificationData.govt_id_url} target="_blank" rel="noreferrer">
                          <FileText className="mr-1 h-3.5 w-3.5 text-[#007C46]" /> Government ID Proof
                        </a>
                      </Button>
                    )}
                    {verificationData.college_id_url && (
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <a href={verificationData.college_id_url} target="_blank" rel="noreferrer">
                          <FileText className="mr-1 h-3.5 w-3.5 text-[#007C46]" /> College ID Card
                        </a>
                      </Button>
                    )}
                    {verificationData.auth_letter_url && (
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <a href={verificationData.auth_letter_url} target="_blank" rel="noreferrer">
                          <FileText className="mr-1 h-3.5 w-3.5 text-[#007C46]" /> Authorization Letter
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Event Hosting Records */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#01424E] dark:text-teal-100 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-purple-600" /> Hosted Campus Events ({orgHistory.createdEvents.length})
                </h4>
                {orgHistory.createdEvents.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {orgHistory.createdEvents.map((evt) => (
                      <div key={evt.id} className="p-2.5 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{evt.title}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(evt.start_date).toLocaleDateString()} • {evt.venue}</p>
                        </div>
                        <Badge className="capitalize text-[10px] bg-purple-600 text-white">{evt.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-3 border rounded-lg">No campus events posted yet.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct Reset Password Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <KeyRound className="h-5 w-5 text-amber-600" /> Direct Password Reset
            </DialogTitle>
            <DialogDescription>
              Set a new password for organizer <strong>{resetOrg?.full_name}</strong> immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmResetPassword} className="space-y-4 py-2 text-xs">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">New Password *</Label>
              <Input
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Confirm New Password *</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={resetting} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold">
                {resetting ? 'Updating Password...' : 'Save New Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Organizer Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-red-600 dark:text-red-400 font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Permanently Delete Organizer Account
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Are you sure you want to permanently delete this organizer account?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {ownedEventsCount > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-semibold">
                ⚠️ This organizer owns active events. Delete or transfer these events before deleting the organizer. ({ownedEventsCount} active event{ownedEventsCount > 1 ? 's' : ''} remaining)
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                <strong>Critical Warning:</strong> This action permanently removes the organizer profile, credentials, events, verifications, and Supabase Authentication record (`auth.users`). Their email address will be completely freed for future registration.
              </div>
            )}

            {orgToDelete && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{orgToDelete.full_name}</p>
                <p className="text-muted-foreground">{orgToDelete.email} • Organization: <strong>{(orgToDelete as any).organization || (orgToDelete as any).organization_name || 'Individual'}</strong></p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-red-600 dark:text-red-400">
                Please type "DELETE" to confirm:
              </Label>
              <Input
                placeholder="Type DELETE to confirm"
                value={confirmDeleteText}
                disabled={ownedEventsCount > 0}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="text-xs h-10 border-red-300 dark:border-red-800 focus-visible:ring-red-500 disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsDeleteModalOpen(false); setOrgToDelete(null); setConfirmDeleteText(''); setOwnedEventsCount(0); }}
              className="text-xs font-bold rounded-xl h-10 flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={ownedEventsCount > 0 || confirmDeleteText.trim() !== 'DELETE' || deletingOrg}
              onClick={handleConfirmPermanentDeleteOrg}
              className="text-xs font-bold rounded-xl h-10 flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 cursor-pointer"
            >
              {deletingOrg ? 'Deleting Organizer...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
