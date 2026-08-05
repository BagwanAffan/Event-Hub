'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { certificateService } from '@/services/certificate-service';
import { exportService } from '@/services/export-service';
import { CertificateTemplate, buildCertificateData, FormattedCertificateData } from '@/components/certificates/certificate-template';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Award, Download, Eye, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useDataSync } from '@/lib/data-sync';

export default function VolunteerCertificatesPage() {
  const { profile } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertData, setSelectedCertData] = useState<FormattedCertificateData | null>(null);

  const loadCertificates = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await certificateService.getCertificates({ user_id: profile.id });
      const volunteerCerts = (data || []).filter((c: any) => c.certificate_type === 'volunteer');
      setCertificates(volunteerCerts);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['certificates', 'volunteers'], loadCertificates, [profile?.id]);

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
    toast.success('Downloaded official PDF Certificate!');
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="My Certificates"
        description="View and download your earned volunteer certificates and achievements"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => {
            const formatted = buildCertificateData(cert);

            return (
              <Card 
                key={cert.id} 
                className="p-0 pt-0 overflow-hidden hover:shadow-lg transition-all group border-slate-200 dark:border-slate-800"
              >
                <div 
                  className="h-32 w-full flex flex-col items-center justify-center text-white relative rounded-t-xl"
                  style={{ backgroundColor: formatted.themeColor }}
                >
                  <Award className="h-12 w-12 mb-2 text-[#7CEAAB]" />
                  <Badge className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white border-0 capitalize font-bold">
                    Volunteer Service
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg leading-tight text-[#01424E] dark:text-white mb-1">
                        {formatted.eventName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Issued: {formatted.issuedAt}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-center flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest text-left font-bold">Verification ID</p>
                        <p className="font-mono text-xs font-semibold text-foreground truncate max-w-[150px]">{formatted.verificationId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-[#01424E] dark:text-[#7CEAAB]" />
                        <ShieldCheck className="h-5 w-5 text-[#41B177] shrink-0" />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 font-semibold"
                        onClick={() => setSelectedCertData(formatted)}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                      <Button 
                        className="flex-1 bg-[#01424E] hover:bg-[#007C46] text-white dark:bg-[#7CEAAB] dark:text-[#01424E] dark:hover:bg-[#7CEAAB]/90 font-bold"
                        onClick={() => handleDownload(cert)}
                      >
                        <Download className="mr-2 h-4 w-4" /> Save
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
          icon={<Award className="h-10 w-10 text-muted-foreground opacity-50" />}
          title="No certificates yet"
          description="Participate in events as a volunteer and complete assigned tasks to earn certificates. They will appear here once issued."
        />
      )}

      {/* Certificate Preview Modal */}
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
