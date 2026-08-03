import { Sparkles, ScanLine, Users, Heart, Award, BarChart3, CreditCard, Bell } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      title: "AI Event Copilot",
      description: "Generate descriptions, rules, and schedules with AI assistant.",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "QR Attendance",
      description: "Fast, secure QR-based check-in system for participants.",
      icon: ScanLine,
      color: "text-[#01424E] dark:text-[#7CEAAB]",
      bg: "bg-[#01424E]/10 dark:bg-[#7CEAAB]/10",
    },
    {
      title: "Team Registration",
      description: "Register individually or form teams seamlessly.",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Volunteer Management",
      description: "Recruit, assign tasks, and manage volunteer shifts.",
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-100 dark:bg-rose-900/20",
    },
    {
      title: "Digital Certificates",
      description: "Auto-generate professional certificates instantly.",
      icon: Award,
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      title: "Real-time Analytics",
      description: "Interactive dashboards and actionable insights.",
      icon: BarChart3,
      color: "text-indigo-500",
      bg: "bg-indigo-100 dark:bg-indigo-900/20",
    },
    {
      title: "Payment Verification",
      description: "Streamlined simulated payment workflows.",
      icon: CreditCard,
      color: "text-emerald-500",
      bg: "bg-emerald-100 dark:bg-emerald-900/20",
    },
    {
      title: "Smart Notifications",
      description: "Stay updated with real-time alerts and emails.",
      icon: Bell,
      color: "text-orange-500",
      bg: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-32 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[#41B177] font-semibold tracking-wide uppercase text-sm mb-3">
            Everything You Need
          </h2>
          <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Powerful features for seamless event management
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
