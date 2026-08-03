"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Share2 } from "lucide-react";
import { attendanceService } from "@/services/attendance-service";
import { formatDate } from "@/utils/format-date";

interface QRPassProps {
  registrationId: string;
  eventId: string;
  userId: string;
  qrToken: string;
  eventName: string;
  eventDate: string;
  eventVenue?: string;
  participantName: string;
  registrationType: string;
  teamName?: string;
}

export function QRPass({
  registrationId,
  eventId,
  userId,
  qrToken,
  eventName,
  eventDate,
  eventVenue,
  participantName,
  registrationType,
  teamName,
}: QRPassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current && qrToken) {
      const qrData = attendanceService.generateQRData(
        registrationId,
        eventId,
        userId,
        qrToken
      );

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 250,
        margin: 2,
        color: {
          dark: "#01424E",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      })
        .then(() => setQrGenerated(true))
        .catch(console.error);
    }
  }, [registrationId, eventId, userId, qrToken]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    // Create a composite image with event details
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.roundRect(0, 0, 400, 550, 16);
    ctx.fill();

    // Header gradient
    const headerGradient = ctx.createLinearGradient(0, 0, 400, 80);
    headerGradient.addColorStop(0, "#01424E");
    headerGradient.addColorStop(1, "#007C46");
    ctx.fillStyle = headerGradient;
    ctx.roundRect(0, 0, 400, 80, [16, 16, 0, 0]);
    ctx.fill();

    // EventHub Logo
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("EventHub Pass", 200, 35);

    // Event Name
    ctx.font = "14px Poppins, sans-serif";
    ctx.fillStyle = "#7CEAAB";
    ctx.fillText(eventName, 200, 60);

    // QR Code
    ctx.drawImage(canvasRef.current, 75, 100, 250, 250);

    // Participant Info
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px Poppins, sans-serif";
    ctx.fillText(participantName, 200, 385);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px Poppins, sans-serif";
    ctx.fillText(`${registrationType.toUpperCase()} ${teamName ? `| ${teamName}` : ""}`, 200, 405);

    ctx.fillText(formatDate(eventDate), 200, 430);
    if (eventVenue) {
      ctx.fillText(eventVenue, 200, 450);
    }

    // Footer
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Poppins, sans-serif";
    ctx.fillText("Show this QR code at the event entrance", 200, 490);
    ctx.fillText(`ID: ${registrationId.substring(0, 8)}`, 200, 510);

    // Download
    const link = document.createElement("a");
    link.download = `eventhub-pass-${eventName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob(resolve, "image/png")
      );
      if (blob && navigator.share) {
        await navigator.share({
          title: `EventHub Pass - ${eventName}`,
          text: `QR Pass for ${eventName}`,
          files: [new File([blob], "eventhub-pass.png", { type: "image/png" })],
        });
      }
    } catch {
      // Fallback: copy to clipboard or show toast
    }
  };

  return (
    <Card className="max-w-sm mx-auto overflow-hidden hover-lift">
      {/* Header */}
      <CardHeader className="gradient-hero text-white py-4 text-center">
        <CardTitle className="text-lg font-semibold tracking-wide">
          EventHub Pass
        </CardTitle>
        <p className="text-sm text-white/80 mt-1">{eventName}</p>
      </CardHeader>

      <CardContent className="flex flex-col items-center py-6 space-y-4">
        {/* QR Code */}
        <div className="p-3 bg-white rounded-xl shadow-sm border">
          <canvas ref={canvasRef} className="mx-auto" />
        </div>

        {/* Participant Info */}
        <div className="text-center space-y-1">
          <p className="font-semibold text-lg">{participantName}</p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="capitalize">
              {registrationType}
            </Badge>
            {teamName && (
              <Badge variant="secondary">{teamName}</Badge>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="text-center text-sm text-muted-foreground space-y-0.5">
          <p>{formatDate(eventDate)}</p>
          {eventVenue && <p>{eventVenue}</p>}
        </div>

        {/* Instructions */}
        <p className="text-xs text-muted-foreground text-center">
          Show this QR code at the event entrance for check-in
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownload}
            disabled={!qrGenerated}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            disabled={!qrGenerated}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
