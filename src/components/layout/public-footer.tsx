import Link from "next/link";
import { Calendar, Mail, Globe, Share2 } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-[#01424E] dark:text-[#7CEAAB]" />
              <span className="text-xl font-bold text-[#01424E] dark:text-white">
                EventHub
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              The premier centralized event and volunteer management platform for colleges and universities.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <Link href="#" className="hover:text-[#01424E] dark:hover:text-[#7CEAAB] transition-colors"><Mail className="w-5 h-5" /></Link>
              <Link href="#" className="hover:text-[#01424E] dark:hover:text-[#7CEAAB] transition-colors"><Globe className="w-5 h-5" /></Link>
              <Link href="#" className="hover:text-[#01424E] dark:hover:text-[#7CEAAB] transition-colors"><Share2 className="w-5 h-5" /></Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Home</Link></li>
              <li><Link href="/#features" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Features</Link></li>
              <li><Link href="/events" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Events</Link></li>
              <li><Link href="/about" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Platform</h3>
            <ul className="space-y-3">
              <li><Link href="/login" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Student Portal</Link></li>
              <li><Link href="/login" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Organizer Dashboard</Link></li>
              <li><Link href="/login" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Volunteer Workspace</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-500 hover:text-[#01424E] dark:text-slate-400 dark:hover:text-[#7CEAAB] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center md:text-left text-slate-500 dark:text-slate-400">
          <p>© 2026 EventHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
