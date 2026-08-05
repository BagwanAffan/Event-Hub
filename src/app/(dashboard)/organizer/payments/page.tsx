'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, ShieldCheck, CheckCircle2, XCircle, IndianRupee, ExternalLink, RefreshCw } from 'lucide-react';
import { paymentService } from '@/services/payment-service';
import { registrationService } from '@/services/registration-service';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments();
      setPayments(res.data);
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleApprove = async (paymentId: string, regId: string) => {
    toast.promise(
      (async () => {
        const payment = await paymentService.approvePayment(paymentId, profile?.id || 'user-organizer-1');
        if (!payment) throw new Error('Payment not updated');
        return payment;
      })(),
      {
        loading: 'Verifying payment reference & approving registration...',
        success: 'Payment verified! Student QR Pass generated & notified. 🎫',
        error: 'Failed to verify payment.'
      }
    );
    loadPayments();
  };

  const handleReject = async (paymentId: string, regId: string) => {
    toast.promise(
      (async () => {
        const payment = await paymentService.rejectPayment(paymentId, 'UPI Reference number not found in bank statement');
        if (!payment) throw new Error('Payment not updated');
        return payment;
      })(),
      {
        loading: 'Rejecting payment request...',
        success: 'Payment rejected. Student notified to resubmit.',
        error: 'Failed to update payment.'
      }
    );
    loadPayments();
  };

  const filtered = payments.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.profiles?.full_name?.toLowerCase().includes(s) ||
      p.transaction_reference?.toLowerCase().includes(s) ||
      p.events?.title?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Simulated Payment Verification</h1>
          <p className="text-muted-foreground text-sm">Review student payment proofs, UPI transaction references, and verify fees</p>
        </div>
        <Button onClick={loadPayments} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh List
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative w-full sm:w-[420px] md:w-[450px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or UPI reference number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-bold text-xs uppercase">Student</TableHead>
                <TableHead className="font-bold text-xs uppercase">Event & Amount</TableHead>
                <TableHead className="font-bold text-xs uppercase">Method & Ref #</TableHead>
                <TableHead className="font-bold text-xs uppercase">Proof Screenshot</TableHead>
                <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading payment verification queue...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments pending verification.</TableCell>
                </TableRow>
              ) : (
                filtered.map((pay) => (
                  <TableRow key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                    <TableCell>
                      <div className="font-bold text-[#01424E] dark:text-teal-100">{pay.profiles?.full_name || 'Anuj Sharma'}</div>
                      <div className="text-xs text-muted-foreground">{pay.profiles?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{pay.events?.title || 'TechSprint 2026 Hackathon'}</div>
                      <div className="text-xs font-bold text-[#007C46]">₹{pay.amount}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider mb-1">{pay.payment_method}</Badge>
                      <div className="text-xs font-mono text-slate-700 dark:text-slate-300">{pay.transaction_reference || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      {pay.screenshot_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProof(pay.screenshot_url)}
                          className="h-8 text-xs text-[#01424E] dark:text-[#7CEAAB] hover:underline p-0"
                        >
                          <ExternalLink className="mr-1 h-3.5 w-3.5" /> View Proof
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Image</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        pay.status === 'approved' ? 'bg-[#edfcf6] text-[#007C46] border border-[#41B177]' :
                        pay.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }>
                        {pay.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {pay.status !== 'approved' && (
                          <Button
                            onClick={() => handleApprove(pay.id, pay.registration_id)}
                            size="sm"
                            className="bg-[#007C46] text-white hover:bg-[#007C46]/90 h-8 px-3 font-semibold"
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Verify & Approve
                          </Button>
                        )}
                        {pay.status !== 'rejected' && (
                          <Button
                            onClick={() => handleReject(pay.id, pay.registration_id)}
                            variant="outline"
                            size="sm"
                            className="h-8 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Proof Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Proof Screenshot</DialogTitle>
            <DialogDescription>Uploaded transaction receipt or UPI confirmation screen</DialogDescription>
          </DialogHeader>
          {selectedProof && (
            <div className="p-2 rounded-xl border overflow-hidden bg-slate-50">
              <img src={selectedProof} alt="Payment Proof" className="w-full h-auto rounded-lg object-contain max-h-96" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedProof(null)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
