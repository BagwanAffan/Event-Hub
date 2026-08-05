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

export function getAdaptiveItemStyles() {
  return {
    navGap: 'gap-1.5',
    itemPadding: 'py-2.5 px-3.5',
    minHeight: 'min-h-[40px]',
    iconGap: 'gap-3',
  };
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
      { name: 'Profile', icon: User, href: '/student/profile' },
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
      { name: 'Profile', icon: User, href: '/organizer/profile' },
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
      { name: 'Profile', icon: User, href: '/volunteer/profile' },
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
      { name: 'Profile', icon: User, href: '/admin/profile' },
    ],
  };

  const items = navItems[role as keyof typeof navItems] || navItems.student;
  
  // Hover auto-expand effect:
  // When collapsed, sidebar shows icons only at 80px.
  // Hovering over sidebar expands it to 270px for ALL roles.
  const showExpanded = !isCollapsed || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col bg-[#01424E] text-slate-100 transition-all duration-300 ease-in-out hidden md:flex z-30 shadow-xl select-none",
        isCollapsed && !isHovered ? "w-[80px]" : "w-[270px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 shrink-0">
        {showExpanded ? (
          <>
            <Link href={`/${role}/dashboard`} className="flex items-center gap-2.5 font-extrabold text-xl text-white tracking-tight truncate">
              <div className="bg-[#7CEAAB] rounded-lg p-1.5 shadow-sm shrink-0">
                <Calendar className="h-5 w-5 text-[#01424E]" />
              </div>
              <span className="truncate">EventHub</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer shrink-0"
              title={isCollapsed ? "Lock Expanded Sidebar" : "Collapse Sidebar (Auto-expand on hover)"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4 text-[#7CEAAB]" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </>
        ) : (
          <button
            onClick={toggle}
            className="mx-auto bg-[#7CEAAB] rounded-lg p-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer"
            title="Expand Sidebar"
          >
            <Calendar className="h-6 w-6 text-[#01424E]" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        <nav className="flex flex-col gap-1.5 px-3.5">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold min-h-[40px] transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-[#7CEAAB]/20 text-[#7CEAAB] font-bold shadow-xs"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                  !showExpanded ? "justify-center px-0" : ""
                )}
                title={!showExpanded ? item.name : undefined}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-[#7CEAAB]" : "text-slate-400 group-hover:text-white")} />
                {showExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="border-t border-white/10 p-3.5 shrink-0 bg-[#01353e]/40">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-white/50" />
          </div>
        ) : profile ? (
          <div className={cn("flex items-center", !showExpanded ? "justify-center" : "gap-3")}>
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/20 border border-[#7CEAAB]/40 flex items-center justify-center font-bold text-[#7CEAAB] text-xs shadow-inner">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profile.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {showExpanded && (
              <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                <span className="truncate text-xs font-bold text-white">{profile.full_name}</span>
                <span className="truncate text-[10px] text-[#7CEAAB] uppercase font-bold tracking-wider">{profile.role}</span>
              </div>
            )}
            {showExpanded && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg shrink-0 cursor-pointer"
                onClick={signOut}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          showExpanded && (
            <Button variant="outline" className="w-full text-xs font-bold text-white border-white/20 hover:bg-white/10" onClick={signOut}>
              Logout
            </Button>
          )
        )}
        {!showExpanded && profile && (
          <Button
            variant="ghost"
            size="icon"
            className="mt-2 w-full text-slate-400 hover:text-red-400 hover:bg-white/10 flex justify-center cursor-pointer"
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
