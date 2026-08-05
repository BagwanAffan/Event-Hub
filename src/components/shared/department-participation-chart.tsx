'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { normalizeDepartmentName } from '@/lib/utils';

interface DepartmentData {
  department: string;
  count: number;
  percentage?: number;
}

interface DepartmentParticipationChartProps {
  data: DepartmentData[];
  height?: number;
}

const GREEN_PALETTE = [
  '#01424E',
  '#007C46',
  '#41B177',
  '#22C55E',
  '#10B981',
  '#059669',
  '#047857',
  '#065F46',
  '#14B8A6',
  '#0D9488',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: DepartmentData = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/60 backdrop-blur-sm text-xs space-y-1">
        <div className="font-bold text-sm text-[#7CEAAB]">{data.department}</div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Participants:</span>
          <span className="font-bold text-white font-mono">{data.count}</span>
        </div>
        {data.percentage !== undefined && (
          <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>Share of Total:</span>
            <span className="font-semibold text-[#7CEAAB]">{data.percentage}% of Total</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function DepartmentParticipationChart({ data = [], height = 300 }: DepartmentParticipationChartProps) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const countMap = new Map<string, number>();
    data.forEach((item) => {
      const canonical = normalizeDepartmentName(item.department);
      countMap.set(canonical, (countMap.get(canonical) || 0) + item.count);
    });

    const total = Array.from(countMap.values()).reduce((acc, curr) => acc + curr, 0);

    return Array.from(countMap.entries())
      .map(([department, count]) => ({
        department,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
          <BarChart3 className="h-7 w-7 text-[#007C46] opacity-70" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          No participation data available.
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Department metrics will render automatically as registered students complete their profiles.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(...processedData.map((d) => d.count), 1);
  const yDomainMax = Math.ceil(maxVal * 1.15);

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[540px] md:min-w-0 w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 24, right: 16, left: -16, bottom: 8 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
              className="dark:stroke-slate-800"
              opacity={0.6}
            />
            <XAxis
              dataKey="department"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 500, fill: '#94A3B8' }}
              allowDecimals={false}
              domain={[0, yDomainMax]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={GREEN_PALETTE[index % GREEN_PALETTE.length]}
                  className="transition-all duration-200 hover:opacity-80"
                />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                fill="#01424E"
                className="dark:fill-[#7CEAAB]"
                fontSize={11}
                fontWeight={700}
                offset={6}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
