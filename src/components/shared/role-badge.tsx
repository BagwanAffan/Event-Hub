import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: 'student' | 'organizer' | 'volunteer';
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  let colorClasses = "";

  if (role === 'student') {
    colorClasses = "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400 border-transparent";
  } else if (role === 'organizer') {
    colorClasses = "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400 border-transparent";
  } else if (role === 'volunteer') {
    colorClasses = "bg-orange-100 text-orange-800 hover:bg-orange-100/80 dark:bg-orange-900/30 dark:text-orange-400 border-transparent";
  }

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", colorClasses, className)}>
      {role}
    </Badge>
  );
}
