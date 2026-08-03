import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
      <div className="space-y-4">
        <h1 className="text-9xl font-extrabold text-primary/20 tracking-tighter">404</h1>
        <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/">
          <Button size="lg" className="w-full sm:w-auto">Go to Home</Button>
        </Link>
        <Link href="/events">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">Browse Events</Button>
        </Link>
      </div>
    </div>
  );
}
