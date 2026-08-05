'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  StopCircle,
  Camera,
  Search,
  UserCheck,
  ClipboardList,
  Loader2,
  History,
  Check,
  Zap,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { attendanceService, calculateDuration, type ManualSearchResult } from '@/services/attendance-service';
import { volunteerService } from '@/services/volunteer-service';
import { toast } from 'sonner';
import { checkProfileCompletion, getRequiredMissingFields } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';

interface RecentScan {
  id: string;
  studentName: string;
  eventName: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: string;
  status: 'pending_checkout' | 'present' | 'verified';
}

type ScannerTab = 'live' | 'token' | 'search';

export default function QRScannerPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ScannerTab>('live');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualId, setManualId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);

  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ManualSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [approvedEvents, setApprovedEvents] = useState<any[]>([]);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [manualCheckInResult, setManualCheckInResult] = useState<{
    success: boolean;
    message: string;
    data?: { studentName: string; eventName: string; checkInTime: string };
  } | null>(null);

  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const checkProfileGuard = useCallback(() => {
    if (!profile) return false;
    const completion = checkProfileCompletion(profile);
    if (!completion.isComplete) {
      setMissingFields(getRequiredMissingFields(profile));
      setGuardOpen(true);
      return false;
    }
    return true;
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      checkProfileGuard();
    }
  }, [profile?.id, checkProfileGuard]);

  const loadScanHistory = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const historyData = await attendanceService.getMyScanHistory(profile.id);
      if (historyData && Array.isArray(historyData)) {
        const formatted: RecentScan[] = historyData.map((h: any) => ({
          id: h.id,
          studentName: h.profiles?.full_name || 'Student Participant',
          eventName: h.events?.title || 'Campus Event',
          checkInTime: new Date(h.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          checkOutTime: h.check_out_time ? new Date(h.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          duration: attendanceService ? calculateDuration(h.check_in_time, h.check_out_time) : '-',
          status: h.attendance_status === 'pending_checkout' ? 'pending_checkout' : 'present'
        }));
        setRecentScans(formatted);
      }
    } catch (e) {
      console.error('Error loading scan history:', e);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  useEffect(() => {
    const loadApprovedEvents = async () => {
      if (!profile?.id) return;
      try {
        const events = await volunteerService.getMyApprovedEvents(profile.id);
        setApprovedEvents(events);
      } catch {
        setApprovedEvents([]);
      }
    };
    loadApprovedEvents();
  }, [profile?.id]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await attendanceService.searchRegistrationsForManualCheckIn(
          selectedEventId || undefined,
          searchQuery
        );
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedEventId]);

  const processScanToken = async (token: string) => {
    if (!checkProfileGuard()) return;
    console.log("History BEFORE scan:", recentScans);
    setVerifying(true);
    try {
      const res = await attendanceService.verifyAndRecordAttendance(
        token,
        profile?.id || ''
      );
      setScanResult(res);
      if (res.success) {
        toast.success(res.message);
        const newScanItem: RecentScan = {
          id: crypto.randomUUID(),
          studentName: res.data?.studentName || 'Student Participant',
          eventName: res.data?.eventName || 'Campus Event',
          checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'verified'
        };
        setRecentScans(prev => {
          const updated = [newScanItem, ...prev.slice(0, 9)];
          console.log("History AFTER successful scan:", updated);
          return updated;
        });
        await loadScanHistory();
      } else {
        toast.warning(res.message);
      }
    } catch {
      setScanResult({ success: false, message: 'Verification error' });
    } finally {
      setVerifying(false);
    }
  };

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (scannerRef.current) {
      await scannerRef.current.pause(true);
    }
    await processScanToken(decodedText);
  }, [profile?.id]);

  const startScanner = async (currentFacingMode: 'environment' | 'user' = facingMode) => {
    if (isInitializingRef.current) return;
    if (!checkProfileGuard()) return;
    
    try {
      isInitializingRef.current = true;
      setScanResult(null);
      setIsScanning(true);

      await new Promise((resolve) => setTimeout(resolve, 50));
      
      const { Html5Qrcode } = await import('html5-qrcode');
      
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: currentFacingMode },
        { 
          fps: 10, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return { width: Math.max(220, Math.floor(minDim * 0.7)), height: Math.max(220, Math.floor(minDim * 0.7)) };
          } 
        },
        onScanSuccess,
        () => {}
      );
    } catch (err: any) {
      console.error('Camera scanner error:', err);
      setIsScanning(false);
      if (err?.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please grant permissions in your browser and try again.');
      } else {
        toast.error('Failed to start camera scanner: ' + (err?.message || 'Unknown error'));
      }
    } finally {
      isInitializingRef.current = false;
    }
  };

  const toggleCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (isScanning) {
      await stopScanner();
      await startScanner(newMode);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner', e);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    processScanToken(manualId);
    setManualId('');
  };

  const handleSimulateScan = () => {
    if (!checkProfileGuard()) return;
    processScanToken('EH-EVT1-REG1-SECUREPASS-2026');
  };

  const resetScanner = async () => {
    console.log("History AFTER Scan Next:", recentScans);
    setScanResult(null);
    setManualId('');
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    await startScanner();
  };

  const handleManualCheckIn = async (r: ManualSearchResult) => {
    if (!checkProfileGuard()) return;
    setCheckingInId(r.id);
    setManualCheckInResult(null);
    try {
      const res = await attendanceService.manualCheckIn(
        r.event_id,
        r.id,
        r.user_id,
        profile?.id || ''
      );
      setManualCheckInResult(res);
      if (res.success) {
        toast.success(res.message);
        setSearchResults(prev => prev.filter(item => item.id !== r.id));
        setRecentScans(prev => [
          {
            id: crypto.randomUUID(),
            studentName: r.profiles?.full_name || 'Participant',
            eventName: r.events?.title || 'Event',
            checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'verified'
          },
          ...prev.slice(0, 9)
        ]);
      } else {
        toast.warning(res.message);
      }
    } catch {
      toast.error('Failed to process check-in');
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Live Attendance Scanner</h1>
          <p className="text-muted-foreground text-sm">Scan student registration QR passes or perform manual lookup</p>
        </div>
        <Button onClick={handleSimulateScan} variant="outline" size="sm" className="bg-[#edfcf6] text-[#007C46] border-[#41B177] font-bold">
          <Zap className="mr-1.5 h-4 w-4 text-amber-500" /> Demo Pass Scan
        </Button>
      </div>

      {/* SINGLE SEGMENTED TAB BAR: [ Live Scanner | Manual Token | Search Participant ] */}
      <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl border flex items-center gap-1 w-full max-w-xl mx-auto">
        <button
          onClick={() => {
            setActiveTab('live');
            setManualCheckInResult(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'live'
              ? 'bg-[#01424E] text-[#7CEAAB] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ScanLine className="h-4 w-4" />
          <span>Live Scanner</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('token');
            if (isScanning) stopScanner();
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'token'
              ? 'bg-[#01424E] text-[#7CEAAB] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Manual Token</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('search');
            if (isScanning) stopScanner();
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'search'
              ? 'bg-[#01424E] text-[#7CEAAB] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Search Participant</span>
        </button>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {/* 1. LIVE CAMERA SCANNER TAB */}
      {activeTab === 'live' && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md max-w-2xl mx-auto overflow-hidden">
          <CardHeader className="pb-3 border-b text-center">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-[#007C46]" /> Camera Viewport
              </CardTitle>
              <Badge className={isScanning ? 'bg-[#007C46] text-white animate-pulse' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}>
                {isScanning ? '● CAMERA LIVE' : 'SCANNER IDLE'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {!scanResult && (
              <div className="space-y-4">
                <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-dashed border-[#01424E] min-h-[320px] bg-slate-950 flex flex-col items-center justify-center shadow-inner">
                  {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6 z-10 bg-slate-950/90">
                      <ScanLine className="h-16 w-16 mx-auto mb-3 text-[#7CEAAB] opacity-80 animate-pulse" />
                      <p className="font-bold text-lg text-teal-100">Camera Scanner Off</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Click below to activate device camera and scan student passes
                      </p>
                    </div>
                  )}
                  <div 
                    id="qr-reader" 
                    className="w-full h-full min-h-[320px] flex items-center justify-center overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-xl"
                    style={{ display: isScanning ? 'block' : 'none' }}
                  ></div>
                </div>
                
                <div className="flex justify-center gap-3">
                  {!isScanning ? (
                    <Button onClick={() => startScanner()} className="w-full max-w-md bg-[#01424E] text-[#7CEAAB] hover:bg-[#013540] font-bold h-11 text-sm shadow-md">
                      <ScanLine className="mr-2 h-5 w-5" /> Start Camera Scanner
                    </Button>
                  ) : (
                    <div className="flex w-full max-w-md gap-3">
                      <Button onClick={stopScanner} variant="destructive" className="flex-1 font-bold">
                        <StopCircle className="mr-2 h-4 w-4" /> Stop Scanner
                      </Button>
                      <Button onClick={toggleCamera} variant="outline" className="flex-1 font-bold">
                        <Camera className="mr-2 h-4 w-4" /> Flip Camera
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {scanResult && (
              <div className={`p-6 rounded-2xl border text-center space-y-4 shadow-sm ${
                scanResult.success 
                  ? scanResult.actionType === 'check_out'
                    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                    : 'bg-teal-50 border-teal-300 dark:bg-teal-950/40 dark:border-teal-800'
                  : 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
              }`}>
                {scanResult.success ? (
                  <CheckCircle2 className="h-16 w-16 text-[#007C46] mx-auto animate-scale-in" />
                ) : (
                  <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto animate-scale-in" />
                )}
                
                <div>
                  <Badge className={
                    scanResult.actionType === 'check_in'
                      ? 'bg-amber-600 text-white mb-2 font-bold text-xs uppercase px-3 py-1'
                      : scanResult.actionType === 'check_out'
                        ? 'bg-[#007C46] text-white mb-2 font-bold text-xs uppercase px-3 py-1'
                        : 'bg-slate-700 text-white mb-2 font-bold text-xs uppercase px-3 py-1'
                  }>
                    {scanResult.actionType === 'check_in'
                      ? 'Check-In Successful'
                      : scanResult.actionType === 'check_out'
                        ? 'Check-Out Successful'
                        : scanResult.message === 'Attendance already completed.'
                          ? 'Attendance Already Completed'
                          : 'Attendance Alert'}
                  </Badge>

                  <h3 className="text-xl font-bold text-[#01424E] dark:text-teal-100 whitespace-pre-line leading-relaxed">
                    {scanResult.message}
                  </h3>
                  
                  {scanResult.data && (
                    <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border text-left space-y-2 text-xs max-w-sm mx-auto shadow-sm">
                      <div>👤 <strong>Student Name:</strong> {scanResult.data.studentName}</div>
                      <div>🎯 <strong>Event:</strong> {scanResult.data.eventName}</div>
                      <div>🎫 <strong>Registration ID:</strong> {scanResult.data.registrationId}</div>
                      {scanResult.data.checkInTime && <div>⏰ <strong>Check-in Time:</strong> {scanResult.data.checkInTime}</div>}
                      {scanResult.data.checkOutTime && <div>🏁 <strong>Check-out Time:</strong> {scanResult.data.checkOutTime}</div>}
                      {scanResult.data.duration && <div>⏱️ <strong>Duration:</strong> {scanResult.data.duration}</div>}
                      {scanResult.data.status && (
                        <div>
                          📌 <strong>Status:</strong>{' '}
                          <Badge className={scanResult.data.status === 'Pending Checkout' ? 'bg-amber-500 text-white text-[10px]' : 'bg-[#007C46] text-white text-[10px]'}>
                            {scanResult.data.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button onClick={resetScanner} size="lg" className="mt-4 bg-[#01424E] text-[#7CEAAB] font-bold hover:bg-[#013540]">
                  <RefreshCw className="mr-2 h-4 w-4" /> Scan Next Participant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. MANUAL PASS TOKEN TAB */}
      {activeTab === 'token' && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#007C46]" /> Manual Pass Token Entry
            </CardTitle>
            <CardDescription className="text-xs">
              Enter or paste the encrypted pass token printed on digital event tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Pass Token ID
              </Label>
              <Input 
                placeholder="e.g. EH-EVT1-REG1-SECUREPASS-2026" 
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="font-mono text-xs h-11"
              />
              <Button type="submit" disabled={verifying} className="w-full bg-[#007C46] text-white font-bold h-11">
                {verifying ? 'Verifying Pass...' : 'Verify Registration Pass'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 3. SEARCH PARTICIPANT TAB */}
      {activeTab === 'search' && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <Search className="h-5 w-5 text-[#007C46]" /> Manual Participant Lookup
            </CardTitle>
            <CardDescription className="text-xs">
              Search by student name, email, or PRN for 1-click manual check-in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {manualCheckInResult && (
              <div className={`p-4 rounded-xl border space-y-2 ${
                manualCheckInResult.success 
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' 
                  : 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs text-[#01424E] dark:text-teal-100">
                  {manualCheckInResult.success ? <CheckCircle2 className="h-4 w-4 text-[#007C46]" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  <span>{manualCheckInResult.message}</span>
                </div>
              </div>
            )}

            {approvedEvents.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="event-filter" className="text-xs font-semibold">Filter Event</Label>
                <select
                  id="event-filter"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="">All Approved Events</option>
                  {approvedEvents.map((ve: any) => (
                    <option key={ve.events?.id} value={ve.events?.id}>
                      {ve.events?.title || 'Unnamed Event'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="manual-search" className="text-xs font-semibold">Search Query</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="manual-search"
                  placeholder="Type student name, email, or PRN..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setManualCheckInResult(null);
                  }}
                  className="pl-10 text-xs h-10"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {searching && searchResults.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-xs">Searching registrations...</div>
              )}

              {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <div className="py-8 text-center text-muted-foreground border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs">
                  No matching registered participants found.
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {searchResults.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 border rounded-xl bg-white dark:bg-slate-900 hover:shadow-sm flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={r.profiles?.profile_picture || ''} />
                          <AvatarFallback className="bg-[#7CEAAB]/20 text-[#01424E] font-bold text-xs">
                            {(r.profiles?.full_name || 'S').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#01424E] dark:text-teal-100 truncate">{r.profiles?.full_name}</h4>
                          <p className="text-[11px] text-muted-foreground truncate">{r.profiles?.email} • PRN: {r.profiles?.prn || 'N/A'}</p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleManualCheckIn(r)}
                        disabled={checkingInId === r.id || r.status === 'completed'}
                        className="bg-[#007C46] text-white hover:bg-[#007C46]/90 text-xs font-bold shrink-0"
                      >
                        {checkingInId === r.id ? 'Checking in...' : r.status === 'completed' ? 'Checked In' : 'Check In'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RECENT SHIFT SCANS FEED BELOW SCANNER */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <History className="h-4 w-4 text-[#007C46]" /> Shift Verification History
            </CardTitle>
            <CardDescription className="text-xs">Live record of participant passes verified during this shift</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-bold">
            {recentScans.length} Verified
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {recentScans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                  <TableHead className="font-bold text-xs uppercase">Student Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Event Title</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Check-In</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Check-Out</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Duration</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentScans.map((scan) => (
                  <TableRow key={scan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                    <TableCell className="font-bold text-[#01424E] dark:text-teal-100">{scan.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{scan.eventName}</TableCell>
                    <TableCell className="text-muted-foreground font-mono">{scan.checkInTime}</TableCell>
                    <TableCell className="text-muted-foreground font-mono">{scan.checkOutTime || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono">{scan.duration || '-'}</TableCell>
                    <TableCell className="text-center">
                      {scan.status === 'pending_checkout' ? (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] font-bold">
                          Pending Checkout
                        </Badge>
                      ) : (
                        <Badge className="bg-[#edfcf6] text-[#007C46] border border-[#41B177] text-[10px] font-bold">
                          <Check className="mr-1 h-3 w-3" /> Present
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <ScanLine className="h-8 w-8 mx-auto opacity-40 text-[#01424E]" />
              <p className="text-xs font-semibold">No shift scans recorded yet</p>
              <p className="text-[11px]">Scanned participant passes will appear here in real-time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ProfileGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
        actionName="scan attendance or verify participants"
        userRole="volunteer"
      />
    </div>
  );
}
