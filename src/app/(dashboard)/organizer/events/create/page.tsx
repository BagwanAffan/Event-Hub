'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Calendar, MapPin, Users, IndianRupee, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Wand2, Plus, Trash2, X } from 'lucide-react';
import { eventService } from '@/services/event-service';
import { toast } from 'sonner';

import { checkProfileCompletion } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';
import { OrganizerApprovalDialog } from '@/components/shared/organizer-approval-dialog';

export default function CreateEventPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [guardOpen, setGuardOpen] = useState(false);
  const [approvalGuardOpen, setApprovalGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    category: 'hackathon',
    event_type: 'offline',
    venue: 'Main Campus Auditorium',
    building: 'Block B, 3rd Floor',
    room: 'Lab 301-304',
    start_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16),
    registration_deadline: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 16),
    registration_fee: 0,
    registration_mode: 'individual',
    max_participants: 100,
    max_teams: 25,
    max_team_size: 4,
    poster_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
    banner_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200',
    payment_instructions: 'Pay via UPI ID: eventhub@upi or scan organizer QR. Upload transaction reference number & screenshot.',
    contact_email: profile?.email || 'organizer@eventhub.edu',
    contact_phone: '+91 98123 45678',
    tags: ['coding', 'ai', 'campus-event'],
    rules: [
      'Participants must carry valid physical college ID cards.',
      'All submissions must be built during the official competition timeline.'
    ],
    faqs: [
      { question: 'Is accommodation provided?', answer: 'Yes, overnight stay facilities are available in Block B hostel.' }
    ],
    need_volunteers: false,
    volunteers_needed: 5,
    volunteer_roles: ['QR Scanner', 'Registration Desk'],
    reporting_location: 'Main Campus Auditorium - Main Entrance',
    reporting_time: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
    shift_start_time: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
    shift_end_time: new Date(Date.now() + 2 * 86400000 + 4 * 3600000).toISOString().slice(0, 16),
    volunteer_instructions: 'Wear physical college volunteer badge. Arrive 20 minutes early for briefing.',
  });

  const [customRoleInput, setCustomRoleInput] = useState('');

  // Check profile completion immediately when organizer opens Create Event page
  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'organizer') {
      const completion = checkProfileCompletion(profile);
      if (!completion.isComplete) {
        setMissingFields(completion.missingFields.filter(f => !f.includes('Recommended')));
        setGuardOpen(true);
      }
    }
  }, [profile]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a short description or topic for AI Event Copilot');
      return;
    }

    setIsAiGenerating(true);
    toast.info('AI Copilot is structuring your event details...');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: 'event_creation', prompt: aiPrompt })
      });
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        setFormData(prev => ({
          ...prev,
          title: d.title || prev.title,
          short_description: d.short_description || prev.short_description,
          description: d.description || prev.description,
          category: d.category || prev.category,
          venue: d.venue || prev.venue,
          registration_fee: d.registration_fee ?? prev.registration_fee,
          max_team_size: d.max_team_size || prev.max_team_size,
          rules: d.rules && d.rules.length ? d.rules : prev.rules,
          faqs: d.faqs && d.faqs.length ? d.faqs : prev.faqs,
          tags: d.tags || prev.tags
        }));
        toast.success('AI Event details generated! Review & edit below.');
      }
    } catch {
      toast.error('AI generation failed, using standard template');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!formData.title?.trim()) {
      toast.error('Please enter an event title');
      setStep(1);
      return;
    }

    if (profile?.role === 'organizer' && profile?.organizer_status && profile.organizer_status !== 'approved') {
      setApprovalGuardOpen(true);
      return;
    }

    const completion = checkProfileCompletion(profile);
    if (!completion.isComplete) {
      setMissingFields(completion.missingFields.filter(f => !f.includes('Recommended')));
      setGuardOpen(true);
      return;
    }

    setLoading(true);
    try {
      const newEvt = await eventService.createEvent({
        ...formData,
        status,
        created_by: profile!.id
      });

      if (!newEvt) {
        throw new Error('Database operation failed: No event data returned.');
      }

      toast.success(status === 'published' ? 'Event Published Successfully! 🎉' : 'Event Saved as Draft!');
      router.push('/organizer/events');
    } catch (err: any) {
      console.error('Event submission error:', err);
      toast.error(err?.message || 'Failed to save event to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Create New Event</h1>
          <p className="text-muted-foreground text-sm">Step-by-step wizard to setup, publish, and open registrations</p>
        </div>
        <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] px-3 py-1 text-xs">
          Step {step} of 6
        </Badge>
      </div>

      {/* Wizard Progress Indicator */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {['1. Basic Info', '2. Schedule & Venue', '3. Registration & Fee', '4. Volunteer Requirements', '5. Rules & FAQs', '6. Preview & Publish'].map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isComplete = step > stepNum;
          return (
            <button
              key={label}
              onClick={() => setStep(stepNum)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#01424E] text-[#7CEAAB] shadow-md'
                  : isComplete
                  ? 'bg-[#edfcf6] text-[#007C46] border border-[#41B177]'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
              }`}
            >
              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <span>{stepNum}.</span>}
              <span>{label.replace(/^\d+\.\s*/, '')}</span>
            </button>
          );
        })}
      </div>

      {/* AI Copilot Prompt Bar */}
      <Card className="border-2 border-dashed border-[#7CEAAB] bg-[#edfcf6]/50 dark:bg-teal-950/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-[#01424E] dark:text-[#7CEAAB] font-bold text-sm shrink-0">
              <Sparkles className="h-5 w-5 text-[#007C46]" /> AI Copilot:
            </div>
            <Input
              placeholder="e.g. 24-hour hackathon for 2nd year students with ₹200 fee and team of 4"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="bg-white dark:bg-slate-900 border-slate-200"
            />
            <Button
              onClick={handleAiGenerate}
              disabled={isAiGenerating}
              className="bg-[#007C46] text-white hover:bg-[#007C46]/90 shrink-0"
            >
              <Wand2 className="mr-2 h-4 w-4" /> {isAiGenerating ? 'Generating...' : 'Auto-Fill Details'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">Step 1: Basic Event Details</CardTitle>
            <CardDescription>Enter title, category, description, and cover poster</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">Event Title *</Label>
              <Input
                placeholder="e.g. TechSprint 2026 Hackathon"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Category</Label>
                <Select value={formData.category} onValueChange={(val) => handleChange('category', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="workshop">Workshop & Keynote</SelectItem>
                    <SelectItem value="robotics">Robotics & Engineering</SelectItem>
                    <SelectItem value="cultural">Cultural & Arts</SelectItem>
                    <SelectItem value="sports">Sports Tournament</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Event Type</Label>
                <Select value={formData.event_type} onValueChange={(val) => handleChange('event_type', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">In-Person (Offline)</SelectItem>
                    <SelectItem value="online">Virtual (Online)</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Short Tagline Description</Label>
              <Input
                placeholder="A brief 1-line summary for event cards"
                value={formData.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Full Event Description</Label>
              <Textarea
                rows={5}
                placeholder="Comprehensive overview of agenda, tracks, prizes, and requirements..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Poster Image URL</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={formData.poster_url}
                onChange={(e) => handleChange('poster_url', e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t p-4">
            <Button onClick={() => setStep(2)} className="bg-[#01424E] text-[#7CEAAB]">Next: Schedule & Venue <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Schedule & Venue */}
      {step === 2 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">Step 2: Schedule & Location</CardTitle>
            <CardDescription>Configure dates, registration deadlines, and physical venue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Event Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Event End Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Registration Deadline</Label>
              <Input
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => handleChange('registration_deadline', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Primary Venue</Label>
                <Input
                  placeholder="e.g. Main Auditorium"
                  value={formData.venue}
                  onChange={(e) => handleChange('venue', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Building / Block</Label>
                <Input
                  placeholder="e.g. Block B"
                  value={formData.building}
                  onChange={(e) => handleChange('building', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Room / Lab Number</Label>
                <Input
                  placeholder="e.g. Lab 301-304"
                  value={formData.room}
                  onChange={(e) => handleChange('room', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-2 border-t p-4">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(3)} className="bg-[#01424E] text-[#7CEAAB]">Next: Registration & Fee <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Registration & Fee */}
      {step === 3 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">Step 3: Registration Rules & Fee</CardTitle>
            <CardDescription>Configure individual/team mode, max caps, fee amount, and payment guide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Registration Mode</Label>
                <Select value={formData.registration_mode} onValueChange={(val) => handleChange('registration_mode', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Registration</SelectItem>
                    <SelectItem value="team">Team Registration</SelectItem>
                    <SelectItem value="both">Both Allowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Registration Fee (₹)</Label>
                <Input
                  type="number"
                  placeholder="0 for Free event"
                  value={formData.registration_fee}
                  onChange={(e) => handleChange('registration_fee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Max Total Participants</Label>
                <Input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => handleChange('max_participants', parseInt(e.target.value) || 100)}
                />
              </div>
              {formData.registration_mode !== 'individual' && (
                <>
                  <div className="space-y-2">
                    <Label className="font-semibold">Max Teams Cap</Label>
                    <Input
                      type="number"
                      value={formData.max_teams}
                      onChange={(e) => handleChange('max_teams', parseInt(e.target.value) || 25)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Max Members Per Team</Label>
                    <Input
                      type="number"
                      value={formData.max_team_size}
                      onChange={(e) => handleChange('max_team_size', parseInt(e.target.value) || 4)}
                    />
                  </div>
                </>
              )}
            </div>

            {formData.registration_fee > 0 && (
              <div className="space-y-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                <Label className="font-semibold text-amber-900 dark:text-amber-300">Payment Instructions for Students</Label>
                <Textarea
                  rows={3}
                  value={formData.payment_instructions}
                  onChange={(e) => handleChange('payment_instructions', e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-2 border-t p-4">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(4)} className="bg-[#01424E] text-[#7CEAAB]">Next: Volunteer Requirements <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: Volunteer Requirements */}
      {step === 4 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">Step 4: Volunteer Requirements</CardTitle>
            <CardDescription>Configure volunteer assistance, roles, reporting schedule, and special instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-[#01424E] dark:text-teal-100 cursor-pointer" htmlFor="need-volunteers-toggle">
                  Need Volunteers
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable if this event requires student volunteers for management and operations.
                </p>
              </div>
              <input
                id="need-volunteers-toggle"
                type="checkbox"
                checked={formData.need_volunteers}
                onChange={(e) => handleChange('need_volunteers', e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-[#007C46] focus:ring-[#007C46] cursor-pointer"
              />
            </div>

            {formData.need_volunteers ? (
              <div className="space-y-6 animate-fade-in pt-2">
                <div className="space-y-2">
                  <Label className="font-semibold">Volunteers Required (Number of Slots) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.volunteers_needed ?? 5}
                    onChange={(e) => handleChange('volunteers_needed', parseInt(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold">Roles Required</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'QR Scanner',
                      'Registration Desk',
                      'Hospitality',
                      'Stage Management',
                      'Photography',
                      'Videography',
                      'Technical Support',
                      'Decoration',
                      'Publicity',
                    ].map((role) => {
                      const isSelected = formData.volunteer_roles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? formData.volunteer_roles.filter((r) => r !== role)
                              : [...formData.volunteer_roles, role];
                            handleChange('volunteer_roles', updated);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-[#007C46] text-white border-[#007C46] shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#41B177]'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>

                  {formData.volunteer_roles.filter(
                    (r) =>
                      ![
                        'QR Scanner',
                        'Registration Desk',
                        'Hospitality',
                        'Stage Management',
                        'Photography',
                        'Videography',
                        'Technical Support',
                        'Decoration',
                        'Publicity',
                      ].includes(r)
                  ).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.volunteer_roles
                        .filter(
                          (r) =>
                            ![
                              'QR Scanner',
                              'Registration Desk',
                              'Hospitality',
                              'Stage Management',
                              'Photography',
                              'Videography',
                              'Technical Support',
                              'Decoration',
                              'Publicity',
                            ].includes(r)
                        )
                        .map((role) => (
                          <Badge
                            key={role}
                            className="bg-[#7CEAAB]/20 text-[#01424E] border border-[#41B177]/40 flex items-center gap-1.5"
                          >
                            <span>{role}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleChange(
                                  'volunteer_roles',
                                  formData.volunteer_roles.filter((r) => r !== role)
                                )
                              }
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2 max-w-sm pt-1">
                    <Input
                      placeholder="Add custom role (Other)..."
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      className="text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customRoleInput.trim() && !formData.volunteer_roles.includes(customRoleInput.trim())) {
                            handleChange('volunteer_roles', [...formData.volunteer_roles, customRoleInput.trim()]);
                            setCustomRoleInput('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (customRoleInput.trim() && !formData.volunteer_roles.includes(customRoleInput.trim())) {
                          handleChange('volunteer_roles', [...formData.volunteer_roles, customRoleInput.trim()]);
                          setCustomRoleInput('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Reporting Location *</Label>
                  <Input
                    placeholder="e.g. Main Campus Auditorium - Main Entrance Desk"
                    value={formData.reporting_location}
                    onChange={(e) => handleChange('reporting_location', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Reporting Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.reporting_time}
                      onChange={(e) => handleChange('reporting_time', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Shift Start Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.shift_start_time}
                      onChange={(e) => handleChange('shift_start_time', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Shift End Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.shift_end_time}
                      onChange={(e) => handleChange('shift_end_time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Special Instructions</Label>
                  <Textarea
                    rows={3}
                    placeholder="Dress code, briefing instructions, required gear..."
                    value={formData.volunteer_instructions}
                    onChange={(e) => handleChange('volunteer_instructions', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground bg-slate-50/50 dark:bg-slate-900/30">
                <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-50 text-[#01424E] dark:text-[#7CEAAB]" />
                <p className="font-semibold text-[#01424E] dark:text-teal-200">No Volunteer Requirement</p>
                <p className="text-xs mt-1">Enable the toggle above if your event needs volunteer crew assistance.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-2 border-t p-4">
            <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(5)} className="bg-[#01424E] text-[#7CEAAB]">Next: Rules & FAQs <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: Rules & FAQs */}
      {step === 5 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">Step 5: Competition Rules & FAQs</CardTitle>
            <CardDescription>Define terms, guidelines, and participant questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="font-semibold">Rules & Code of Conduct</Label>
              {formData.rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={rule}
                    onChange={(e) => {
                      const updated = [...formData.rules];
                      updated[idx] = e.target.value;
                      handleChange('rules', updated);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated = formData.rules.filter((_, i) => i !== idx);
                      handleChange('rules', updated);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChange('rules', [...formData.rules, 'New event guideline...'])}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Rule
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-2 border-t p-4">
            <Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(6)} className="bg-[#01424E] text-[#7CEAAB]">Next: Preview & Publish <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 6: Preview & Publish */}
      {step === 6 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">Step 6: Event Preview & Final Confirmation</CardTitle>
            <CardDescription>Review all details before publishing live to the student portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="bg-[#01424E] text-[#7CEAAB] capitalize mb-2">{formData.category}</Badge>
                  <h3 className="text-2xl font-bold text-[#01424E] dark:text-teal-100">{formData.title}</h3>
                  <p className="text-sm text-muted-foreground">{formData.short_description}</p>
                </div>
                <div className="text-right font-bold text-lg text-[#007C46]">
                  {formData.registration_fee > 0 ? `₹${formData.registration_fee}` : 'FREE ENTRY'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>🗓 <strong>Start Date:</strong> {new Date(formData.start_date).toLocaleString()}</div>
                <div>📍 <strong>Venue:</strong> {formData.venue}, {formData.building}</div>
                <div>👥 <strong>Mode:</strong> {formData.registration_mode} (Max {formData.max_team_size}/team)</div>
              </div>

              {formData.need_volunteers && (
                <div className="p-4 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 border border-[#41B177]/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#01424E] dark:text-teal-100">🤝 Volunteer Configuration</span>
                    <Badge className="bg-[#007C46] text-white">{formData.volunteers_needed} Volunteers Needed</Badge>
                  </div>
                  <div>📍 <strong>Reporting Location:</strong> {formData.reporting_location}</div>
                  <div>⏰ <strong>Reporting Time:</strong> {new Date(formData.reporting_time).toLocaleString()}</div>
                  <div>
                    <strong>Roles Required:</strong>{' '}
                    {formData.volunteer_roles.join(', ') || 'General Volunteers'}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{formData.description}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t p-4">
            <Button variant="outline" onClick={() => setStep(5)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Rules</Button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={loading}>
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmit('published')} disabled={loading} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold px-6">
                🚀 Publish Event Live
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      <ProfileGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
        actionName="create or publish events"
        userRole={profile?.role || 'organizer'}
      />
      <OrganizerApprovalDialog
        open={approvalGuardOpen}
        onOpenChange={setApprovalGuardOpen}
        status={profile?.organizer_status}
      />
    </div>
  );
}
