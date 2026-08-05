'use client';

import { useState, useEffect, useCallback } from 'react';
import { Menu, Sun, Moon, Bell, LogOut, Settings, User, Search, AlertCircle, ChevronRight, PanelLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuth } from '@/hooks/use-auth';
import { useProfileCompletion } from '@/hooks/use-profile-completion';
import { notificationService, profileReminderActionUrl } from '@/services/notification-service';
import { eventService } from '@/services/event-service';
import { useDataSync } from '@/lib/data-sync';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

const TOAST_SESSION_KEY_PREFIX = 'eh_profile_toast_shown_';

function toastAlreadyShownThisSession(userId: string): boolean {
  if (typeof window === 'undefined') return true;
  return (window.sessionStorage && window.sessionStorage.getItem(TOAST_SESSION_KEY_PREFIX + userId) === '1');
}
function markToastShown(userId: string): void {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage && window.sessionStorage.setItem(TOAST_SESSION_KEY_PREFIX + userId, '1'); } catch {}
}

export function TopNavbar() {
  const { isCollapsed, toggle, setMobileOpen } = useSidebarStore();
  const { theme, setTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { isComplete, missingFields } = useProfileCompletion(profile);
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingEvents, setIsSearchingEvents] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingEvents(true);
      try {
        const res = await eventService.getPublicEvents({ search: searchQuery.trim(), limit: 5 });
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingEvents(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch real unread count with useDataSync
  const fetchUnreadCount = useCallback(async () => {
    if (!profile?.id) return;
    try {
      if (profile.role === 'admin') {
        notificationService.removeProfileReminder(profile.id).catch(() => {});
      }
      const c = await notificationService.getUnreadCount(profile.id);
      setUnreadCount(c);
    } catch {
      setUnreadCount(profile.role === 'admin' ? 0 : (isComplete ? 0 : 1));
    }
  }, [profile?.id, isComplete, profile?.role]);

  useDataSync(['notifications', 'profile'], fetchUnreadCount, [profile?.id, isComplete, profile?.role]);

  // Floating profile reminder notification on login (for all roles EXCEPT admin)
  // Lasts for 5 seconds and then automatically disappears
  useEffect(() => {
    if (!profile?.id) return;
    if (profile.role === 'admin') return; // Admin is explicitly excluded
    if (isComplete) return;
    if (toastAlreadyShownThisSession(profile.id)) return;
    markToastShown(profile.id);

    const role = profile.role || 'student';
    const url = profileReminderActionUrl(role);
    const actionBtn = (
      <Button
        size="sm"
        className="bg-[#007C46] text-white hover:bg-[#01424E] font-semibold text-xs shrink-0 shadow-sm"
        onClick={() => {
          router.push(url);
        }}
      >
        Complete Profile
      </Button>
    );

    toast.warning('Complete your profile to unlock all EventHub features.', {
      description: missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : undefined,
      duration: 5000, // Disappears automatically after 5 seconds
      action: actionBtn as any,
      className: 'bg-card text-card-foreground border-border shadow-xl font-sans text-xs',
    });
  }, [profile, isComplete, missingFields, router]);

  // Generate Dynamic Breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return { label, href, isLast: index === pathSegments.length - 1 };
  });

  const role = profile?.role || 'student';

  const quickNav = [
    { label: 'Browse Campus Events', href: `/${role}/events` },
    { label: 'My Registrations & Passes', href: `/${role}/registrations` },
    { label: 'Digital Certificates', href: `/${role}/certificates` },
    { label: 'AI Event Copilot', href: `/organizer/ai` },
    { label: 'Public Certificate Verification', href: `/verify-certificate` },
  ];

  const handleCommandSelect = (href: string) => {
    setIsSearchOpen(false);
    router.push(href);
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-[64px] items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex text-slate-500 hover:text-[#007C46] dark:text-slate-400 dark:hover:text-teal-200 cursor-pointer"
          onClick={toggle}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar (Auto-expand on hover)"}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center gap-4 min-w-0">
          {/* Dynamic Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground overflow-hidden">
            <Link href={`/${role}/dashboard`} className="hover:text-[#007C46] font-medium transition-colors">
              Dashboard
            </Link>
            {breadcrumbItems.length > 1 && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {breadcrumbItems.slice(1).map((item, idx) => (
                  <span key={item.href} className="flex items-center gap-1.5 truncate">
                    {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                    {item.isLast ? (
                      <span className="font-bold text-[#01424E] dark:text-teal-200 truncate">{item.label}</span>
                    ) : (
                      <Link href={item.href} className="hover:text-[#007C46] transition-colors truncate font-medium">
                        {item.label}
                      </Link>
                    )}
                  </span>
                ))}
              </>
            )}
          </nav>

          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-muted-foreground text-xs hover:border-[#7CEAAB] transition-colors w-48 sm:w-64 cursor-pointer ml-auto sm:ml-0"
          >
            <Search className="h-3.5 w-3.5 text-[#007C46]" />
            <span className="truncate">Search events, passes...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] capitalize hidden lg:inline-flex text-xs font-bold">
            {role}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-teal-400" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href={`/${role}/notifications`}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#007C46] text-[10px] font-bold text-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center relative h-9 w-9 rounded-full ml-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none cursor-pointer">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#01424E] text-[#7CEAAB] font-bold text-sm shadow-sm border border-[#7CEAAB]/30">
                {profile?.profile_picture ? (
                  <img src={profile.profile_picture} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              {!isComplete && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none text-[#01424E] dark:text-teal-200">{profile?.full_name || 'User Profile'}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {profile?.role || 'student'}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {!isComplete && (
                <div className="px-2 py-2 mb-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Complete your profile
                  </p>
                  <Button
                    size="sm"
                    className="mt-1.5 w-full h-7 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                    onClick={() => router.push(profileReminderActionUrl(role))}
                  >
                    Complete Now
                  </Button>
                </div>
              )}
              <DropdownMenuItem onClick={() => router.push(`/${role}/profile`)} className="cursor-pointer">
                <User className="mr-2 h-4 w-4 text-[#007C46]" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${role}/settings`)} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 focus:text-red-600 font-semibold">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Command Palette Modal */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <Search className="h-4 w-4 text-[#007C46]" /> Global Navigation & Search
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4 text-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setIsSearchOpen(false);
                  router.push(`/${role}/events?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            >
              <Input
                autoFocus
                placeholder="Search events, venue, pages (Press Enter)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 text-xs"
              />
            </form>

            {/* Event Search Results */}
            {searchQuery.trim() && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Matching Events</span>
                {isSearchingEvents ? (
                  <div className="p-2 text-xs text-muted-foreground">Searching campus events...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => handleCommandSelect(`/${role}/events/${evt.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left font-medium transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{evt.title}</span>
                        <span className="text-[10px] text-muted-foreground">{evt.category || 'Event'} • {evt.venue || 'Campus'}</span>
                      </div>
                      <span className="text-muted-foreground font-mono">→</span>
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground">No events found matching "{searchQuery}"</div>
                )}
              </div>
            )}

            {/* Quick Shortcuts */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Shortcuts</span>
              {quickNav
                .filter((item) => !searchQuery.trim() || item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCommandSelect(item.href)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left font-medium transition-colors cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <span className="text-muted-foreground font-mono">→</span>
                  </button>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
