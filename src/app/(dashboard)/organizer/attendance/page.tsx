'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, Search, Download, CheckCircle2, RefreshCw, Clock, Check, LogOut } from 'lucide-react';
import { eventService } from '@/services/event-service';
import { attendanceService, calculateDuration } from '@/services/attendance-service';
import { exportService } from '@/services/export-service';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, checkedIn: 0, pendingCheckout: 0, present: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadEvents() {
      if (!profile?.id) return;
      try {
        const res = await eventService.getEvents({ created_by: profile.id, limit: 100 });
        const evts = res.data || [];
        setEvents(evts);
        if (evts.length > 0 && !selectedEventId) {
          setSelectedEventId(evts[0].id);
        }
      } catch (err) {
        console.error("Error loading events:", err);
      }
    }
    loadEvents();
  }, [profile?.id]);

  const loadAttendance = async () => {
    if (!selectedEventId) return;
    setLoading(true);

    try {
      const [data, s] = await Promise.all([
        attendanceService.getEventAttendance(selectedEventId),
        attendanceService.getAttendanceStats(selectedEventId)
      ]);

      setAttendance(data || []);
      setStats(s);
    } catch (err: any) {
      console.error("Error loading organizer attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadAttendance();
    }
  }, [selectedEventId]);

  const handleExportExcel = () => {
    toast.promise(exportService.exportAttendanceExcel(attendance), {
      loading: 'Exporting attendance register to Excel...',
      success: 'Attendance Excel file downloaded! 📊',
      error: 'Export failed.'
    });
  };

  const filtered = attendance.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.profiles?.full_name?.toLowerCase().includes(s) ||
      a.registration_id?.toLowerCase().includes(s) ||
      a.profiles?.department?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Live QR Attendance Command Center</h1>
          <p className="text-muted-foreground text-sm">Real-time attendance tracking, checked-in logs, and volunteer scanner activity</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          )}
          <Button onClick={loadAttendance} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Logs
          </Button>
          <Button onClick={handleExportExcel} className="bg-[#007C46] text-white hover:bg-[#007C46]/90" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Attendance
          </Button>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-semibold uppercase text-muted-foreground">Approved Registrations</CardTitle>
            <QrCode className="h-4 w-4 text-[#01424E] dark:text-[#7CEAAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Approved</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-semibold uppercase text-muted-foreground">Checked In</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#01424E] dark:text-[#7CEAAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats.checkedIn}</div>
            <p className="text-xs text-muted-foreground mt-1">Entry Scanned</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-semibold uppercase text-muted-foreground">Pending Checkout</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pendingCheckout}</div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">Awaiting Checkout</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-semibold uppercase text-muted-foreground">Present</CardTitle>
            <Check className="h-4 w-4 text-[#007C46]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#007C46] dark:text-[#7CEAAB]">{stats.present}</div>
            <p className="text-xs text-[#007C46] font-medium mt-1">Checkout Completed</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-semibold uppercase text-muted-foreground">Attendance %</CardTitle>
            <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177]">{stats.percentage}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#007C46] dark:text-[#7CEAAB]">{stats.percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">Present / Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search checked-in students or registration ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance Logs Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-bold text-xs uppercase">Student Name</TableHead>
                <TableHead className="font-bold text-xs uppercase">Department & Year</TableHead>
                <TableHead className="font-bold text-xs uppercase">Check-In</TableHead>
                <TableHead className="font-bold text-xs uppercase">Check-Out</TableHead>
                <TableHead className="font-bold text-xs uppercase">Duration</TableHead>
                <TableHead className="font-bold text-xs uppercase">Scanner / Volunteer</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading attendance logs...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No attendance records found matching search.</TableCell>
                </TableRow>
              ) : (
                filtered.map((att) => {
                  const isPendingCheckout = att.attendance_status === 'pending_checkout';
                  const duration = calculateDuration(att.check_in_time, att.check_out_time);
                  return (
                    <TableRow key={att.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                      <TableCell>
                        <div className="font-bold text-[#01424E] dark:text-teal-100">{att.profiles?.full_name || 'Participant'}</div>
                        <div className="text-[11px] text-muted-foreground">{att.profiles?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{att.profiles?.department || 'N/A'}</div>
                        <div className="text-[11px] text-muted-foreground">{att.profiles?.year || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-bold text-[#01424E] dark:text-teal-200">
                          {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{att.check_in_time ? new Date(att.check_in_time).toLocaleDateString() : ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-bold text-[#007C46] dark:text-[#7CEAAB]">
                          {att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{att.check_out_time ? new Date(att.check_out_time).toLocaleDateString() : ''}</div>
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {duration}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-semibold">
                          👤 {att.volunteer?.full_name || 'Volunteer Scanner'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
