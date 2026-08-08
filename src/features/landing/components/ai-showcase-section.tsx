import { Sparkles } from "lucide-react";

export default function AiShowcaseSection() {
  return (
    <section className="py-20 lg:py-32 bg-slate-50 dark:bg-[#151515]/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[#41B177] font-semibold tracking-wide uppercase text-sm mb-3">
              AI Event Copilot
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-[#F5F5F5] mb-6">
              Your intelligent event planning assistant
            </p>
            <p className="text-lg text-slate-600 dark:text-[#9CA3AF] mb-8">
              Stop wasting hours writing descriptions and planning schedules. Our built-in AI helps you generate everything you need in seconds.
            </p>
            
            <ul className="space-y-4">
              {[
                "Generate engaging event descriptions",
                "Create comprehensive rulebooks",
                "Plan minute-by-minute schedules",
                "Draft participant announcement emails",
                "Analyze registration data trends"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-[#CFCFCF]">
                  <div className="w-6 h-6 rounded-full bg-[#7CEAAB]/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-[#007C46] dark:text-[#7CEAAB]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative p-6 bg-white dark:bg-[#151515] rounded-2xl shadow-xl border border-slate-200 dark:border-white/[0.08]">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 max-w-[80%] ml-auto">
                <div className="bg-slate-100 dark:bg-[#181818] p-3 rounded-2xl rounded-tr-sm text-sm text-slate-700 dark:text-[#CFCFCF]">
                  Draft a catchy description for a 24-hour Hackathon called "CodeFest 2026".
                </div>
              </div>
              
              <div className="flex gap-3 max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-[#01424E] flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#7CEAAB]" />
                </div>
                <div className="bg-[#01424E]/5 dark:bg-[#7CEAAB]/10 border border-[#01424E]/10 dark:border-[#7CEAAB]/20 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-800 dark:text-[#F5F5F5]">
                  <p className="font-semibold mb-2">Here's a description for CodeFest 2026:</p>
                  <p className="text-slate-600 dark:text-[#9CA3AF]">
                    Get ready to turn coffee into code at <strong>CodeFest 2026</strong>! 
                    Join us for an exhilarating 24-hour hackathon where innovation meets endurance. 
                    Whether you're a seasoned developer or a passionate beginner...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
