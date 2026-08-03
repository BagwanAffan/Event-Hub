import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 min-h-[400px] border border-dashed rounded-xl", className)}>
      {icon && (
        <div className="mb-4 text-muted-foreground flex items-center justify-center w-16 h-16 rounded-full bg-muted/50">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        {description}
      </p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} className="bg-[#01424E] text-white hover:bg-[#01424E]/90 dark:bg-[#7CEAAB] dark:text-[#01424E] dark:hover:bg-[#7CEAAB]/90">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
