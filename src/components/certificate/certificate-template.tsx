"use client";

import { useRef } from "react";
import jsPDF from "jspdf";

interface CertificateTemplateProps {
  participantName: string;
  eventName: string;
  eventDate: string;
  certificateType: "participation" | "winner" | "runner_up" | "volunteer";
  verificationId: string;
  organizerName?: string;
}

const CERTIFICATE_LABELS = {
  participation: "Certificate of Participation",
  winner: "Certificate of Achievement — Winner",
  runner_up: "Certificate of Achievement — Runner Up",
  volunteer: "Certificate of Volunteering",
};

const CERTIFICATE_DESCRIPTIONS = {
  participation:
    "has successfully participated in",
  winner: "has been awarded First Place in",
  runner_up: "has been awarded Runner Up in",
  volunteer:
    "has volunteered and contributed to the success of",
};

export function CertificateTemplate({
  participantName,
  eventName,
  eventDate,
  certificateType,
  verificationId,
  organizerName,
}: CertificateTemplateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={certRef}
      className="w-[800px] h-[566px] relative bg-white rounded-lg shadow-2xl overflow-hidden"
      id={`certificate-${verificationId}`}
    >
      {/* Border Design */}
      <div className="absolute inset-0 border-[12px] border-[#01424E] rounded-lg" />
      <div className="absolute inset-[16px] border-2 border-[#7CEAAB] rounded-lg" />

      {/* Corner Decorations */}
      <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-[#7CEAAB] rounded-tl-lg" />
      <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-[#7CEAAB] rounded-tr-lg" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-[#7CEAAB] rounded-bl-lg" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-[#7CEAAB] rounded-br-lg" />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center h-full px-16 py-10 text-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#01424E] flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-[#01424E] font-bold text-lg tracking-wider">
            EventHub
          </span>
        </div>

        {/* Certificate Type */}
        <h1 className="text-2xl font-bold text-[#01424E] tracking-wider uppercase mt-2">
          {CERTIFICATE_LABELS[certificateType]}
        </h1>

        {/* Decorative Line */}
        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-[#7CEAAB] to-transparent mt-4 mb-4" />

        {/* Description */}
        <p className="text-gray-500 text-sm">This is to certify that</p>

        {/* Participant Name */}
        <h2 className="text-3xl font-bold text-[#01424E] mt-2 mb-2 font-serif italic">
          {participantName}
        </h2>

        {/* Event Description */}
        <p className="text-gray-600 text-sm max-w-md">
          {CERTIFICATE_DESCRIPTIONS[certificateType]}
        </p>

        {/* Event Name */}
        <h3 className="text-xl font-semibold text-[#007C46] mt-1">
          {eventName}
        </h3>

        {/* Date */}
        <p className="text-gray-500 text-sm mt-2">
          held on{" "}
          <span className="font-medium text-gray-700">{eventDate}</span>
        </p>

        {/* Signatures */}
        <div className="flex items-end justify-between w-full mt-8 px-8">
          <div className="text-center">
            <div className="w-32 border-t border-gray-400 mx-auto" />
            <p className="text-xs text-gray-500 mt-1">
              {organizerName || "Event Organizer"}
            </p>
          </div>
          <div className="text-center">
            <div className="w-32 border-t border-gray-400 mx-auto" />
            <p className="text-xs text-gray-500 mt-1">EventHub Platform</p>
          </div>
        </div>

        {/* Verification */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <p className="text-[10px] text-gray-400">
            Verify at eventhub.app/verify-certificate | ID: {verificationId}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate a downloadable certificate PDF
 */
export async function downloadCertificatePDF(
  participantName: string,
  eventName: string,
  eventDate: string,
  certificateType: "participation" | "winner" | "runner_up" | "volunteer",
  verificationId: string,
  organizerName?: string
) {
  const doc = new jsPDF("landscape", "mm", "a4");
  const pageWidth = 297;
  const pageHeight = 210;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Outer border
  doc.setDrawColor(1, 66, 78);
  doc.setLineWidth(3);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner border
  doc.setDrawColor(124, 234, 171);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Logo
  doc.setFontSize(14);
  doc.setTextColor(1, 66, 78);
  doc.setFont("helvetica", "bold");
  doc.text("EventHub", pageWidth / 2, 32, { align: "center" });

  // Title
  doc.setFontSize(22);
  doc.setTextColor(1, 66, 78);
  doc.text(CERTIFICATE_LABELS[certificateType], pageWidth / 2, 48, {
    align: "center",
  });

  // Decorative line
  doc.setDrawColor(124, 234, 171);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 40, 54, pageWidth / 2 + 40, 54);

  // "This is to certify that"
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.text("This is to certify that", pageWidth / 2, 66, { align: "center" });

  // Participant name
  doc.setFontSize(26);
  doc.setTextColor(1, 66, 78);
  doc.setFont("helvetica", "bolditalic");
  doc.text(participantName, pageWidth / 2, 82, { align: "center" });

  // Description
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.text(
    CERTIFICATE_DESCRIPTIONS[certificateType],
    pageWidth / 2,
    94,
    { align: "center" }
  );

  // Event name
  doc.setFontSize(16);
  doc.setTextColor(0, 124, 70);
  doc.setFont("helvetica", "bold");
  doc.text(eventName, pageWidth / 2, 106, { align: "center" });

  // Date
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.text(`held on ${eventDate}`, pageWidth / 2, 116, {
    align: "center",
  });

  // Signature lines
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.3);
  doc.line(50, 155, 110, 155);
  doc.line(pageWidth - 110, 155, pageWidth - 50, 155);

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(organizerName || "Event Organizer", 80, 161, { align: "center" });
  doc.text("EventHub Platform", pageWidth - 80, 161, { align: "center" });

  // Verification
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Verify at eventhub.app/verify-certificate | ID: ${verificationId}`,
    pageWidth / 2,
    pageHeight - 16,
    { align: "center" }
  );

  doc.save(`certificate-${verificationId}.pdf`);
}
