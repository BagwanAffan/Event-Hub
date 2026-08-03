'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Users, Megaphone, Calendar, ScanLine, Award, Heart, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const supabase = createClient();

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const val = row[header];
            const escaped = ('' + (val ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ];
    return csvRows.join('\n');
  };

  const downloadCSVFile = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = async (reportType: string, filename: string) => {
    setDownloadingReport(reportType);
    try {
      toast.loading(`Generating ${reportType} CSV Report...`, { id: 'report-export' });

      let data: any[] = [];
      if (reportType === 'Users') {
        const res = await supabase.from('profiles').select('id, full_name, email, role, college, department, status, created_at');
        data = res.data || [];
      } else if (reportType === 'Organizer') {
        const res = await supabase.from('profiles').select('id, full_name, email, organization, club_name, designation, approval_status, created_at').eq('role', 'organizer');
        data = res.data || [];
      } else if (reportType === 'Event') {
        const res = await supabase.from('events').select('id, title, category, venue, start_date, end_date, registration_fee, status, created_at');
        data = res.data || [];
      } else if (reportType === 'Attendance') {
        const res = await supabase.from('attendance').select('id, event_id, user_id, status, scanned_at');
        data = res.data || [];
      } else if (reportType === 'Certificates') {
        const res = await supabase.from('certificates').select('id, certificate_number, event_id, user_id, issue_date');
        data = res.data || [];
      } else if (reportType === 'Volunteer') {
        const res = await supabase.from('volunteers').select('id, event_id, user_id, application_status, created_at');
        data = res.data || [];
      }

      if (data.length === 0) {
        toast.info(`No records found for ${reportType} Report.`, { id: 'report-export' });
        return;
      }

      const csv = convertToCSV(data);
      downloadCSVFile(csv, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`${reportType} Report exported successfully! 📊`, { id: 'report-export' });
    } catch (err: any) {
      toast.error(err?.message || `Failed to generate ${reportType} report`, { id: 'report-export' });
    } finally {
      setDownloadingReport(null);
    }
  };

  const reports = [
    { title: 'Users Report', desc: 'Complete campus user directory including Students, Volunteers, and Organizers', icon: Users, type: 'Users', file: 'users_report' },
    { title: 'Organizer Report', desc: 'Approved, pending, and rejected organizer account verification records', icon: Megaphone, type: 'Organizer', file: 'organizers_report' },
    { title: 'Event Report', desc: 'Campus events catalog with categories, venues, dates, and status', icon: Calendar, type: 'Event', file: 'events_report' },
    { title: 'Attendance Report', desc: 'QR code scan logs and verified attendance timestamps across events', icon: ScanLine, type: 'Attendance', file: 'attendance_report' },
    { title: 'Certificates Report', desc: 'Issued digital credentials, verification hashes, and certificate numbers', icon: Award, type: 'Certificates', file: 'certificates_report' },
    { title: 'Volunteer Report', desc: 'Volunteer applications, assigned event duties, and approval statuses', icon: Heart, type: 'Volunteer', file: 'volunteers_report' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">System Reports & CSV Export</h1>
          <p className="text-muted-foreground text-sm">Generate structured data exports for compliance, auditing, and institutional reporting</p>
        </div>
        <Badge className="bg-[#01424E] text-[#7CEAAB] font-bold">REPORTS ENGINE</Badge>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((rep) => (
          <Card key={rep.title} className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
                  <rep.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100">{rep.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{rep.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="pt-4 pb-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-b-xl border-t">
              <Button
                onClick={() => handleGenerateReport(rep.type, rep.file)}
                disabled={downloadingReport === rep.type}
                className="w-full bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold text-xs"
              >
                {downloadingReport === rep.type ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting CSV...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Download CSV Export
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
