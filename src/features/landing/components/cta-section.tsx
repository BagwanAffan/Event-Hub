import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="bg-gradient-to-r from-[#01424E] to-[#007C46] dark:bg-none dark:bg-[#0B1411] dark:bg-[radial-gradient(circle_at_85%_50%,rgba(34,197,94,0.18),transparent_45%),linear-gradient(110deg,#0B1411_0%,#0D1B15_55%,#10271A_100%)] dark:border dark:border-[rgba(74,222,128,0.16)] rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white dark:text-[#F5F5F5] mb-6 relative z-10">
            Ready to Organize Better Events?
          </h2>
          <p className="text-lg text-[#7CEAAB] dark:text-[#B5BDB8] mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of students and organizers already using EventHub to streamline their campus events.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 relative z-10">
            <Button size="lg" className="bg-[#7CEAAB] hover:bg-[#41B177] text-[#01424E] dark:bg-[#4ADE80] dark:text-[#052E16] dark:hover:bg-[#22C55E] font-bold rounded-xl cursor-pointer shadow-md border-0" asChild>
              <Link href="/signup" className="px-6 py-3 flex items-center justify-center">Create Free Account</Link>
            </Button>
            <Button size="lg" className="bg-white/10 hover:bg-white text-white hover:text-[#01424E] border-2 border-white/80 dark:bg-white/[0.04] dark:border dark:border-white/10 dark:text-[#F5F5F5] dark:hover:bg-[#22C55E]/10 dark:hover:text-[#F5F5F5] font-bold rounded-xl cursor-pointer shadow-sm transition-all" asChild>
              <Link href="/events" className="px-6 py-3 flex items-center justify-center">Explore Events</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
