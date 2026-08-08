"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Calendar, Sun, Moon, ArrowUpRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Passive scroll listener for glass effect & scroll spy
  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);

      // Scroll spy logic for homepage sections
      if (pathname === "/") {
        const sections = ["features", "modules", "faq"];
        let currentSection = "";

        for (const sectionId of sections) {
          const el = document.getElementById(sectionId);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
              currentSection = sectionId;
              break;
            }
          }
        }
        setActiveSection(currentSection);
      } else {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/", id: "" },
    { name: "Events", href: "/events", id: "" },
    { name: "About", href: "/about", id: "" },
    { name: "Contact", href: "/contact", id: "" },
  ];

  const checkIsActive = (href: string, sectionId: string) => {
    if (pathname === "/" && sectionId) {
      return activeSection === sectionId;
    }
    if (href === "/") {
      return pathname === "/" && !activeSection;
    }
    if (href === "/events") {
      return pathname.startsWith("/events");
    }
    return pathname === href;
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("");
    } else {
      router.push("/");
    }
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href === "/" && pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 w-full z-50 transition-all duration-250 ease-in-out",
        isScrolled
          ? "bg-white/90 dark:bg-[#090909]/90 backdrop-blur-md shadow-sm border-b border-slate-200/60 dark:border-white/[0.08]"
          : "bg-transparent border-b border-transparent shadow-none"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 group cursor-pointer [&_*]:pointer-events-none"
            >
              <div className="p-1.5 rounded-xl bg-[#01424E] text-[#7CEAAB] group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#01424E] dark:text-[#F5F5F5] select-none">
                EventHub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-[#181818] p-1.5 rounded-full border border-slate-200/60 dark:border-white/[0.08]">
            {navLinks.map((link) => {
              const isActive = checkIsActive(link.href, link.id);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={cn(
                    "text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer select-none [&_*]:pointer-events-none",
                    isActive
                      ? "bg-[#01424E] text-[#7CEAAB] dark:bg-[#15271B] dark:text-[#22C55E] dark:border dark:border-[#22C55E]/30 shadow-sm font-bold"
                      : "text-slate-600 dark:text-[#CFCFCF] hover:text-[#01424E] dark:hover:text-[#F5F5F5] hover:bg-white/60 dark:hover:bg-[#1F1F1F]"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Action Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1F1F1F] dark:border dark:border-white/[0.08] transition-colors"
                title="Toggle Theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#22C55E]" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 rounded-full font-bold text-xs cursor-pointer px-4 border border-slate-200 dark:border-white/[0.08] dark:text-[#F5F5F5] dark:hover:bg-[#1F1F1F] hover:border-[#01424E] transition-colors flex items-center justify-center"
              )}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-9 bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] dark:bg-[#22C55E] dark:text-[#090909] dark:hover:bg-[#16A34A] font-bold text-xs rounded-full px-5 shadow-sm cursor-pointer transition-colors flex items-center justify-center"
              )}
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-full cursor-pointer"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-teal-400" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full cursor-pointer" />}>
                <Menu className="h-5 w-5 text-[#01424E] dark:text-white" />
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6">
                <SheetTitle className="text-[#01424E] dark:text-teal-100 flex items-center gap-2 text-lg font-bold">
                  <Calendar className="h-5 w-5 text-[#007C46]" /> EventHub Navigation
                </SheetTitle>
                <div className="flex flex-col gap-2 mt-6">
                  {navLinks.map((link) => {
                    const isActive = checkIsActive(link.href, link.id);
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => handleNavClick(link.href)}
                        className={cn(
                          "text-sm font-semibold px-4 py-3 rounded-xl transition-all cursor-pointer",
                          isActive
                            ? "bg-[#01424E] text-[#7CEAAB] font-bold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer"
                      )}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "w-full h-10 bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer"
                      )}
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
