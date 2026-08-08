'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { accountDeletionService, type AccountDeletionRequest } from '@/services/account-deletion-service';
import { useDataSync } from '@/lib/data-sync';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/page-skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  UserX,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Filter,
  User,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminDeletionRequestsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<AccountDeletionRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await accountDeletionService.getAllRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch deletion requests:', err);
      toast.error('Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useDataSync(['profile', 'admin', 'notifications'], fetchRequests);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    };
  }, [requests]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      await accountDeletionService.updateRequestStatus(selectedRequest.id, 'approved', undefined, profile?.id);
      toast.success(`User ${selectedRequest.name} (${selectedRequest.email}) and Supabase Auth record permanently deleted.`);
      setIsApproveOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve deletion request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      await accountDeletionService.updateRequestStatus(
        selectedRequest.id,
        'rejected',
        rejectRemarks
      );
      toast.success(`Deletion request for ${selectedRequest.name} rejected.`);
      setIsRejectOpen(false);
      setSelectedRequest(null);
      setRejectRemarks('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject deletion request');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  // Access Control: Admin only
  if (profile && profile.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4 rounded-2xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-muted-foreground">Only system administrators can access this management page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
              Account Deletion Requests
            </h1>
            <ShieldCheck className="h-6 w-6 text-[#007C46] shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Review, approve, or reject user account deletion requests submitted across the campus platform
          </p>
        </div>
      </div>

      {/* Controls: Search and Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shadow-xs">
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 capitalize select-none [&_*]:pointer-events-none',
                statusFilter === st
                  ? 'bg-[#01424E] text-[#7CEAAB] shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              )}
            >
              <span>{st}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold',
                  statusFilter === st
                    ? 'bg-[#7CEAAB]/20 text-[#7CEAAB]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                {counts[st]}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Requests Table */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs bg-card">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Requested At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#007C46]/10 text-[#007C46] dark:text-[#7CEAAB] flex items-center justify-center font-extrabold text-xs shrink-0">
                          {req.name ? req.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="truncate max-w-[160px]">{req.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium truncate max-w-[200px]">
                      {req.email || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold capitalize text-[10px]">
                        {req.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground max-w-[220px] truncate">
                      {req.reason ? `"${req.reason}"` : <span className="italic text-slate-400">None provided</span>}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(req.requested_at), 'MMM dd, yyyy, h:mm a')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={cn(
                          'capitalize font-bold text-[10px] px-2.5 py-0.5 rounded-full',
                          req.status === 'pending'
                            ? 'bg-amber-500 text-white'
                            : req.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-500 text-white'
                        )}
                      >
                        {req.status === 'pending' ? 'Pending Review' : req.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsDetailsOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> Details
                        </Button>

                        {/* Approve / Reject Actions (available if pending) */}
                        {req.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsApproveOpen(true);
                              }}
                              className="h-8 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(req);
                                setRejectRemarks('');
                                setIsRejectOpen(true);
                              }}
                              className="h-8 px-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={UserX}
            title="No deletion requests found"
            description="No account deletion requests match your current search or filter criteria."
            className="py-12"
          />
        )}
      </Card>

      {/* 1. View Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-[#01424E] dark:text-[#7CEAAB]">
              <FileText className="h-5 w-5 text-[#007C46]" /> Deletion Request Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete metadata and submitted information for this account deletion request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">User Name</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{selectedRequest.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Role</span>
                  <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold capitalize text-[10px] mt-0.5">
                    {selectedRequest.role}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedRequest.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Requested At</span>
                  <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">
                    {format(new Date(selectedRequest.requested_at), 'MMM dd, yyyy, h:mm a')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Current Status</span>
                  <Badge
                    className={cn(
                      'capitalize font-bold text-[10px] px-2 py-0.5 rounded-full mt-0.5',
                      selectedRequest.status === 'pending'
                        ? 'bg-amber-500 text-white'
                        : selectedRequest.status === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-500 text-white'
                    )}
                  >
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Reason for Deletion</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed italic">
                  {selectedRequest.reason ? `"${selectedRequest.reason}"` : 'No optional reason provided by user.'}
                </p>
              </div>

              {selectedRequest.admin_notes && (
                <div className="space-y-1.5 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">Admin Remarks</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedRequest.admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)} className="text-xs font-bold rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Approve Confirmation Modal */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-3 text-center sm:text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white text-center">
              Approve Account Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-center">
              Are you sure you want to approve the deletion request for <strong>{selectedRequest?.name}</strong> ({selectedRequest?.email})?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Critical Warning:
              </p>
              <p className="leading-relaxed">This action permanently deletes the account.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} className="text-xs font-bold rounded-xl flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={processing}
              onClick={handleApprove}
              className="text-xs font-bold rounded-xl flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? 'Approving...' : 'Confirm Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Reject Modal with Remarks */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" /> Reject Deletion Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rejecting the request for <strong>{selectedRequest?.name}</strong>. The user will be notified of your decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Remarks / Reason for Rejection (Optional)
              </Label>
              <Textarea
                placeholder="Specify why this account deletion request is being rejected..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                className="text-xs min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} className="text-xs font-bold rounded-xl flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={processing}
              onClick={handleReject}
              className="text-xs font-bold rounded-xl flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
