'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileGuardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFields: string[];
  actionName?: string;
  userRole?: string;
}

export function ProfileGuardDialog({
  open,
  onOpenChange,
  missingFields,
  actionName = 'perform this action',
  userRole = 'student',
}: ProfileGuardDialogProps) {
  const router = useRouter();

  const handleCompleteNow = () => {
    onOpenChange(false);
    const safeRole = ['student', 'organizer', 'volunteer'].includes(userRole) ? userRole : 'student';
    router.push(`/${safeRole}/profile`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl text-[#01424E] dark:text-teal-100">
            Profile Completion Required
          </DialogTitle>
          <DialogDescription className="text-sm pt-1">
            You must complete your profile details before you can {actionName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Missing Required Fields:
          </p>
          <ul className="space-y-1.5 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/30 text-sm">
            {missingFields.map((field) => (
              <li key={field} className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="font-medium">{field}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            className="sm:flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="sm:flex-1 bg-[#01424E] hover:bg-[#007C46] text-white dark:bg-[#7CEAAB] dark:text-[#01424E] dark:hover:bg-[#7CEAAB]/90 font-semibold"
            onClick={handleCompleteNow}
          >
            <UserCheck className="mr-2 h-4 w-4" /> Complete Profile <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
