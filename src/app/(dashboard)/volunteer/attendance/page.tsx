'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Search, RefreshCw, Clock, Check } from 'lucide-react';
import { attendanceService, calculateDuration } from '@/services/attendance-service';
import { useAuth } from '@/hooks/use-auth';
import { useDataSync } from '@/lib/data-sync';

export default function AttendanceRecordsPage() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const volunteerId = profile?.id || '';

    try {
      const data = await attendanceService.getMyScanHistory(volunteerId);
      setAttendance(data || []);
    } catch (err: any) {
      console.error("Error loading volunteer attendance history:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['attendance', 'volunteers'], loadLogs, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      loadLogs();
    }
  }, [profile?.id, loadLogs]);

  const filtered = attendance.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.profiles?.full_name?.toLowerCase().includes(s) ||
      a.registration_id?.toLowerCase().includes(s) ||
      a.profiles?.department?.toLowerCase().includes(s)
    );
  });

  const pendingCheckoutCount = attendance.filter(a => a.attendance_status === 'pending_checkout').length;
  const presentCount = attendance.filter(a => a.attendance_status === 'present' || a.attendance_status === 'checked_in').length;

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Volunteer Attendance Scanner History</h1>
          <p className="text-muted-foreground text-sm">Real-time log of student QR passes verified during your active shift</p>
        </div>
        <Button onClick={loadLogs} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh History
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-semibold">Total Shift Scans</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{attendance.length}</div></CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-semibold">Pending Checkout</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">{pendingCheckoutCount}</div></CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-semibold">Present / Completed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#007C46]">{presentCount}</div></CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-semibold">Completion Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {attendance.length > 0 ? `${Math.round((presentCount / attendance.length) * 100)}%` : '100%'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search checked-in attendee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-bold text-xs uppercase">Student</TableHead>
                <TableHead className="font-bold text-xs uppercase">Check-In</TableHead>
                <TableHead className="font-bold text-xs uppercase">Check-Out</TableHead>
                <TableHead className="font-bold text-xs uppercase">Duration</TableHead>
                <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading scan history...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No attendance logs found matching search.</TableCell>
                </TableRow>
              ) : filtered.map((rec) => {
                const isPendingCheckout = rec.attendance_status === 'pending_checkout';
                const duration = calculateDuration(rec.check_in_time, rec.check_out_time);
                return (
                  <TableRow key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                    <TableCell>
                      <div className="font-bold text-[#01424E] dark:text-teal-100">{rec.profiles?.full_name || 'Participant'}</div>
                      <div className="text-[11px] text-muted-foreground">{rec.profiles?.department || ''}</div>
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {duration}
                    </TableCell>

                    <TableCell className="text-center">
                      {isPendingCheckout ? (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 font-bold text-[10px]">
                          <Clock className="mr-1 h-3 w-3 text-amber-600" /> Pending Checkout
                        </Badge>
                      ) : (
                        <Badge className="bg-[#edfcf6] text-[#007C46] border border-[#41B177] font-bold text-[10px]">
                          <Check className="mr-1 h-3 w-3" /> Present
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
