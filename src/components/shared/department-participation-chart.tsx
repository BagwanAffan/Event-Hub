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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: DepartmentData = payload[0].payload;
    const participantText = data.count === 1 ? '1 Participant' : `${data.count} Participants`;
    
    return (
      <div className="bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 backdrop-blur-md text-xs space-y-1.5 min-w-[140px]">
        <div className="font-bold text-sm text-[#7CEAAB] tracking-wide">{data.department}</div>
        <div className="font-semibold text-slate-100">{participantText}</div>
        {data.percentage !== undefined && (
          <div className="text-slate-400 text-[11px] font-medium pt-1 border-t border-slate-800/80">
            {data.percentage}% of Total
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
      .map(([department, count]) => {
        const rawPct = total > 0 ? (count / total) * 100 : 0;
        const percentage = Number.isInteger(rawPct) ? rawPct : Number(rawPct.toFixed(1));
        return {
          department,
          count,
          percentage,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800/80 mb-3 text-[#007C46] dark:text-[#7CEAAB]">
          <BarChart3 className="h-6 w-6 opacity-80" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
          No Department Data Available
        </p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Department participation metrics will appear automatically once registered students specify their academic branch.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(...processedData.map((d) => d.count), 0);
  const xDomainMax = maxVal > 0 ? Math.max(Math.ceil(maxVal * 1.2), maxVal + 1) : 5;

  return (
    <div className="w-full py-1">
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={processedData}
            margin={{ top: 12, right: 36, left: 16, bottom: 12 }}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="deptGrad0" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#01424E" />
                <stop offset="100%" stopColor="#007C46" />
              </linearGradient>
              <linearGradient id="deptGrad1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#007C46" />
                <stop offset="100%" stopColor="#41B177" />
              </linearGradient>
              <linearGradient id="deptGrad2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="deptGrad3" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
              <linearGradient id="deptGrad4" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#41B177" />
                <stop offset="100%" stopColor="#7CEAAB" />
              </linearGradient>
              <linearGradient id="deptGrad5" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              horizontal={false}
              stroke="#E2E8F0"
              className="dark:stroke-slate-800/80"
              opacity={0.6}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, xDomainMax]}
              tick={{ fontSize: 11, fontWeight: 500, fill: '#94A3B8' }}
            />
            <YAxis
              type="category"
              dataKey="department"
              axisLine={false}
              tickLine={false}
              width={140}
              tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
              className="dark:fill-slate-300"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.03)', radius: 6 }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              maxBarSize={26}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#deptGrad${index % 6})`}
                  className="transition-all duration-200 hover:opacity-85 hover:brightness-105 cursor-pointer"
                />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                fill="#01424E"
                className="dark:fill-[#7CEAAB]"
                fontSize={11}
                fontWeight={700}
                offset={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


