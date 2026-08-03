import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden rounded-xl", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-1/3 h-8 mt-2 mb-1" />
          {description && <Skeleton className="w-2/3 h-3" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden rounded-xl shadow-sm transition-transform duration-200 hover:-translate-y-[2px]", 
        "dark:bg-slate-900/50",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-poppins">{value}</div>
        {(description || trend) && (
          <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
            {trend === 'up' && <span className="flex items-center text-[#41B177]"><TrendingUp className="w-3 h-3 mr-1"/></span>}
            {trend === 'down' && <span className="flex items-center text-red-500"><TrendingDown className="w-3 h-3 mr-1"/></span>}
            {trend === 'neutral' && <span className="flex items-center text-muted-foreground"><Minus className="w-3 h-3 mr-1"/></span>}
            <span>{description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
