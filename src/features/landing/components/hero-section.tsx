import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Users, Award, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative pt-10 sm:pt-14 lg:pt-20 pb-16 lg:pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 -z-10"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7CEAAB]/10 blur-[100px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#01424E]/10 blur-[100px] rounded-full -z-10"></div>

      <div className="container mx-auto px-3 sm:px-5 lg:px-6 max-w-[1400px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium mb-6 text-[#01424E] dark:text-[#7CEAAB]">
              <Sparkles className="w-4 h-4" />
              <span>✨ AI-Powered Event Management</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
              Manage Campus Events <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#01424E] to-[#41B177] dark:from-[#7CEAAB] dark:to-[#41B177]">
                Without the Chaos.
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl leading-relaxed">
              The all-in-one platform for students, organizers, and volunteers. Streamline registrations, automate attendance with QR codes, and issue certificates effortlessly.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Button size="lg" className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold rounded-xl cursor-pointer shadow-md" asChild>
                <Link href="/signup" className="px-6 py-3 flex items-center justify-center">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="font-bold rounded-xl cursor-pointer shadow-sm" asChild>
                <Link href="/events" className="px-6 py-3 flex items-center justify-center">Explore Events</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 w-full">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">50+</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Events</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">10K+</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Participants</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">500+</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Volunteers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">98%</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Mockup */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 animate-[float_6s_ease-in-out_infinite]">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#01424E] flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                </div>
              </div>

              {/* Top Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[Users, Award, BarChart3].map((Icon, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col gap-2">
                    <Icon className="w-5 h-5 text-[#41B177]" />
                    <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded mt-1"></div>
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>

              {/* Main Area */}
              <div className="flex-1 flex gap-4 mt-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col justify-end">
                  {/* Chart mockup */}
                  <div className="flex items-end gap-2 h-24">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#7CEAAB] rounded-t-sm" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="w-1/3 flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex-1">
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Decorative float elements (hidden on small mobile screens to prevent overflow & clutter) */}
            <div className="hidden sm:block absolute -right-6 top-1/4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-[float_5s_ease-in-out_infinite_reverse]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-white">Attendance Marked</p>
                  <p className="text-xs text-slate-500">Just now</p>
                </div>
              </div>
            </div>

            <div className="hidden sm:block absolute -left-8 bottom-1/4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-[float_7s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#01424E] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#7CEAAB]" />
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-white">AI Description Generated</p>
                  <p className="text-xs text-slate-500">Ready to publish</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      ` }} />
    </section>
  );
}
