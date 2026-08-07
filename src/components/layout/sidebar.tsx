'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useSidebarStore } from '@/store/sidebar-store';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Award,
  Bell,
  User,
  Settings,
  CreditCard,
  Heart,
  ScanLine,
  BarChart3,
  Sparkles,
  CheckSquare,
  UserCheck,
  FileText,
  LogOut,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Centralized reversible styling configuration following 8px system
export const SIDEBAR_CONFIG = {
  getAdaptiveStyles: (itemCount: number) => {
    if (itemCount <= 7) {
      // Admin (7), Student (7): Taller items with spacious 12px gaps
      return {
        navGap: 'gap-3',
        itemPadding: 'py-3.5 px-3.5',
        minHeight: 'min-h-[48px]',
        iconGap: 'gap-3.5',
      };
    } else if (itemCount <= 8) {
      // Volunteer (8): Spacious medium items
      return {
        navGap: 'gap-2.5',
        itemPadding: 'py-3 px-3.5',
        minHeight: 'min-h-[46px]',
        iconGap: 'gap-3.5',
      };
    } else {
      // Organizer (10): Medium height items with clean 8px spacing
      return {
        navGap: 'gap-2',
        itemPadding: 'py-2.5 px-3.5',
        minHeight: 'min-h-[42px]',
        iconGap: 'gap-3.5',
      };
    }
  },
  itemRadius: 'rounded-xl',
  iconTextGap: 'gap-3.5',
  activeClasses: 'bg-[#7CEAAB]/20 dark:bg-[#1F2B22] text-[#7CEAAB] dark:text-[#22C55E] font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.14)] border border-[#7CEAAB]/25 dark:border-[#22C55E]/30',
  inactiveClasses: 'text-slate-300 dark:text-[#CFCFCF] font-medium hover:bg-white/[0.08] dark:hover:bg-[#1F1F1F] hover:text-white dark:hover:text-[#F5F5F5] hover:translate-x-1',
  transition: 'transition-all duration-200 ease-out',
};

export function getAdaptiveItemStyles(itemCount = 7) {
  return SIDEBAR_CONFIG.getAdaptiveStyles(itemCount);
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile, loading, signOut } = useAuth();
  const { isCollapsed, toggle } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);

  const role = profile?.role || 'student'; // fallback

  const navItems = {
    student: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/student/dashboard' },
      { name: 'Events', icon: Calendar, href: '/student/events' },
      { name: 'My Registrations', icon: ClipboardList, href: '/student/registrations' },
      { name: 'My Teams', icon: Users, href: '/student/teams' },
      { name: 'Certificates', icon: Award, href: '/student/certificates' },
      { name: 'Notifications', icon: Bell, href: '/student/notifications' },
      { name: 'Settings', icon: Settings, href: '/student/settings' },
    ],
    organizer: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/organizer/dashboard' },
      { name: 'Events', icon: Calendar, href: '/organizer/events' },
      { name: 'Registrations', icon: ClipboardList, href: '/organizer/registrations' },
      { name: 'Payments', icon: CreditCard, href: '/organizer/payments' },
      { name: 'Volunteers', icon: Heart, href: '/organizer/volunteers' },
      { name: 'Attendance', icon: ScanLine, href: '/organizer/attendance' },
      { name: 'Certificates', icon: Award, href: '/organizer/certificates' },
      { name: 'Analytics', icon: BarChart3, href: '/organizer/analytics' },
      { name: 'AI Copilot', icon: Sparkles, href: '/organizer/ai' },
      { name: 'Notifications', icon: Bell, href: '/organizer/notifications' },
      { name: 'Settings', icon: Settings, href: '/organizer/settings' },
    ],
    volunteer: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/volunteer/dashboard' },
      { name: 'Events', icon: Calendar, href: '/volunteer/events' },
      { name: 'My Tasks', icon: CheckSquare, href: '/volunteer/tasks' },
      { name: 'QR Scanner', icon: ScanLine, href: '/volunteer/scanner' },
      { name: 'Attendance', icon: UserCheck, href: '/volunteer/attendance' },
      { name: 'Certificates', icon: Award, href: '/volunteer/certificates' },
      { name: 'Notifications', icon: Bell, href: '/volunteer/notifications' },
      { name: 'Settings', icon: Settings, href: '/volunteer/settings' },
    ],
    admin: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
      { name: 'Organizer Approvals', icon: UserCheck, href: '/admin/approvals' },
      { name: 'Organizers', icon: Users, href: '/admin/organizers' },
      { name: 'Events', icon: Calendar, href: '/admin/events' },
      { name: 'Users', icon: Users, href: '/admin/users' },
      { name: 'Reports', icon: FileText, href: '/admin/reports' },
      { name: 'Settings', icon: Settings, href: '/admin/settings' },
    ],
  };

  const items = navItems[role as keyof typeof navItems] || navItems.student;
  const adaptive = SIDEBAR_CONFIG.getAdaptiveStyles(items.length);

  // Hover auto-expand effect:
  // When collapsed, sidebar shows icons only at 80px.
  // Hovering over sidebar expands it to 270px for ALL roles.
  const showExpanded = !isCollapsed || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col bg-gradient-to-b from-[#014856] via-[#01424E] to-[#01353E] dark:from-[#0D0D0D] dark:via-[#0D0D0D] dark:to-[#0D0D0D] text-slate-100 dark:text-[#CFCFCF] transition-all duration-300 ease-in-out hidden md:flex z-30 shadow-xl select-none dark:border-r dark:border-white/[0.08]",
        isCollapsed && !isHovered ? "w-[80px]" : "w-[270px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 dark:border-white/[0.08] shrink-0">
        {showExpanded ? (
          <>
            <Link href={`/${role}/dashboard`} className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight truncate">
              <div className="bg-[#7CEAAB] dark:bg-[#22C55E] rounded-lg p-1.5 shadow-sm shrink-0">
                <Calendar className="h-5 w-5 text-[#01424E] dark:text-[#090909]" />
              </div>
              <span className="truncate">
                <span className="text-white dark:text-[#F5F5F5]">Event</span>
                <span className="text-[#7CEAAB] dark:text-[#22C55E]">Hub</span>
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-8 w-8 text-slate-300 dark:text-[#9CA3AF] hover:text-white dark:hover:text-[#F5F5F5] hover:bg-white/10 dark:hover:bg-[#1F1F1F] rounded-lg cursor-pointer shrink-0 transition-colors"
              title={isCollapsed ? "Lock Expanded Sidebar" : "Collapse Sidebar (Auto-expand on hover)"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4 text-[#7CEAAB] dark:text-[#22C55E]" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </>
        ) : (
          <button
            onClick={toggle}
            className="mx-auto bg-[#7CEAAB] dark:bg-[#22C55E] rounded-lg p-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer"
            title="Expand Sidebar"
          >
            <Calendar className="h-6 w-6 text-[#01424E] dark:text-[#090909]" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3.5 custom-scrollbar">
        <nav className={cn("flex flex-col", adaptive.navGap)}>
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center text-xs cursor-pointer group",
                  SIDEBAR_CONFIG.itemRadius,
                  SIDEBAR_CONFIG.iconTextGap,
                  SIDEBAR_CONFIG.transition,
                  adaptive.itemPadding,
                  adaptive.minHeight,
                  isActive
                    ? SIDEBAR_CONFIG.activeClasses
                    : SIDEBAR_CONFIG.inactiveClasses,
                  !showExpanded ? "justify-center px-0 hover:translate-x-0" : ""
                )}
                title={!showExpanded ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-105",
                    isActive ? "text-[#7CEAAB] dark:text-[#22C55E]" : "text-slate-400 dark:text-[#9CA3AF] group-hover:text-white dark:group-hover:text-[#F5F5F5]"
                  )}
                />
                {showExpanded && (
                  <span className="truncate tracking-tight">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="border-t border-white/10 dark:border-white/[0.08] p-3.5 shrink-0 bg-black/10 dark:bg-[#151515] rounded-b-xl">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-white/50" />
          </div>
        ) : profile ? (
          <div className={cn("flex items-center", !showExpanded ? "justify-center" : "gap-3")}>
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/20 dark:bg-[#15271B] border border-[#7CEAAB]/40 dark:border-[#22C55E]/40 flex items-center justify-center font-bold text-[#7CEAAB] dark:text-[#22C55E] text-xs shadow-inner ring-2 ring-[#7CEAAB]/20 dark:ring-[#22C55E]/20">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profile.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {showExpanded && (
              <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                <span className="truncate text-xs font-bold text-white dark:text-[#F5F5F5] tracking-tight">{profile.full_name}</span>
                <span className="truncate text-[10px] text-[#7CEAAB] dark:text-[#22C55E] uppercase font-bold tracking-wider">{profile.role}</span>
              </div>
            )}
            {showExpanded && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 dark:text-[#9CA3AF] hover:text-red-300 dark:hover:text-red-400 hover:bg-red-500/15 rounded-lg shrink-0 cursor-pointer transition-colors duration-200"
                onClick={signOut}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          showExpanded && (
            <Button variant="outline" className="w-full text-xs font-bold text-white dark:text-[#F5F5F5] border-white/20 dark:border-white/[0.08] hover:bg-white/10 dark:hover:bg-[#1F1F1F] transition-colors" onClick={signOut}>
              Logout
            </Button>
          )
        )}
        {!showExpanded && profile && (
          <Button
            variant="ghost"
            size="icon"
            className="mt-2 w-full text-slate-400 dark:text-[#9CA3AF] hover:text-red-300 dark:hover:text-red-400 hover:bg-red-500/15 flex justify-center cursor-pointer transition-colors duration-200"
            onClick={signOut}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
