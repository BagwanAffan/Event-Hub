'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed border-2 border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <CardContent className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#edfcf6] dark:bg-teal-950/60 text-[#007C46] flex items-center justify-center shadow-inner">
          <Icon className="h-7 w-7" />
        </div>

        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-bold text-[#01424E] dark:text-teal-100">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {actionLabel && (
          <div className="pt-2">
            {actionHref ? (
              <Button asChild className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold text-xs shadow-md">
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : onAction ? (
              <Button onClick={onAction} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold text-xs shadow-md">
                {actionLabel}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
