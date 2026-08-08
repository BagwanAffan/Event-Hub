'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ShieldCheck, Award, Calendar, Building, User, MapPin } from 'lucide-react';
import { certificateService } from '@/services/certificate-service';
import { buildCertificateData, FormattedCertificateData, CertificateTemplate } from '@/components/certificates/certificate-template';
import { toast } from 'sonner';

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('verificationId') || '';

  const [certId, setCertId] = useState(initialId);
  const [result, setResult] = useState<{ valid: boolean; data?: FormattedCertificateData } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyToken = async (targetId: string) => {
    if (!targetId.trim()) return;

    setIsLoading(true);
    try {
      const rawRes = await certificateService.verifyCertificate(targetId.trim());
      if (rawRes) {
        const formatted = buildCertificateData(rawRes);
        setResult({ valid: true, data: formatted });
        toast.success('Official Certificate verified successfully! 🏆');
      } else {
        setResult({ valid: false });
        toast.error('Certificate record not found.');
      }
    } catch {
      setResult({ valid: false });
      toast.error('Certificate record not found.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      verifyToken(initialId);
    }
  }, [initialId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(certId);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl animate-fade-in">
      <div className="text-center space-y-3 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#01424E] text-[#7CEAAB] flex items-center justify-center mx-auto mb-2 shadow-lg">
          <ShieldCheck className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#01424E] dark:text-teal-100">
          Public Certificate Authenticator
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter unique Verification ID to validate authentic EventHub digital credentials
        </p>
      </div>

      <Card className="shadow-xl border-slate-200 dark:border-white/[0.08] mb-8">
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleVerify} className="flex gap-3">
            <Input 
              placeholder="e.g. EH-CERT-889412" 
              className="font-mono text-sm py-6 border-[#01424E]/30"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
            />
            <Button type="submit" size="lg" disabled={isLoading} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 px-8 font-bold">
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          {result && (
            <div className={`p-6 rounded-2xl border ${result.valid ? 'bg-[#edfcf6] border-[#41B177] dark:bg-emerald-950/40 dark:border-emerald-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20'}`}>
              {result.valid && result.data ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#007C46] dark:text-[#7CEAAB]">
                    <CheckCircle2 className="h-8 w-8 shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold">Authentic & Verified Certificate</h3>
                      <p className="text-xs text-[#01424E] dark:text-teal-200 font-medium">
                        Official digital credential issued via EventHub Platform
                      </p>
                    </div>
                  </div>

                  {/* Verification Attributes Grid */}
                  <div className="p-5 rounded-xl bg-white dark:bg-[#151515] border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">Recipient</span>
                      <span className="font-bold text-sm text-[#01424E] dark:text-teal-100 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#007C46]" /> {result.data.recipientName}
                      </span>
                      {result.data.recipientDepartment && (
                        <span className="text-muted-foreground text-[11px] block mt-0.5">{result.data.recipientDepartment}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">Certificate Type</span>
                      <Badge 
                        className="capitalize font-bold text-white text-xs px-2.5 py-0.5"
                        style={{ backgroundColor: result.data.themeColor }}
                      >
                        {result.data.badgeLabel}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">Event Name</span>
                      <span className="font-bold text-sm text-slate-800 dark:text-[#F5F5F5] flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-[#007C46]" /> {result.data.eventName}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">Organization</span>
                      <span className="font-bold text-sm text-slate-800 dark:text-[#F5F5F5] flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-[#007C46]" /> {result.data.organizationName}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">Faculty Advisor</span>
                      <span className="font-semibold text-slate-700 dark:text-[#CFCFCF]">
                        {result.data.facultyAdvisorName}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">Issue Date & Verification ID</span>
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-[#F5F5F5] block">
                        {result.data.issuedAt}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-[#007C46] block mt-0.5">
                        ID: {result.data.verificationId}
                      </span>
                    </div>
                  </div>

                  {/* Render Full Live Certificate Preview */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center">
                      Official Certificate Document
                    </h4>
                    <CertificateTemplate data={result.data} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-2 py-4">
                  <XCircle className="h-12 w-12 text-red-500 mb-2" />
                  <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Invalid Verification ID</h3>
                  <p className="text-xs text-muted-foreground">The certificate ID you entered could not be found in our records.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-12 text-center text-muted-foreground">Loading Authenticator...</div>}>
      <VerifyCertificateContent />
    </Suspense>
  );
}
