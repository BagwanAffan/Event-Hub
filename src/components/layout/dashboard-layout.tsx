'use client';

import { Sidebar } from './sidebar';
import { TopNavbar } from './top-navbar';
import { useSidebarStore } from '@/store/sidebar-store';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isMobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-[#01424E] border-none text-white">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="h-full w-full">
            {/* The sidebar will detect it's not hidden on md and behave accordingly, but here we can force it, 
                however our main Sidebar has hidden md:flex. We will just render a non-hidden version for mobile */}
            <MobileSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[1440px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// A simplified version of Sidebar just for the mobile Sheet to avoid conflicting states
function MobileSidebar() {
  // Can just reuse the Sidebar component logic or render it slightly modified.
  // We'll dynamically render the exact same Sidebar but overriding the hidden classes.
  return (
    <div className="[&>div:first-child]:hidden block">
      {/* To avoid huge duplication, we render the Sidebar but override the display classes in global CSS or here */}
      <div className="h-full w-full [&>div]:w-full [&>div]:!flex [&>button]:hidden">
        <SidebarMobileContent />
      </div>
    </div>
  );
}

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard, Calendar, ClipboardList, Users, Award, Bell, User, Settings,
  CreditCard, Heart, ScanLine, BarChart3, Sparkles, CheckSquare, UserCheck, FileText, LogOut, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function SidebarMobileContent() {
  const pathname = usePathname();
  const { profile, loading, signOut } = useAuth();
  const { setMobileOpen } = useSidebarStore();
  
  const role = profile?.role || 'student';

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
      { name: 'Assigned Events', icon: Calendar, href: '/volunteer/events' },
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

  return (
    <div className="flex h-full flex-col bg-[#01424E] text-slate-100">
      <div className="flex h-16 items-center px-4 border-b border-white/10">
        <Link href={`/${role}/dashboard`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-bold text-xl text-white tracking-wide">
          <div className="bg-[#7CEAAB] rounded p-1">
            <Calendar className="h-5 w-5 text-[#01424E]" />
          </div>
          EventHub
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col gap-1 px-3">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#7CEAAB]/15 text-[#7CEAAB]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[#7CEAAB]" : "text-slate-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-4">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-white/50" />
          </div>
        ) : profile ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/20 flex items-center justify-center font-bold text-[#7CEAAB]">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profile.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-white">{profile.full_name}</span>
              <span className="truncate text-xs text-[#7CEAAB] uppercase tracking-wider">{profile.role}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-slate-400 hover:text-white hover:bg-white/10"
              onClick={() => {
                setMobileOpen(false);
                signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10" onClick={() => {
            setMobileOpen(false);
            signOut();
          }}>
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
