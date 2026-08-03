import { QrCode, ScanLine, CheckCircle2 } from "lucide-react";

export default function QrShowcaseSection() {
  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center flex-row-reverse">
          
          <div className="order-2 lg:order-1">
            <div className="relative mx-auto w-64 h-64 bg-white p-4 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-800" />
              
              {/* Scanning line animation */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#41B177] shadow-[0_0_10px_#41B177] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes scan {
                0% { top: 0; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
            ` }} />
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-[#41B177] font-semibold tracking-wide uppercase text-sm mb-3">
              QR Attendance System
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Fast, secure, and reliable check-in
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Ditch the paper lists and long queues. Our QR system allows volunteers to scan participants in seconds using their mobile devices.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-lg">1. Generate QR</h4>
                  <p className="text-slate-600 dark:text-slate-400">Participants receive a unique QR code pass via email upon approval.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <ScanLine className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-lg">2. Scan at Entry</h4>
                  <p className="text-slate-600 dark:text-slate-400">Volunteers scan codes using the built-in web scanner on their phones.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-lg">3. Attendance Recorded</h4>
                  <p className="text-slate-600 dark:text-slate-400">Data syncs instantly to the dashboard, updating analytics in real-time.</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
