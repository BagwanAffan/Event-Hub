'use client';

import { Calendar, Users, QrCode, Award, Zap } from 'lucide-react';

export default function StatsSection() {
  const stats = [
    { label: 'Platform Management', value: '3 Portals', icon: Users, desc: 'Student, Organizer, and Volunteer' },
    { label: 'Attendance System', value: 'QR-Powered', icon: QrCode, desc: 'Instant check-in verification' },
    { label: 'Smart Automations', value: 'AI Copilot', icon: Zap, desc: 'Automated descriptions & emails' },
    { label: 'Verifiable Awards', value: 'PDF Certificates', icon: Award, desc: 'Instant verifiable generation' },
  ];

  return (
    <section className="py-12 bg-[#01424E] text-white dark:bg-[#0B1210] dark:border-y dark:border-[rgba(74,222,128,0.10)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(34,197,94,0.10),transparent_35%),radial-gradient(circle_at_80%_50%,rgba(16,185,129,0.06),transparent_35%),#0B1210]">
      <div className="container mx-auto px-3 sm:px-5 lg:px-6 max-w-[1400px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center space-y-2 group">
                <div className="p-3 rounded-2xl bg-white/10 text-[#7CEAAB] dark:bg-[#12251B] dark:text-[#4ADE80] dark:border dark:border-[rgba(74,222,128,0.15)] group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#7CEAAB] dark:text-[#4ADE80] font-sans">
                  {item.value}
                </div>
                <div className="text-sm font-semibold text-white dark:text-[#F5F5F5]">{item.label}</div>
                <div className="text-xs text-[#d1f8e8]/70 dark:text-[#9CA3AF]">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
