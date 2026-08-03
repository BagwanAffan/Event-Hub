import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - EventHub',
  description: 'Login or create an account for EventHub',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#01424E] to-[#007C46] items-center justify-center p-12">
        <div className="max-w-lg text-white space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">EventHub</h1>
            <p className="text-xl text-white/80">One Platform for Every Campus Event.</p>
          </div>
          <div className="space-y-4 text-white/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">✓</div>
              <span>Seamless event registration & management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">✓</div>
              <span>QR-based attendance verification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">✓</div>
              <span>AI-powered event copilot</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">✓</div>
              <span>Digital certificates & analytics</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
