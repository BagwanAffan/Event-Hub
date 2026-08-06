'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Building,
  Mail,
  GraduationCap,
  Tag,
  User,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '@/services/admin-service';
import { Profile, OrganizerStatus } from '@/types/database.types';
import { useAuth } from '@/hooks/use-auth';
import { useDataSync } from '@/lib/data-sync';
import { toast } from 'sonner';

export default function AdminApprovalsPage() {
  const { profile: currentAdmin } = useAuth();
  const [organizers, setOrganizers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // View Details Modal State
  const [selectedOrg, setSelectedOrg] = useState<Profile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Reject Modal State
  const [rejectingOrg, setRejectingOrg] = useState<Profile | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      if (organizers.length === 0) setLoading(true);
      const res = await adminService.getOrganizerApplications({
        status: statusFilter as OrganizerStatus | 'all',
        search,
      });
      setOrganizers(res.data || []);
    } catch (err) {
      console.error('Failed to load organizer applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useDataSync(['admin', 'profile'], fetchApplications, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleOpenDetails = (org: Profile) => {
    setSelectedOrg(org);
    setIsDetailsOpen(true);
  };

  const handleApprove = async (org: Profile) => {
    setProcessingId(org.id);
    try {
      await adminService.updateOrganizerStatus(
        org.id,
        'approved',
        undefined,
        currentAdmin?.id
      );
      toast.success(`Organizer "${org.full_name}" approved successfully! 🎉`);
      setIsDetailsOpen(false);
      fetchApplications();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve organizer');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrg) return;
    setProcessingId(rejectingOrg.id);
    try {
      await adminService.updateOrganizerStatus(
        rejectingOrg.id,
        'rejected',
        rejectionReason || 'Does not meet organizer verification criteria.'
      );
      toast.warning(`Organizer "${rejectingOrg.full_name}" application rejected.`);
      setIsRejectOpen(false);
      setIsDetailsOpen(false);
      fetchApplications();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject organizer');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Organizer Approvals Portal</h1>
          <p className="text-muted-foreground text-sm">Review submitted organizer details and grant or reject organizer access</p>
        </div>
        <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] px-3 py-1 text-xs font-bold">
          {organizers.length} Applications
        </Badge>
      </div>

      {/* Filter & Search */}
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
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Status Filter:</span>
              <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved Active</SelectItem>
                  <SelectItem value="rejected">Rejected Applications</SelectItem>
                  <SelectItem value="all">All Applications</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary" size="sm" className="shrink-0 font-semibold">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-500" /> Organizer Verification Profiles
          </CardTitle>
          <CardDescription className="text-xs">Review submitted details for administrative clearance</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!loading && organizers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                    <TableHead className="font-bold text-xs uppercase">Organizer Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Email</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Club / Org Head</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Club Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase">College</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Club Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizers.map((org) => {
                    const orgStatus = org.approval_status || org.organizer_status || 'pending';
                    return (
                      <TableRow key={org.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                        <TableCell className="font-bold text-[#01424E] dark:text-teal-100">
                          {org.full_name}
                        </TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {org.email}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                          {org.full_name}
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                          {org.club_name}
                        </TableCell>
                        <TableCell>
                          {org.college}
                        </TableCell>
                        <TableCell>
                          {org.organization_type}
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
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetails(org)}
                            className="h-8 text-xs font-semibold"
                          >
                            <Eye className="mr-1 h-3.5 w-3.5 text-[#01424E]" /> Review
                          </Button>
                          {orgStatus !== 'approved' && (
                            <Button
                              size="sm"
                              disabled={processingId === org.id}
                              onClick={() => handleApprove(org)}
                              className="bg-[#007C46] text-white hover:bg-[#007C46]/90 h-8 text-xs font-bold"
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                          )}
                          {orgStatus !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === org.id}
                              onClick={() => { setRejectingOrg(org); setIsRejectOpen(true); }}
                              className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <UserCheck className="h-12 w-12 mx-auto text-[#007C46] opacity-50" />
              <p className="font-semibold text-sm text-[#01424E] dark:text-teal-200">No Organizer Applications</p>
              <p className="text-xs">There are currently no organizer applications matching status &quot;{statusFilter}&quot;.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organizer Review Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100 text-lg">
              <UserCheck className="h-6 w-6 text-[#007C46]" /> Review Organizer Verification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review details submitted by the organizer
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border grid grid-cols-1 gap-3">
                <DetailRow icon={<User className="h-4 w-4 text-[#007C46]" />} label="Organizer Name" value={selectedOrg.full_name} />
                <DetailRow icon={<Mail className="h-4 w-4 text-[#007C46]" />} label="Email" value={selectedOrg.email} />
                <DetailRow icon={<User className="h-4 w-4 text-[#007C46]" />} label="Club / Organization Head" value={selectedOrg.full_name} />
                <DetailRow icon={<Building className="h-4 w-4 text-[#007C46]" />} label="Club Name" value={selectedOrg.club_name || ''} />
                <DetailRow icon={<GraduationCap className="h-4 w-4 text-[#007C46]" />} label="College" value={selectedOrg.college || ''} />
                <DetailRow icon={<Tag className="h-4 w-4 text-[#007C46]" />} label="Club Type" value={selectedOrg.organization_type || ''} />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
            {selectedOrg?.approval_status !== 'rejected' && selectedOrg?.organizer_status !== 'rejected' && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedOrg) {
                    setRejectingOrg(selectedOrg);
                    setIsRejectOpen(true);
                  }
                }}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
            )}
            {selectedOrg?.approval_status !== 'approved' && selectedOrg?.organizer_status !== 'approved' && (
              <Button
                onClick={() => selectedOrg && handleApprove(selectedOrg)}
                className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Application Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Reject Organizer Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide rejection feedback for <strong>{rejectingOrg?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold">Rejection Reason</Label>
            <Textarea
              rows={3}
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmReject} disabled={processingId === rejectingOrg?.id} variant="destructive" className="font-bold">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-muted-foreground text-xs">{label}:</span>
      </div>
      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{value}</span>
    </div>
  );
}
