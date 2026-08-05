'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { certificateService } from '@/services/certificate-service';
import { exportService } from '@/services/export-service';
import { CertificateTemplate, buildCertificateData, FormattedCertificateData } from '@/components/certificates/certificate-template';
import { useDataSync } from '@/lib/data-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GridSkeleton } from '@/components/ui/page-skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Award, Download, Eye, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentCertificatesPage() {
  const { profile } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertData, setSelectedCertData] = useState<FormattedCertificateData | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await certificateService.getCertificates({ user_id: profile.id });
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['certificates'], loadData, [profile?.id]);

  const handleDownload = (cert: any) => {
    const formatted = buildCertificateData(cert);
    exportService.generateCertificatePDF({
      recipientName: formatted.recipientName,
      eventName: formatted.eventName,
      eventVenue: formatted.eventVenue,
      eventDate: formatted.eventDate,
      organizationName: formatted.organizationName,
      facultyAdvisorName: formatted.facultyAdvisorName,
      certificateType: formatted.certificateType,
      verificationId: formatted.verificationId,
      issueDate: formatted.issuedAt,
    });
    toast.success('Generated PDF certificate download! 🎓');
  };

  return (
    <div className="space-y-6 fade-in pb-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
          My Digital Credentials & Certificates
        </h1>
        <p className="text-muted-foreground text-xs">
          Official tamper-proof digital certificates issued for your campus event participation and achievements
        </p>
      </div>

      {loading ? (
        <GridSkeleton count={3} />
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => {
            const formatted = buildCertificateData(cert);
            return (
              <Card key={cert.id} className="p-0 pt-0 overflow-hidden hover:shadow-lg transition-all group border-slate-200 dark:border-slate-800">
                <div 
                  className="h-32 w-full flex flex-col items-center justify-center text-white relative rounded-t-xl"
                  style={{ backgroundColor: formatted.themeColor }}
                >
                  <Award className="h-12 w-12 mb-1 text-white/90" />
                  <Badge className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white border-0 capitalize font-bold">
                    {formatted.badgeLabel}
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-base leading-tight text-[#01424E] dark:text-white mb-1">
                        {formatted.eventName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Issued: {formatted.issuedAt}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-center flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-bold">Verification ID</p>
                        <p className="font-mono text-xs font-bold" style={{ color: formatted.themeColor }}>{formatted.verificationId}</p>
                      </div>
                      <QrCode className="h-6 w-6 text-[#01424E] dark:text-[#7CEAAB]" />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 text-xs font-semibold"
                        onClick={() => setSelectedCertData(formatted)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button 
                        className="flex-1 bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] text-xs font-bold shadow-md"
                        onClick={() => handleDownload(cert)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No digital certificates yet"
          description="Participate in campus hackathons, workshops, and sports events to earn official tamper-proof credentials."
          actionLabel="Find Events to Join"
          actionHref="/student/events"
          className="mt-6"
        />
      )}

      {/* Certificate Preview Dialog */}
      <Dialog open={!!selectedCertData} onOpenChange={() => setSelectedCertData(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Official Digital Credential Preview</DialogTitle>
            <DialogDescription>Authentic certificate issued by {selectedCertData?.organizationName}</DialogDescription>
          </DialogHeader>
          {selectedCertData && (
            <CertificateTemplate data={selectedCertData} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
