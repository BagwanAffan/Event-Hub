'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { registrationService } from '@/services/registration-service';
import { paymentService } from '@/services/payment-service';
import { storageService } from '@/services/storage-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, UploadCloud, Info, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentPage({ params }: { params: Promise<{ registrationId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      console.log("[TRACE] PaymentPage loadData triggered with registrationId:", resolvedParams.registrationId);
      try {
        setLoading(true);
        const data = await registrationService.getRegistrationById(resolvedParams.registrationId);
        console.log("[TRACE] getRegistrationById returned data:", JSON.stringify(data));
        console.log("[TRACE] fetched event object:", JSON.stringify(data?.events));
        
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: paymentRecord } = await supabase
          .from("payments")
          .select("*")
          .eq("registration_id", resolvedParams.registrationId)
          .maybeSingle();

        console.log("[TRACE] fetched payment object:", JSON.stringify(paymentRecord));
        
        if (!data) {
          console.error("[TRACE] Registration not found in database for ID:", resolvedParams.registrationId);
          toast.error('Registration not found');
          console.log("[TRACE] Redirecting to /student/registrations");
          router.push('/student/registrations');
          return;
        }
        
        console.log(`[TRACE] Registration found. payment_status: ${data.payment_status}`);
        
        if (data.payment_status === 'approved' || data.payment_status === 'under_review') {
          console.log("[TRACE] Payment already submitted or approved. Redirecting to registrations details page...");
          toast.info('Payment already submitted');
          router.push(`/student/registrations/${data.id}`);
          return;
        }
        
        setRegistration(data);
        console.log("[TRACE] Registration state set on PaymentPage successfully");
      } catch (error) {
        console.error('[TRACE] Error fetching registration in PaymentPage:', error);
        toast.error('Failed to load details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.registrationId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      toast.error('Only PNG, JPEG, and WEBP formats are supported');
      return;
    }
    
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    
    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || !transactionRef) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!file) {
      toast.error('Please upload a payment screenshot');
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress('Uploading screenshot...');
      
      const screenshot_url = await storageService.uploadFile('payment-screenshots', `payments/${registration.id}`, file);
      
      setUploadProgress('Submitting payment details...');
      await paymentService.createPayment({
        registration_id: registration.id,
        event_id: registration.event_id,
        user_id: registration.user_id,
        amount: registration.events?.registration_fee || 0,
        payment_method: (paymentMethod.toLowerCase() || 'other') as any,
        transaction_reference: transactionRef,
        remarks: remarks,
        screenshot_url
      });
      
      toast.success('Payment submitted successfully! Awaiting verification.');
      router.push(`/student/registrations/${registration.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!registration) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 fade-in">
      <Button variant="ghost" className="pl-0 text-muted-foreground" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-white">
          Submit Payment
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete your registration for {registration.events?.title}
        </p>
      </div>

      <Card className="border-[#01424E]/20 bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Amount to Pay</p>
            <p className="text-3xl font-bold text-[#01424E] dark:text-white">₹{registration.events?.registration_fee || 0}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-[#7CEAAB]/20 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-[#007C46]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Enter your transaction details below after making the payment to the organizers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-800 text-sm">
                <Info className="h-5 w-5 shrink-0" />
                <p>Please pay ₹{registration.events?.registration_fee || 0} using UPI ID <strong>college@upi</strong> or directly at the registration desk, then fill this form.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method <span className="text-red-500">*</span></Label>
                <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash (at desk)</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionRef">Transaction Reference / UTR <span className="text-red-500">*</span></Label>
                <Input 
                  id="transactionRef" 
                  placeholder="e.g. 123456789012" 
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">Payment Screenshot <span className="text-red-500">*</span></Label>
                {!file ? (
                  <Label
                    htmlFor="screenshot-upload"
                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
                    <input 
                      id="screenshot-upload" 
                      type="file" 
                      accept="image/png,image/jpeg,image/webp" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </Label>
                ) : (
                  <div className="relative border rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {previewUrl && (
                      <img src={previewUrl} alt="Preview" className="max-h-40 object-contain mb-2 rounded" />
                    )}
                    <p className="text-sm font-medium truncate max-w-full">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea 
                  id="remarks" 
                  placeholder="Any additional information" 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-[#01424E] hover:bg-[#007C46]" disabled={submitting}>
              {submitting ? (uploadProgress || 'Submitting...') : 'Submit Payment Details'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
