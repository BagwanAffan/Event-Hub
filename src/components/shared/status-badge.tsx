import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().trim();
  
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let colorClasses = "";

  if (['approved', 'checked_in', 'completed'].includes(normalizedStatus)) {
    colorClasses = "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400";
    variant = "secondary";
  } else if (['pending', 'pending_payment', 'under_review'].includes(normalizedStatus)) {
    colorClasses = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400";
    variant = "secondary";
  } else if (['rejected', 'cancelled', 'absent'].includes(normalizedStatus)) {
    colorClasses = "bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400";
    variant = "destructive";
  } else if (['draft'].includes(normalizedStatus)) {
    colorClasses = "bg-slate-100 text-slate-800 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300";
    variant = "secondary";
  } else if (['published', 'active'].includes(normalizedStatus)) {
    colorClasses = "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400";
    variant = "secondary";
  } else {
    variant = "outline";
  }

  // Format status text: replace underscores with spaces and capitalize words
  const formattedStatus = normalizedStatus
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Badge variant={variant} className={cn("font-medium", colorClasses, className)}>
      {formattedStatus}
    </Badge>
  );
}
