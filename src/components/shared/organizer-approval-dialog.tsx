'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Clock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OrganizerApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: string | null;
}

export function OrganizerApprovalDialog({
  open,
  onOpenChange,
  status = 'pending'
}: OrganizerApprovalDialogProps) {
  const router = useRouter();

  const isRejected = status === 'rejected';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-200 dark:border-slate-800">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
            {isRejected ? <ShieldAlert className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </div>
          <DialogTitle className="text-xl font-bold text-[#01424E] dark:text-teal-100">
            {isRejected ? 'Organizer Account Status' : 'Account Under Administrative Review'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isRejected ? (
              <span>Your organizer registration was rejected by the campus administrator. You are currently restricted from creating or publishing events.</span>
            ) : (
              <span>Your organizer account is currently under review by the administrator. Once approved, you will be granted full access to create, publish, and manage campus events.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#01424E] dark:text-teal-200 font-semibold">
            <Mail className="h-4 w-4 text-[#007C46]" /> Questions regarding approval?
          </div>
          <p className="text-muted-foreground">
            Contact the EventHub Administration team at <strong className="text-slate-800 dark:text-slate-200">admin@eventhub.edu</strong> for verification status updates.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              router.push('/organizer/dashboard');
            }}
            className="w-full sm:w-auto"
          >
            Return to Dashboard
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#01424E] text-[#7CEAAB] hover:bg-[#013540] w-full sm:w-auto font-bold"
          >
            Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
