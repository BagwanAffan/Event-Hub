export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24 space-y-16 max-w-7xl animate-fade-in">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#01424E] dark:text-teal-100">About EventHub</h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          The all-in-one platform for managing college events, volunteers, and certificates seamlessly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-[#01424E] dark:text-teal-100">Our Mission</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            We aim to simplify the chaos of college event organization. From registrations to attendance tracking and certificate generation, EventHub provides a unified digital experience for students, volunteers, and organizers.
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl aspect-video relative overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60" alt="Students organizing event" className="object-cover w-full h-full" />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-8 md:p-12 space-y-8 text-center border border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-[#01424E] dark:text-teal-100">Platform Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Smart Registration', desc: 'Seamless event discovery and quick student registrations.' },
            { title: 'Volunteer Management', desc: 'Assign tasks, track progress, and coordinate effectively.' },
            { title: 'QR Attendance', desc: 'Fast, secure check-ins using dynamic QR codes.' },
            { title: 'Automated Certificates', desc: 'Generate and distribute verifiable certificates instantly.' }
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 space-y-3">
              <h3 className="font-bold text-base text-[#01424E] dark:text-teal-100">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-2xl font-bold text-[#01424E] dark:text-teal-100">Technology Stack</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Built with modern web technologies including Next.js 16, React 19, Tailwind CSS, and Supabase for a robust and scalable experience.</p>
      </div>
    </div>
  );
}
