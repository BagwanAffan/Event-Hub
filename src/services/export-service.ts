import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';

export interface CertificatePDFData {
  recipientName: string;
  eventName: string;
  eventVenue?: string;
  eventDate?: string;
  organizationName?: string;
  facultyAdvisorName?: string;
  certificateType: string;
  verificationId: string;
  issueDate: string;
}

export const exportService = {
  /**
   * Export registrations to Excel (.xlsx)
   */
  async exportRegistrationsExcel(registrations: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
      { header: 'Registration ID', key: 'id', width: 25 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Event Title', key: 'event', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Payment Status', key: 'payment_status', width: 20 },
      { header: 'Approval Status', key: 'status', width: 20 },
      { header: 'Registration Date', key: 'created_at', width: 22 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '01424E' },
    };

    registrations.forEach((reg) => {
      worksheet.addRow({
        id: reg.id,
        name: reg.profiles?.full_name || 'Student',
        email: reg.profiles?.email || 'N/A',
        event: reg.events?.title || 'Campus Event',
        type: reg.registration_type || 'individual',
        payment_status: reg.payment_status || 'not_required',
        status: reg.status || 'approved',
        created_at: new Date(reg.created_at || Date.now()).toLocaleString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EventHub_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export attendance log to Excel (.xlsx)
   */
  async exportAttendanceExcel(attendanceLogs: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Log');

    worksheet.columns = [
      { header: 'Attendance ID', key: 'id', width: 25 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Check-in Time', key: 'check_in_time', width: 25 },
      { header: 'Check-out Time', key: 'check_out_time', width: 25 },
      { header: 'Duration', key: 'duration', width: 18 },
      { header: 'Volunteer Scanner', key: 'volunteer', width: 25 },
      { header: 'Status', key: 'status', width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '007C46' },
    };

    attendanceLogs.forEach((att) => {
      const checkInStr = att.check_in_time ? new Date(att.check_in_time).toLocaleString() : 'N/A';
      const checkOutStr = att.check_out_time ? new Date(att.check_out_time).toLocaleString() : '-';
      let durationStr = '-';
      if (att.check_in_time && att.check_out_time) {
        const start = new Date(att.check_in_time).getTime();
        const end = new Date(att.check_out_time).getTime();
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          const diffMins = Math.floor((end - start) / (1000 * 60));
          const h = Math.floor(diffMins / 60);
          const m = diffMins % 60;
          durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
        }
      }

      worksheet.addRow({
        id: att.id,
        name: att.profiles?.full_name || 'Attendee',
        department: att.profiles?.department || 'N/A',
        check_in_time: checkInStr,
        check_out_time: checkOutStr,
        duration: durationStr,
        volunteer: att.volunteer?.full_name || att.volunteer_id || 'Volunteer Scanner',
        status: att.attendance_status === 'pending_checkout' ? 'Pending Checkout' : (att.attendance_status === 'present' ? 'Present' : att.attendance_status || 'Checked In'),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EventHub_Attendance_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export Analytics Summary to Excel (.xlsx)
   */
  async exportAnalyticsSummary(stats: any, trendData: any[]) {
    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet('Overview');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '01424E' } };

    summarySheet.addRow({ metric: 'Total Events', value: stats.totalEvents || 0 });
    summarySheet.addRow({ metric: 'Active Events', value: stats.activeEvents || 0 });
    summarySheet.addRow({ metric: 'Total Registrations', value: stats.totalRegistrations || 0 });
    summarySheet.addRow({ metric: 'Pending Registrations', value: stats.pendingRegistrations || 0 });
    summarySheet.addRow({ metric: 'Verified QR Attendance', value: stats.totalAttendance || 0 });
    summarySheet.addRow({ metric: 'Issued Digital Certificates', value: stats.totalCertificates || 0 });

    const trendSheet = workbook.addWorksheet('Registration Trend');
    trendSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Registrations', key: 'registrations', width: 20 },
      { header: 'Attendance', key: 'attendance', width: 20 }
    ];
    trendSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    trendSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '007C46' } };

    trendData.forEach(item => {
      trendSheet.addRow({
        date: item.date,
        registrations: item.registrations || 0,
        attendance: item.attendance || 0
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EventHub_Analytics_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Generate official PDF Certificate dynamically bound to database records
   */
  generateCertificatePDF(data: CertificatePDFData) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const certType = (data.certificateType || 'participation').toLowerCase();

    let certTitle = 'CERTIFICATE OF PARTICIPATION';
    let themeRgb = [0, 124, 70]; // Green (#007C46)
    let accentRgb = [65, 177, 119]; // (#41B177)

    if (certType === 'volunteer') {
      certTitle = 'CERTIFICATE OF VOLUNTEER SERVICE';
      themeRgb = [30, 58, 95]; // Corporate Dark Navy (#1E3A5F)
      accentRgb = [212, 175, 55]; // Gold Accent (#D4AF37)
    } else if (certType === 'winner') {
      certTitle = 'CERTIFICATE OF ACHIEVEMENT';
      themeRgb = [217, 119, 6]; // Gold (#D97706)
      accentRgb = [251, 191, 36];
    } else if (certType === 'runner_up') {
      certTitle = 'CERTIFICATE OF ACHIEVEMENT';
      themeRgb = [100, 116, 139]; // Silver (#64748B)
      accentRgb = [148, 163, 184];
    } else if (certType === 'second_runner_up') {
      certTitle = 'CERTIFICATE OF ACHIEVEMENT';
      themeRgb = [180, 83, 9]; // Bronze (#B45309)
      accentRgb = [245, 158, 11];
    }

    const orgName = data.organizationName || 'Campus Organization';
    const advisorName = data.facultyAdvisorName || 'Faculty Advisor';
    const venue = data.eventVenue || 'Campus Venue';
    const dateStr = data.eventDate || data.issueDate;

    // Outer Primary Frame Border
    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.setLineWidth(4);
    doc.rect(8, 8, 281, 194);

    // Inner Accent Frame Line
    doc.setDrawColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.setLineWidth(1);
    doc.rect(12, 12, 273, 186);

    // Organization Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(orgName.toUpperCase(), 148, 28, { align: 'center' });

    // Certificate Title
    doc.setFontSize(24);
    doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text(certTitle, 148, 48, { align: 'center' });

    // Sub-heading
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('PRESENTED TO', 148, 62, { align: 'center' });

    // Recipient Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text(data.recipientName.toUpperCase(), 148, 78, { align: 'center' });

    // Underline Line
    doc.setDrawColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.setLineWidth(0.8);
    doc.line(78, 82, 218, 82);

    // Dynamic Citation Body Text per Certificate Type
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);

    if (certType === 'participation') {
      doc.text(`for successfully participating in`, 148, 96, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
      doc.text(data.eventName, 148, 108, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`organized by ${orgName} held on ${dateStr}`, 148, 120, { align: 'center' });
    } else if (certType === 'volunteer') {
      doc.text(`Awarded for dedicated volunteer service during`, 148, 96, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
      doc.text(data.eventName, 148, 108, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`organized by ${orgName} held on ${dateStr}`, 148, 120, { align: 'center' });
    } else if (certType === 'winner') {
      doc.text(`for securing FIRST PLACE in`, 148, 96, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
      doc.text(data.eventName, 148, 108, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`organized by ${orgName}`, 148, 120, { align: 'center' });
    } else if (certType === 'runner_up') {
      doc.text(`for securing RUNNER-UP in`, 148, 96, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
      doc.text(data.eventName, 148, 108, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`organized by ${orgName}`, 148, 120, { align: 'center' });
    } else if (certType === 'second_runner_up') {
      doc.text(`for securing SECOND RUNNER-UP in`, 148, 96, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
      doc.text(data.eventName, 148, 108, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`organized by ${orgName}`, 148, 120, { align: 'center' });
    }

    // Bottom Left Metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Issue Date: ${data.issueDate}`, 30, 160);
    doc.text(`Verification ID: ${data.verificationId}`, 30, 166);
    doc.text(`Event Venue: ${venue}`, 30, 172);

    // Bottom Right Signatory
    doc.setDrawColor(148, 163, 184);
    doc.line(200, 160, 260, 160);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(advisorName, 230, 166, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Faculty Advisor', 230, 172, { align: 'center' });
    doc.text(orgName, 230, 177, { align: 'center' });

    // Save Download
    doc.save(`${data.recipientName.replace(/\s+/g, '_')}_${certType}_Certificate.pdf`);
  },
};
