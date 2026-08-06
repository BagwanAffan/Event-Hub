'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { registrationService } from '@/services/registration-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/page-skeleton';
import { Search, Eye, QrCode, ListFilter, LayoutGrid, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDataSync } from '@/lib/data-sync';

export default function RegistrationsPage() {
  const { profile } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      if (registrations.length === 0) setLoading(true);
      const data = await registrationService.getUserRegistrations(profile.id);
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['registrations', 'events', 'payments'], loadData, [profile?.id]);

  const filteredRegistrations = registrations.filter(reg => 
    reg.events?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <Badge className="bg-[#41B177] hover:bg-[#007C46] font-bold">Approved</Badge>;
      case 'pending_payment':
      case 'pending': return <Badge variant="outline" className="text-orange-500 border-orange-500 font-bold">Pending</Badge>;
      case 'rejected': return <Badge variant="destructive" className="font-bold">Rejected</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved':
      case 'completed': return <Badge variant="outline" className="text-[#41B177] border-[#41B177] font-bold">Paid</Badge>;
      case 'under_review':
      case 'payment_under_review':
      case 'submitted': return <Badge variant="outline" className="text-amber-600 border-amber-600 font-bold">Under Review</Badge>;
      case 'pending': return <Badge variant="outline" className="text-orange-500 border-orange-500 font-bold">Pending</Badge>;
      case 'not_required':
      case 'free': return <Badge variant="outline" className="text-slate-500 border-slate-500 font-bold">Free</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status?.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6 fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
            My Registrations
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Track all your event registrations, tickets, and entry passes
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search events..." 
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex border rounded-md hidden sm:flex">
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')} className="rounded-r-none h-10 w-10">
              <ListFilter className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="rounded-l-none h-10 w-10">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : filteredRegistrations.length > 0 ? (
        viewMode === 'table' ? (
          <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="w-[300px] font-bold text-xs uppercase">Event Details</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Payment</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                      <TableCell>
                        <div className="font-bold text-[#01424E] dark:text-white mb-0.5">{reg.events?.title}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-[#007C46]" />
                          {reg.events?.start_date ? format(new Date(reg.events.start_date), 'MMM dd, yyyy') : 'TBA'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">{reg.registration_type || 'Individual'}</Badge>
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(reg.events?.registration_fee === 0 ? 'FREE' : reg.payment_status || 'PENDING')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reg.status)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button asChild variant="ghost" size="icon" title="View Details">
                          <Link href={`/student/registrations/${reg.id}`}>
                            <Eye className="h-4 w-4 text-[#01424E] dark:text-[#7CEAAB]" />
                          </Link>
                        </Button>
                        {reg.status === 'approved' && (
                          <Button asChild variant="ghost" size="icon" title="View QR Pass">
                            <Link href={`/student/registrations/${reg.id}`}>
                              <QrCode className="h-4 w-4 text-[#41B177]" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegistrations.map((reg) => (
              <Card key={reg.id} className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className="capitalize text-[10px]">{reg.registration_type || 'Individual'}</Badge>
                    {getStatusBadge(reg.status)}
                  </div>
                  <h3 className="font-bold text-base mb-1.5 text-[#01424E] dark:text-white line-clamp-1">{reg.events?.title}</h3>
                  <div className="text-xs text-muted-foreground space-y-1 mb-5">
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#007C46]" /> {reg.events?.start_date ? format(new Date(reg.events.start_date), 'MMM dd, yyyy') : 'TBA'}</p>
                    <p className="flex items-center gap-1.5"><span className="font-semibold text-[10px] text-muted-foreground uppercase mr-1">Fee:</span> {getPaymentStatusBadge(reg.events?.registration_fee === 0 ? 'FREE' : reg.payment_status || 'PENDING')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="w-full text-xs font-semibold">
                      <Link href={`/student/registrations/${reg.id}`}>View Pass & Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No registrations yet"
          description="You haven't registered for any campus events yet. Explore upcoming hackathons, workshops, and sports meets!"
          actionLabel="Explore Campus Events"
          actionHref="/student/events"
          className="mt-6"
        />
      )}
    </div>
  );
}
