import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="bg-gradient-to-r from-[#01424E] to-[#007C46] rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
            Ready to Organize Better Events?
          </h2>
          <p className="text-lg text-[#7CEAAB] mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of students and organizers already using EventHub to streamline their campus events.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 relative z-10">
            <Button size="lg" className="bg-[#7CEAAB] hover:bg-[#41B177] text-[#01424E] font-bold rounded-xl cursor-pointer shadow-md" asChild>
              <Link href="/signup" className="px-6 py-3 flex items-center justify-center">Create Free Account</Link>
            </Button>
            <Button size="lg" className="bg-white/10 hover:bg-white text-white hover:text-[#01424E] border-2 border-white/80 font-bold rounded-xl cursor-pointer shadow-sm transition-all" asChild>
              <Link href="/events" className="px-6 py-3 flex items-center justify-center">Explore Events</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
