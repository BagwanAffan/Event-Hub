'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Access Denied</h1>
          <p className="text-lg text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button onClick={() => router.back()} variant="outline" className="w-full sm:w-auto">
            Go Back
          </Button>
          <Button className="w-full sm:w-auto">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
