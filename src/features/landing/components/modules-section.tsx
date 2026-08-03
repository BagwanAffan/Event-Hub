import { GraduationCap, LayoutDashboard, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function ModulesSection() {
  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[#41B177] font-semibold tracking-wide uppercase text-sm mb-3">
            Built for Everyone
          </h2>
          <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Tailored portals for every role
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Card 1: Student Portal (Light Blue Shade) */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Student Portal</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-sm">
              Discover events, register individually or as a team, track your progress, and earn certificates.
            </p>
            <ul className="space-y-2.5 mb-8 text-sm text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2"><span className="text-blue-600 dark:text-blue-400 font-bold">✓</span> Browse campus events</li>
              <li className="flex items-center gap-2"><span className="text-blue-600 dark:text-blue-400 font-bold">✓</span> Manage team formations</li>
              <li className="flex items-center gap-2"><span className="text-blue-600 dark:text-blue-400 font-bold">✓</span> Download certificates</li>
            </ul>
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline inline-flex items-center gap-1">
              Learn More →
            </Link>
          </div>

          {/* Card 2: Organizer Dashboard (Light Emerald/Teal Shade) */}
          <div className="bg-[#edfcf6] dark:bg-teal-950/30 rounded-2xl p-8 border-2 border-[#41B177]/50 dark:border-teal-800/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7CEAAB] to-[#007C46]"></div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-teal-900/50 flex items-center justify-center mb-6">
              <LayoutDashboard className="w-6 h-6 text-[#007C46] dark:text-[#7CEAAB]" />
            </div>
            <h3 className="text-2xl font-bold text-[#01424E] dark:text-white mb-3">Organizer Dashboard</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-sm">
              Create events, manage registrations, view analytics, and use our AI assistant to automate tasks.
            </p>
            <ul className="space-y-2.5 mb-8 text-sm text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2"><span className="text-[#007C46] dark:text-[#7CEAAB] font-bold">✓</span> AI Event Copilot</li>
              <li className="flex items-center gap-2"><span className="text-[#007C46] dark:text-[#7CEAAB] font-bold">✓</span> Real-time Analytics</li>
              <li className="flex items-center gap-2"><span className="text-[#007C46] dark:text-[#7CEAAB] font-bold">✓</span> Volunteer assignment</li>
            </ul>
            <Link href="/login" className="text-[#007C46] dark:text-[#7CEAAB] font-bold text-sm hover:underline inline-flex items-center gap-1">
              Learn More →
            </Link>
          </div>

          {/* Card 3: Volunteer Workspace (Light Rose Shade) */}
          <div className="bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl p-8 border-2 border-rose-200 dark:border-rose-800/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600"></div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-6">
              <HeartHandshake className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Volunteer Workspace</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-sm">
              Accept tasks, scan QR codes at entry points, track your shifts, and earn recognition.
            </p>
            <ul className="space-y-2.5 mb-8 text-sm text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2"><span className="text-rose-600 dark:text-rose-400 font-bold">✓</span> Mobile QR Scanning</li>
              <li className="flex items-center gap-2"><span className="text-rose-600 dark:text-rose-400 font-bold">✓</span> Task assignments</li>
              <li className="flex items-center gap-2"><span className="text-rose-600 dark:text-rose-400 font-bold">✓</span> Shift tracking</li>
            </ul>
            <Link href="/login" className="text-rose-600 dark:text-rose-400 font-bold text-sm hover:underline inline-flex items-center gap-1">
              Learn More →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
