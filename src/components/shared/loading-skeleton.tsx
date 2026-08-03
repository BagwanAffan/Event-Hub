import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-4/5" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rowCount = 5, className }: { rowCount?: number; className?: string }) {
  return (
    <div className={cn("rounded-md border", className)}>
      <div className="border-b px-4 py-3">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {Array.from({ length: rowCount }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 border-b px-4 py-4 last:border-0">
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden rounded-xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="w-1/2 h-4" />
        <Skeleton className="w-4 h-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-1/3 h-8 mt-2 mb-1" />
        <Skeleton className="w-2/3 h-3" />
      </CardContent>
    </Card>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
