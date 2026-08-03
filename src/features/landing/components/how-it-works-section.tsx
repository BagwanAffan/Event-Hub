import { Calendar, ClipboardList, CreditCard, QrCode, ScanLine, Award } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    { title: "Create Event", icon: Calendar, desc: "Set up details." },
    { title: "Registrations", icon: ClipboardList, desc: "Receive attendees." },
    { title: "Verify Payments", icon: CreditCard, desc: "Confirm dues." },
    { title: "Generate QR Passes", icon: QrCode, desc: "Send to users." },
    { title: "Scan & Track", icon: ScanLine, desc: "Mark attendance." },
    { title: "Certificates", icon: Award, desc: "Issue automatically." },
  ];

  return (
    <section className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[#41B177] font-semibold tracking-wide uppercase text-sm mb-3">
            How It Works
          </h2>
          <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            From creation to certificates in six simple steps
          </p>
        </div>

        <div className="mt-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-900 shadow-xl flex items-center justify-center mb-4 relative">
                  <step.icon className="w-6 h-6 text-[#01424E] dark:text-[#7CEAAB]" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#41B177] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
