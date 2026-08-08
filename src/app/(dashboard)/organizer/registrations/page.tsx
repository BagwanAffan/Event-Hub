'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, XCircle, Download, QrCode, Filter, RefreshCw, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { registrationService } from '@/services/registration-service';
import { paymentService } from '@/services/payment-service';
import { notificationService } from '@/services/notification-service';
import { exportService } from '@/services/export-service';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useDataSync } from '@/lib/data-sync';

export default function RegistrationsPage() {
  const { profile } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Permanent Delete Registration Modal State
  const [regToDelete, setRegToDelete] = useState<any | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (reg: any) => {
    setRegToDelete(reg);
    setConfirmDeleteText('');
    setIsDeleteOpen(true);
  };

  const handleConfirmDeleteRegistration = async () => {
    if (!regToDelete) return;
    if (confirmDeleteText.trim() !== 'DELETE') {
      toast.error('Please type DELETE to confirm registration deletion');
      return;
    }

    try {
      setDeleting(true);
      await registrationService.deleteRegistrationPermanently(regToDelete.id);
      toast.success(`Registration for ${regToDelete.profiles?.full_name || 'student'} permanently deleted & event participant count updated.`);
      setIsDeleteOpen(false);
      setRegToDelete(null);
      setConfirmDeleteText('');
      loadRegistrations();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete registration');
    } finally {
      setDeleting(false);
    }
  };

  const loadRegistrations = async () => {
    if (registrations.length === 0) setLoading(true);
    try {
      const res = await registrationService.getRegistrations({
        status: statusFilter === 'all' ? undefined : (statusFilter as any),
        search
      });
      setRegistrations(res.data);
    } catch (err) {
      console.error("Error loading registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useDataSync(['registrations', 'events', 'payments'], loadRegistrations, [statusFilter, search]);

  const handleApprove = async (id: string, regUserId?: string, eventTitle?: string) => {
    toast.promise(
      (async () => {
        const organizerId = profile?.id || 'user-organizer-1';
        const updatedReg = await registrationService.updateRegistrationStatus(id, 'approved', 'approved', organizerId);
        if (!updatedReg) throw new Error('Registration not updated');

        const existingPayment = await paymentService.getPaymentByRegistration(id);
        if (existingPayment && existingPayment.status !== 'approved') {
          await paymentService.approvePayment(existingPayment.id, organizerId);
        } else if (!existingPayment) {
          if (regUserId) {
            try {
              await notificationService.createNotification(
                regUserId,
                'Registration Approved',
                `Your registration for ${eventTitle || 'the event'} has been approved. Your QR pass is now available.`,
                'success',
                `/student/registrations/${id}`
              );
            } catch (notifyErr) {
              console.warn('Could not send notification after manual approval:', notifyErr);
            }
          }
        }

        return updatedReg;
      })(),
      {
        loading: 'Approving registration & generating QR pass...',
        success: 'Registration approved & QR generated! 🎫',
        error: 'Failed to approve registration'
      }
    );
    loadRegistrations();
  };

  const handleReject = async (id: string, regUserId?: string, eventTitle?: string) => {
    toast.promise(
      (async () => {
        const updatedReg = await registrationService.updateRegistrationStatus(id, 'rejected');
        if (!updatedReg) throw new Error('Registration not updated');

        const existingPayment = await paymentService.getPaymentByRegistration(id);
        if (existingPayment && existingPayment.status !== 'rejected') {
          await paymentService.rejectPayment(existingPayment.id, 'Registration rejected by organizer');
        } else if (!existingPayment) {
          if (regUserId) {
            try {
              await notificationService.createNotification(
                regUserId,
                'Registration Rejected',
                `Your registration for ${eventTitle || 'the event'} has been rejected. Please contact the organizer for details.`,
                'error',
                `/student/registrations/${id}`
              );
            } catch (notifyErr) {
              console.warn('Could not send notification after manual rejection:', notifyErr);
            }
          }
        }

        return updatedReg;
      })(),
      {
        loading: 'Rejecting registration...',
        success: 'Registration marked as rejected.',
        error: 'Failed to update status'
      }
    );
    loadRegistrations();
  };

  const handleExportExcel = async () => {
    toast.promise(exportService.exportRegistrationsExcel(registrations), {
      loading: 'Exporting registrations to Excel spreadsheet...',
      success: 'Excel file downloaded successfully! 📊',
      error: 'Export failed'
    });
  };

  const filtered = registrations.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.profiles?.full_name?.toLowerCase().includes(s) ||
      r.events?.title?.toLowerCase().includes(s) ||
      r.id.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Registration Management</h1>
          <p className="text-muted-foreground text-sm">Review student event applications, verify status, and issue QR passes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadRegistrations} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={handleExportExcel} className="bg-[#007C46] text-white hover:bg-[#007C46]/90" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Status:
              </span>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                <SelectTrigger className="w-52"><SelectValue>{
                  statusFilter === 'all' ? 'All Registrations' :
                  statusFilter === 'approved' ? 'Approved' :
                  statusFilter === 'pending_payment' ? 'Pending Verification' :
                  statusFilter === 'completed' ? 'Completed' :
                  statusFilter === 'rejected' ? 'Rejected' : 'All Registrations'
                }</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registrations</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending_payment">Pending Verification</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card className="border-slate-200 dark:border-white/[0.08] dark:bg-[#151515]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-[#181818] dark:border-white/[0.08]">
                <TableHead className="font-bold text-xs uppercase dark:text-[#9CA3AF]">Student Name</TableHead>
                <TableHead className="font-bold text-xs uppercase dark:text-[#9CA3AF]">Event</TableHead>
                <TableHead className="font-bold text-xs uppercase dark:text-[#9CA3AF]">Type</TableHead>
                <TableHead className="font-bold text-xs uppercase dark:text-[#9CA3AF]">Payment Status</TableHead>
                <TableHead className="font-bold text-xs uppercase dark:text-[#9CA3AF]">Approval Status</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right dark:text-[#9CA3AF]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground dark:text-[#9CA3AF]">Loading registrations...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground dark:text-[#9CA3AF]">No registrations found matching search.</TableCell>
                </TableRow>
              ) : (
                filtered.map((reg) => (
                  <TableRow key={reg.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1F1F1F] dark:border-white/[0.08]">
                    <TableCell>
                      <div className="font-bold text-[#01424E] dark:text-[#F5F5F5]">{reg.profiles?.full_name || 'Anuj Sharma'}</div>
                      <div className="text-xs text-muted-foreground dark:text-[#9CA3AF]">{reg.profiles?.email || 'anuj@eventhub.edu'} • {reg.department || 'CS'} ({reg.year || '3rd Yr'})</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm dark:text-[#F5F5F5]">{reg.events?.title || 'TechSprint 2026 Hackathon'}</div>
                      <div className="text-xs text-muted-foreground">Registered: {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'Recent'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {reg.registration_type} {reg.teams?.team_name ? `(${reg.teams.team_name})` : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        reg.payment_status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        reg.payment_status === 'not_required' ? 'bg-slate-100 text-slate-800' :
                        'bg-amber-100 text-amber-800'
                      }>
                        {reg.payment_status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        reg.status === 'approved' || reg.status === 'completed'
                          ? 'bg-[#edfcf6] text-[#007C46] border border-[#41B177]'
                          : reg.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }>
                        {reg.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {reg.status !== 'approved' && reg.status !== 'completed' && (
                          <Button onClick={() => handleApprove(reg.id, reg.user_id, reg.events?.title)} size="sm" className="bg-[#007C46] text-white hover:bg-[#007C46]/90 h-8 px-2.5">
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                        {reg.status !== 'rejected' && (
                          <Button onClick={() => handleReject(reg.id, reg.user_id, reg.events?.title)} variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" title="Reject registration">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => openDeleteModal(reg)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Permanently delete registration"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permanent Delete Registration Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-red-600 dark:text-red-400 font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Permanently Delete Registration
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Are you sure you want to permanently delete this registration record?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 leading-relaxed">
              <strong>Warning:</strong> Deleting this registration permanently removes team memberships, attendance records, volunteer assignments, and invalidates any issued certificates. Event participant count will be updated automatically.
            </div>

            {regToDelete && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{regToDelete.profiles?.full_name || 'Student'}</p>
                <p className="text-muted-foreground">{regToDelete.profiles?.email} • Event: <strong>{regToDelete.events?.title || 'Campus Event'}</strong></p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-red-600 dark:text-red-400">
                Please type "DELETE" to confirm:
              </Label>
              <Input
                placeholder="Type DELETE to confirm"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="text-xs h-10 border-red-300 dark:border-red-800 focus-visible:ring-red-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsDeleteOpen(false); setRegToDelete(null); setConfirmDeleteText(''); }}
              className="text-xs font-bold rounded-xl h-10 flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmDeleteText.trim() !== 'DELETE' || deleting}
              onClick={handleConfirmDeleteRegistration}
              className="text-xs font-bold rounded-xl h-10 flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 cursor-pointer"
            >
              {deleting ? 'Deleting Registration...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
