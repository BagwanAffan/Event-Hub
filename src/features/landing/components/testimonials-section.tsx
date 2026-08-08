import { Zap, QrCode, Sparkles } from 'lucide-react';

export default function TestimonialsSection() {
  const benefits = [
    {
      title: "Zero Manual Work",
      description: "Automate registrations, payments, attendance, and certificates. No more spreadsheets.",
      icon: Zap
    },
    {
      title: "Real-time QR Check-in",
      description: "Volunteers scan QR codes at gates for instant attendance verification.",
      icon: QrCode
    },
    {
      title: "AI-Powered Management",
      description: "Generate event descriptions, emails, and reports with our built-in AI Copilot.",
      icon: Sparkles
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-slate-50 dark:bg-[#151515]/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#01424E] dark:text-[#F5F5F5]">
            Why Choose EventHub?
          </h2>
          <p className="text-lg text-slate-600 dark:text-[#9CA3AF] mt-4">
            Everything you need to manage your campus events flawlessly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="bg-white dark:bg-[#151515] p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-white/[0.08] hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 rounded-xl bg-[#01424E]/5 dark:bg-[#7CEAAB]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7 text-[#007C46] dark:text-[#7CEAAB]" />
                </div>
                <h4 className="text-xl font-bold text-[#01424E] dark:text-[#F5F5F5] mb-3">{b.title}</h4>
                <p className="text-slate-600 dark:text-[#9CA3AF] leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
