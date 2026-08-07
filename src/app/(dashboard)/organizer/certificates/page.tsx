'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Download, Sparkles, RefreshCw, CheckCircle2, Users } from 'lucide-react';
import { certificateService } from '@/services/certificate-service';
import { eventService } from '@/services/event-service';
import { exportService } from '@/services/export-service';
import { CertificateTemplate, buildCertificateData, FormattedCertificateData } from '@/components/certificates/certificate-template';
import { toast } from 'sonner';
import { useDataSync } from '@/lib/data-sync';

export default function CertificatesPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const [certificates, setCertificates] = useState<any[]>([]);
  const [allEventCertificates, setAllEventCertificates] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCertData, setSelectedCertData] = useState<FormattedCertificateData | null>(null);
  const [certTypeFilter, setCertTypeFilter] = useState('all');

  useEffect(() => {
    async function loadEvents() {
      const res = await eventService.getEvents();
      setEvents(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    }
    loadEvents();
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const [allCerts, parts, vols, wins] = await Promise.all([
        certificateService.getCertificates({ event_id: selectedEventId }),
        certificateService.getEligibleParticipants(selectedEventId),
        certificateService.getEligibleVolunteers(selectedEventId),
        certificateService.getEventWinners(selectedEventId)
      ]);

      setAllEventCertificates(allCerts || []);
      setParticipants(parts || []);
      setVolunteers(vols || []);
      setWinners(wins || []);

      if (certTypeFilter === 'all') {
        setCertificates(allCerts || []);
      } else {
        setCertificates((allCerts || []).filter((c: any) => c.certificate_type === certTypeFilter));
      }
    } catch (err) {
      console.error("Error loading certificate data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, certTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDataSync(['certificates', 'attendance', 'volunteers', 'registrations'], loadData, [selectedEventId]);

  // Compute unissued eligible counts for each batch type
  const existingParticipationUserIds = new Set(
    allEventCertificates.filter((c: any) => c.certificate_type === 'participation').map((c: any) => c.user_id)
  );
  const existingVolunteerUserIds = new Set(
    allEventCertificates.filter((c: any) => c.certificate_type === 'volunteer').map((c: any) => c.user_id)
  );
  const existingWinnerUserIds = new Set(
    allEventCertificates.filter((c: any) => ['winner', 'runner_up'].includes(c.certificate_type)).map((c: any) => c.user_id)
  );

  const unissuedParticipationCount = participants.filter(p => !existingParticipationUserIds.has(p.user_id)).length;
  const unissuedVolunteerCount = volunteers.filter(v => !existingVolunteerUserIds.has(v.user_id)).length;
  const unissuedWinnerCount = winners.filter(w => !existingWinnerUserIds.has(w.user_id)).length;

  const getGrammaticalSuccessMsg = (count: number, type: "participation" | "winner" | "volunteer") => {
    const noun = count === 1 ? 'certificate' : 'certificates';
    return `Issued ${count} ${type} ${noun} successfully.`;
  };

  const handleGenerateBatch = async (type: "participation" | "winner" | "volunteer") => {
    if (!selectedEventId) return toast.error("Please select an event first.");
    if (!profile?.id) return toast.error("Organizer session not ready. Please try again.");

    // Requirement 1 & 8: Pre-validation of eligible recipients
    if (type === "participation") {
      if (participants.length === 0) {
        toast.error("No eligible participants found.", {
          description: "There are no checked-in participants available to issue certificates for this event."
        });
        return;
      }
      if (unissuedParticipationCount === 0) {
        toast.error("No eligible recipients found.", {
          description: "All checked-in participants for this event have already received participation certificates."
        });
        return;
      }
    } else if (type === "volunteer") {
      if (volunteers.length === 0) {
        toast.error("No approved volunteers available.", {
          description: "There are no approved volunteers with completed duties to issue certificates for this event."
        });
        return;
      }
      if (unissuedVolunteerCount === 0) {
        toast.error("No eligible recipients found.", {
          description: "All approved volunteers for this event have already received volunteer certificates."
        });
        return;
      }
    } else if (type === "winner") {
      if (winners.length === 0) {
        toast.error("No winners selected yet.", {
          description: "Please designate winners in the Winner Selection Panel before issuing winner certificates."
        });
        return;
      }
      if (unissuedWinnerCount === 0) {
        toast.error("No eligible recipients found.", {
          description: "All selected winners for this event have already received winner certificates."
        });
        return;
      }
    }

    setGenerating(true);

    try {
      const result = await certificateService.generateBulkCertificates(
        selectedEventId, 
        type, 
        profile.id
      );

      if (!result || result.count === 0) {
        toast.error("No eligible recipients found.", {
          description: "There are no unissued eligible recipients available for this event."
        });
        return;
      }

      // Requirement 5, 6, 10: Correct count & singular/plural feedback
      toast.success(`✓ ${getGrammaticalSuccessMsg(result.count, type)}`);
      
      // Requirement 7: Refresh statistics and data immediately
      await loadData();
    } catch (err) {
      toast.error("Failed to generate certificates. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const [reassignModal, setReassignModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    type: 'winner' | 'runner_up' | 'second_runner_up';
    existingName: string;
  }>({
    open: false,
    userId: '',
    userName: '',
    type: 'winner',
    existingName: '',
  });

  const executeSetWinner = async (userId: string, type: 'winner' | 'runner_up' | 'second_runner_up') => {
    try {
      await certificateService.setEventWinner(selectedEventId, userId, type, profile?.id);
      const label = type === 'winner' ? '1st Place' : type === 'runner_up' ? 'Runner-Up' : 'Second Runner-Up';
      toast.success(`✓ Marked as ${label} successfully!`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to set winner');
    }
  };

  const handleSetWinner = (userId: string, type: 'winner' | 'runner_up' | 'second_runner_up') => {
    if (!selectedEventId) {
      toast.error("Please select an event first");
      return;
    }
    if (!userId) {
      toast.error("Invalid participant selected");
      return;
    }

    const currentAwardHolder = winners.find(w => w.certificate_type === type);
    const targetParticipant = participants.find(p => p.user_id === userId);
    const userName = targetParticipant?.profiles?.full_name || 'Participant';

    if (currentAwardHolder && currentAwardHolder.user_id !== userId) {
      const existingName = currentAwardHolder.profiles?.full_name || 'Another participant';
      setReassignModal({
        open: true,
        userId,
        userName,
        type,
        existingName,
      });
      return;
    }

    executeSetWinner(userId, type);
  };

  const handleRemoveWinner = async (userId: string) => {
    if (!selectedEventId) return;
    try {
      await certificateService.removeEventWinner(selectedEventId, userId);
      toast.success('Removed winner designation');
      await loadData();
    } catch (err) {
      toast.error('Failed to remove winner');
    }
  };

  const handleDownloadPDF = (cert: any) => {
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

  const selectedEventObj = events.find(ev => ev.id === selectedEventId);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Digital Certificate System</h1>
          <p className="text-muted-foreground text-sm">Issue, preview, and export verifiable participation & winner certificates</p>
        </div>
        
        {/* Requirement 9: Disable buttons when nothing can be issued with Tooltip */}
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger>
                <span>
                  <Button 
                    onClick={() => handleGenerateBatch('participation')} 
                    disabled={generating || !selectedEventId || unissuedParticipationCount === 0} 
                    className="bg-[#01424E] text-[#7CEAAB] hover:bg-[#013540] disabled:opacity-50 disabled:cursor-not-allowed" 
                    size="sm"
                  >
                    <Award className="mr-1.5 h-4 w-4" /> Issue Participation Batch
                  </Button>
                </span>
              </TooltipTrigger>
              {(unissuedParticipationCount === 0 || !selectedEventId) && (
                <TooltipContent>
                  <p className="text-xs">
                    {!selectedEventId 
                      ? "Please select an event." 
                      : participants.length === 0 
                      ? "No eligible participants found." 
                      : "No eligible recipients available."}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <span>
                  <Button 
                    onClick={() => handleGenerateBatch('volunteer')} 
                    disabled={generating || !selectedEventId || unissuedVolunteerCount === 0} 
                    className="bg-[#41B177] text-white hover:bg-[#41B177]/90 disabled:opacity-50 disabled:cursor-not-allowed" 
                    size="sm"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Issue Volunteer Batch
                  </Button>
                </span>
              </TooltipTrigger>
              {(unissuedVolunteerCount === 0 || !selectedEventId) && (
                <TooltipContent>
                  <p className="text-xs">
                    {!selectedEventId 
                      ? "Please select an event." 
                      : volunteers.length === 0 
                      ? "No approved volunteers available." 
                      : "No eligible recipients available."}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <span>
                  <Button 
                    onClick={() => handleGenerateBatch('winner')} 
                    disabled={generating || !selectedEventId || unissuedWinnerCount === 0} 
                    className="bg-[#007C46] text-white hover:bg-[#007C46]/90 disabled:opacity-50 disabled:cursor-not-allowed" 
                    size="sm"
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" /> Issue Winner Batch
                  </Button>
                </span>
              </TooltipTrigger>
              {(unissuedWinnerCount === 0 || !selectedEventId) && (
                <TooltipContent>
                  <p className="text-xs">
                    {!selectedEventId 
                      ? "Please select an event." 
                      : winners.length === 0 
                      ? "No winners selected yet." 
                      : "No eligible recipients available."}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Event:</span>
            <Select value={selectedEventId} onValueChange={(val) => val && setSelectedEventId(val)}>
              <SelectTrigger className="w-full md:w-[420px] lg:w-[460px] font-semibold">
                <SelectValue placeholder="Select Event">
                  {selectedEventObj ? selectedEventObj.title : 'Select Event'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {events.map(ev => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Certificate Type:</span>
            <Select value={certTypeFilter} onValueChange={(val) => setCertTypeFilter(val || 'all')}>
              <SelectTrigger className="w-full md:w-52 font-medium">
                <SelectValue>
                  {certTypeFilter === 'all' ? 'All Certificates' :
                   certTypeFilter === 'participation' ? 'Participation' :
                   certTypeFilter === 'winner' ? 'Winner & Runner-Up' :
                   certTypeFilter === 'volunteer' ? 'Volunteer Service' : 'All Certificates'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certificates</SelectItem>
                <SelectItem value="participation">Participation</SelectItem>
                <SelectItem value="winner">Winner & Runner-Up</SelectItem>
                <SelectItem value="volunteer">Volunteer Service</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadData} variant="ghost" size="sm" title="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requirement 2 & 3: Winner Selection Panel with Centered Empty State when no eligible participants */}
      {selectedEventId && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Winner Selection Panel</CardTitle>
            <CardDescription>Designate winners and runners-up before issuing winner certificates.</CardDescription>
          </CardHeader>
          {loading ? (
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading participants...
            </CardContent>
          ) : participants.length === 0 ? (
            <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-muted-foreground">
                <Award className="h-8 w-8 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-[#01424E] dark:text-teal-100 mb-1">
                No one to issue certificates
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
                There are currently no eligible participants or volunteers for this event. Certificates will become available once students participate, volunteers are approved, or winners are selected.
              </p>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                      <TableHead className="font-bold text-xs uppercase">Participant</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Department</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p) => {
                      const winRecord = winners.find(w => w.user_id === p.user_id);
                      return (
                        <TableRow key={p.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                          <TableCell>
                            <div className="font-bold text-[#01424E] dark:text-teal-100">{p.profiles?.full_name}</div>
                            <div className="text-xs text-muted-foreground">{p.profiles?.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{p.profiles?.department || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Year {p.profiles?.year || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            {winRecord ? (
                              <Badge className={
                                winRecord.certificate_type === 'winner' ? 'bg-[#D97706]' :
                                winRecord.certificate_type === 'runner_up' ? 'bg-[#64748B]' : 'bg-[#B45309]'
                              }>
                                {winRecord.certificate_type.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Participant</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {winRecord ? (
                              <Button onClick={() => handleRemoveWinner(p.user_id)} variant="destructive" size="sm" className="h-8">
                                Remove
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button onClick={() => handleSetWinner(p.user_id, 'winner')} size="sm" variant="outline" className="h-8 border-[#D97706] text-[#D97706] hover:bg-[#D97706]/10 text-xs">
                                  1st Place
                                </Button>
                                <Button onClick={() => handleSetWinner(p.user_id, 'runner_up')} size="sm" variant="outline" className="h-8 border-[#64748B] text-[#64748B] hover:bg-[#64748B]/10 text-xs">
                                  Runner-Up
                                </Button>
                                <Button onClick={() => handleSetWinner(p.user_id, 'second_runner_up')} size="sm" variant="outline" className="h-8 border-[#B45309] text-[#B45309] hover:bg-[#B45309]/10 text-xs">
                                  2nd Runner-Up
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Requirement 4: Certificates Table with Centered Empty State when no certificates exist */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Issued Certificates</CardTitle>
              <CardDescription>View, preview, and download official digital certificates.</CardDescription>
            </div>
            {certificates.length > 0 && (
              <Badge variant="outline" className="font-semibold text-xs border-[#007C46] text-[#007C46] dark:border-emerald-500 dark:text-emerald-400">
                {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'} Issued
              </Badge>
            )}
          </div>
        </CardHeader>
        {loading ? (
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading issued certificates...
          </CardContent>
        ) : certificates.length === 0 ? (
          <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-[#007C46]/10 dark:bg-teal-400/10 text-[#007C46] dark:text-[#7CEAAB] flex items-center justify-center mb-4">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-[#01424E] dark:text-teal-100 mb-1">
              No certificates have been issued yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
              Certificates will appear here once generated for eligible participants, volunteers, or winners.
            </p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-bold text-xs uppercase">Recipient</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Event Title</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Verification ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => {
                  const formatted = buildCertificateData(cert);
                  return (
                    <TableRow key={cert.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                      <TableCell>
                        <div className="font-bold text-[#01424E] dark:text-teal-100">{formatted.recipientName}</div>
                        <div className="text-xs text-muted-foreground">{formatted.recipientDepartment || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{formatted.eventName}</div>
                        <div className="text-xs text-muted-foreground">{formatted.issuedAt}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className="capitalize font-bold text-white"
                          style={{ backgroundColor: formatted.themeColor }}
                        >
                          {formatted.badgeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{formatted.verificationId}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => setSelectedCertData(formatted)} variant="outline" size="sm" className="h-8">
                            Preview
                          </Button>
                          <Button onClick={() => handleDownloadPDF(cert)} size="sm" className="bg-[#01424E] text-[#7CEAAB] h-8">
                            <Download className="mr-1 h-3.5 w-3.5" /> PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* Certificate Preview Modal */}
      <Dialog open={!!selectedCertData} onOpenChange={() => setSelectedCertData(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Official Digital Credential Preview</DialogTitle>
            <DialogDescription>Database-driven authentic certificate rendering</DialogDescription>
          </DialogHeader>
          {selectedCertData && (
            <CertificateTemplate data={selectedCertData} />
          )}
        </DialogContent>
      </Dialog>

      {/* Award Reassignment Confirmation Dialog */}
      <Dialog open={reassignModal.open} onOpenChange={(open) => setReassignModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign {reassignModal.type === 'winner' ? '1st Place' : reassignModal.type === 'runner_up' ? 'Runner-Up' : '2nd Runner-Up'} Award?</DialogTitle>
            <DialogDescription>
              <strong>{reassignModal.existingName}</strong> currently holds this award for this event. 
              Reassigning it to <strong>{reassignModal.userName}</strong> will replace the existing recipient.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setReassignModal(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button 
              className="bg-[#01424E] text-white hover:bg-[#007C46]"
              onClick={async () => {
                const { userId, type } = reassignModal;
                setReassignModal(prev => ({ ...prev, open: false }));
                await executeSetWinner(userId, type);
              }}
            >
              Replace & Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

