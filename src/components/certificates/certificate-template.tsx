'use client';

import React from 'react';
import { Award, QrCode } from 'lucide-react';

export interface FormattedCertificateData {
  id?: string;
  verificationId: string;
  certificateType: string; // 'participation' | 'volunteer' | 'winner' | 'runner_up' | 'second_runner_up'
  certificateTitle: string;
  badgeLabel: string;
  themeColor: string;
  accentBorderColor: string;
  recipientName: string;
  recipientDepartment?: string | null;
  recipientYear?: string | null;
  recipientCollege?: string | null;
  eventName: string;
  eventVenue: string;
  eventDate: string;
  organizationName: string;
  organizationType?: string | null;
  organizationLogo?: string | null;
  facultyAdvisorName: string;
  organizerName?: string | null;
  designation?: string | null;
  issuedAt: string;
}

export function buildCertificateData(cert: any): FormattedCertificateData {
  if (!cert) {
    return {
      verificationId: 'EH-CERT-000000',
      certificateType: 'participation',
      certificateTitle: 'CERTIFICATE OF PARTICIPATION',
      badgeLabel: 'Participation',
      themeColor: '#007C46',
      accentBorderColor: '#41B177',
      recipientName: 'Participant',
      eventName: 'Campus Event',
      eventVenue: 'Campus Main Auditorium',
      eventDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      organizationName: 'EventHub & Campus Organization',
      facultyAdvisorName: 'Faculty Advisor',
      issuedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
  }

  const profile = cert.profiles || {};
  const event = cert.events || {};
  const organizer = event.organizer || cert.organizer || {};

  const certType = (cert.certificate_type || 'participation').toLowerCase();

  let certificateTitle = 'CERTIFICATE OF PARTICIPATION';
  let badgeLabel = 'Participation';
  let themeColor = '#007C46'; // Green
  let accentBorderColor = '#41B177';

  if (certType === 'volunteer') {
    certificateTitle = 'CERTIFICATE OF VOLUNTEER SERVICE';
    badgeLabel = 'Volunteer Service';
    themeColor = '#1E3A5F'; // Corporate Dark Navy
    accentBorderColor = '#D4AF37'; // Gold Accent Line
  } else if (certType === 'winner') {
    certificateTitle = 'CERTIFICATE OF ACHIEVEMENT';
    badgeLabel = 'First Place (Winner)';
    themeColor = '#D97706'; // Gold
    accentBorderColor = '#FBBF24';
  } else if (certType === 'runner_up') {
    certificateTitle = 'CERTIFICATE OF ACHIEVEMENT';
    badgeLabel = 'Runner-Up';
    themeColor = '#64748B'; // Silver
    accentBorderColor = '#94A3B8';
  } else if (certType === 'second_runner_up') {
    certificateTitle = 'CERTIFICATE OF ACHIEVEMENT';
    badgeLabel = 'Second Runner-Up';
    themeColor = '#B45309'; // Bronze
    accentBorderColor = '#F59E0B';
  }

  const recipientName = profile.full_name || cert.recipientName || 'Participant';
  const eventName = event.title || cert.eventName || 'Campus Event';
  const organizationName = organizer.organization || organizer.club_name || profile.college || cert.organizationName || 'Campus Organization';
  const facultyAdvisorName = organizer.faculty_advisor_name || cert.facultyAdvisorName || 'Faculty Advisor';
  const eventVenue = event.venue || cert.eventVenue || 'Campus Venue';

  const rawIssueDate = cert.generated_at || cert.issuedAt;
  const issuedAt = rawIssueDate 
    ? new Date(rawIssueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const rawEventDate = event.start_date || cert.eventDate;
  const eventDate = rawEventDate
    ? new Date(rawEventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : issuedAt;

  return {
    id: cert.id,
    verificationId: cert.verification_id || cert.verificationId || `EH-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
    certificateType: certType,
    certificateTitle,
    badgeLabel,
    themeColor,
    accentBorderColor,
    recipientName,
    recipientDepartment: profile.department || null,
    recipientYear: profile.year || null,
    recipientCollege: profile.college || null,
    eventName,
    eventVenue,
    eventDate,
    organizationName,
    organizationType: organizer.organization_type || cert.organizationType || null,
    organizationLogo: organizer.profile_picture || cert.organizationLogo || null,
    facultyAdvisorName,
    organizerName: organizer.full_name || cert.organizerName || 'Faculty Convener',
    designation: organizer.designation || cert.designation || 'Faculty Advisor',
    issuedAt,
  };
}

export function CertificateTemplate({ data }: { data: FormattedCertificateData }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    typeof window !== 'undefined' 
      ? `${window.location.origin}/verify-certificate?id=${data.verificationId}`
      : `EH-CERT-VERIFY:${data.verificationId}`
  )}&color=${data.themeColor.replace('#', '')}`;

  return (
    <div 
      className="p-8 md:p-10 rounded-2xl border-4 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-center font-sans space-y-6"
      style={{ borderColor: data.themeColor }}
    >
      {/* Top Banner Accent Line */}
      <div 
        className="h-2 w-full absolute top-0 left-0"
        style={{ backgroundColor: data.accentBorderColor }}
      />

      {/* Header Section: Logo + Organization Name */}
      <div className="flex flex-col items-center justify-center space-y-2 border-b pb-4">
        {data.organizationLogo && data.organizationLogo.trim().length > 0 && (
          <img 
            src={data.organizationLogo} 
            alt="Organization Logo" 
            className="h-14 w-auto object-contain max-w-[160px] mb-1"
          />
        )}
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-200">
          {data.organizationName}
        </h3>
        <p className="text-[11px] text-muted-foreground font-mono">Official Digital Credential</p>
      </div>

      {/* Certificate Title */}
      <div className="space-y-2 my-4">
        <Award className="h-14 w-14 mx-auto mb-1" style={{ color: data.themeColor }} />
        <h1 
          className="text-2xl md:text-3xl font-black tracking-tight uppercase"
          style={{ color: data.themeColor }}
        >
          {data.certificateTitle}
        </h1>
      </div>

      {/* Dynamic Body Text */}
      <div className="space-y-4 max-w-xl mx-auto py-2">
        <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          Presented to
        </p>

        <h2 
          className="text-2xl md:text-3xl font-bold underline underline-offset-8 decoration-2"
          style={{ color: data.themeColor, textDecorationColor: data.accentBorderColor }}
        >
          {data.recipientName}
        </h2>

        {/* Body Citation per Certificate Type */}
        {data.certificateType === 'participation' && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            for successfully participating in <strong className="text-slate-900 dark:text-white font-bold">{data.eventName}</strong> organized by <strong className="text-slate-900 dark:text-white font-bold">{data.organizationName}</strong> held on <span className="font-semibold text-slate-800 dark:text-slate-200">{data.eventDate}</span>.
          </p>
        )}

        {data.certificateType === 'volunteer' && (
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            Awarded for dedicated volunteer service during <strong className="text-[#1E3A5F] dark:text-teal-200 font-bold">{data.eventName}</strong> organized by <strong className="text-slate-900 dark:text-white font-bold">{data.organizationName}</strong> held on <span className="font-semibold text-slate-800 dark:text-slate-200">{data.eventDate}</span>.
          </p>
        )}

        {data.certificateType === 'winner' && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            for securing <span className="font-extrabold uppercase px-2 py-0.5 rounded text-white" style={{ backgroundColor: data.themeColor }}>FIRST PLACE</span> in <strong className="text-slate-900 dark:text-white font-bold">{data.eventName}</strong> organized by <strong className="text-slate-900 dark:text-white font-bold">{data.organizationName}</strong>.
          </p>
        )}

        {data.certificateType === 'runner_up' && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            for securing <span className="font-extrabold uppercase px-2 py-0.5 rounded text-white" style={{ backgroundColor: data.themeColor }}>RUNNER-UP</span> in <strong className="text-slate-900 dark:text-white font-bold">{data.eventName}</strong> organized by <strong className="text-slate-900 dark:text-white font-bold">{data.organizationName}</strong>.
          </p>
        )}

        {data.certificateType === 'second_runner_up' && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            for securing <span className="font-extrabold uppercase px-2 py-0.5 rounded text-white" style={{ backgroundColor: data.themeColor }}>SECOND RUNNER-UP</span> in <strong className="text-slate-900 dark:text-white font-bold">{data.eventName}</strong> organized by <strong className="text-slate-900 dark:text-white font-bold">{data.organizationName}</strong>.
          </p>
        )}
      </div>

      {/* Bottom Section: Left Metadata | Middle QR | Right Signatory */}
      <div className="pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-xs text-left">
        {/* Left Side */}
        <div className="space-y-1">
          <p className="text-muted-foreground"><strong className="text-slate-700 dark:text-slate-300 font-semibold">Issue Date:</strong> {data.issuedAt}</p>
          <p className="text-muted-foreground"><strong className="text-slate-700 dark:text-slate-300 font-semibold">Verification ID:</strong> <span className="font-mono font-bold" style={{ color: data.themeColor }}>{data.verificationId}</span></p>
          <p className="text-muted-foreground"><strong className="text-slate-700 dark:text-slate-300 font-semibold">Event Venue:</strong> {data.eventVenue}</p>
        </div>

        {/* Middle QR Code */}
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="p-1.5 bg-white rounded-lg border shadow-sm">
            <img src={qrUrl} alt="Certificate Verification QR" className="h-16 w-16" />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Scan to Verify</span>
        </div>

        {/* Right Side Signature */}
        <div className="text-center sm:text-right space-y-1">
          <div className="border-b-2 border-slate-300 dark:border-slate-700 w-36 ml-auto pb-1 mb-1 font-serif italic text-base font-bold text-slate-800 dark:text-slate-200">
            {data.facultyAdvisorName}
          </div>
          <div className="font-bold text-slate-900 dark:text-white">{data.facultyAdvisorName}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Faculty Advisor</div>
          <div className="text-[10px] text-muted-foreground truncate">{data.organizationName}</div>
        </div>
      </div>
    </div>
  );
}
