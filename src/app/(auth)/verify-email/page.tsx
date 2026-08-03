'use client';

import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Check your email</h2>
        <p className="text-muted-foreground">
          We sent a verification link to your email address. Please verify to continue.
        </p>
      </div>

      <div className="pt-4 space-y-4">
        <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
          Resend verification email
        </Button>

        <div className="text-center text-sm">
          <Link href="/login" className="inline-flex items-center font-medium text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
