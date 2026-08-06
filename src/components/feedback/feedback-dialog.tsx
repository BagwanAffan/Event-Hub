'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './star-rating';
import { isEditableWithin24h } from '@/hooks/use-feedback';
import type { Feedback, FeedbackSubmissionPayload } from '@/types/database.types';
import { ThumbsUp, ThumbsDown, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  existingFeedback?: Feedback | null;
  onSubmit: (payload: Omit<FeedbackSubmissionPayload, 'userId' | 'eventId'>) => Promise<boolean>;
  submitting?: boolean;
}

export function FeedbackDialog({
  isOpen,
  onClose,
  event,
  existingFeedback,
  onSubmit,
  submitting = false,
}: FeedbackDialogProps) {
  const [overallRating, setOverallRating] = useState<number>(5);
  const [organizationRating, setOrganizationRating] = useState<number>(5);
  const [contentRating, setContentRating] = useState<number>(5);
  const [venueRating, setVenueRating] = useState<number>(5);
  const [speakerRating, setSpeakerRating] = useState<number>(5);
  const [recommendation, setRecommendation] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [comment, setComment] = useState<string>('');
  const [anonymous, setAnonymous] = useState<boolean>(false);

  const canEdit = !existingFeedback || isEditableWithin24h(existingFeedback.created_at);

  useEffect(() => {
    if (existingFeedback) {
      setOverallRating(existingFeedback.overall_rating || existingFeedback.rating || 5);
      setOrganizationRating(existingFeedback.organization_rating || existingFeedback.overall_rating || 5);
      setContentRating(existingFeedback.content_rating || existingFeedback.overall_rating || 5);
      setVenueRating(existingFeedback.venue_rating || existingFeedback.overall_rating || 5);
      setSpeakerRating(existingFeedback.speaker_rating || existingFeedback.overall_rating || 5);
      setRecommendation(existingFeedback.recommendation || 'yes');
      setComment(existingFeedback.comment || existingFeedback.feedback || '');
      setAnonymous(existingFeedback.anonymous ?? false);
    } else {
      setOverallRating(5);
      setOrganizationRating(5);
      setContentRating(5);
      setVenueRating(5);
      setSpeakerRating(5);
      setRecommendation('yes');
      setComment('');
      setAnonymous(false);
    }
  }, [existingFeedback, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    await onSubmit({
      overallRating,
      organizationRating,
      contentRating,
      venueRating,
      speakerRating,
      recommendation,
      comment: comment.trim(),
      anonymous,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#007C46] text-white">Event Feedback</Badge>
            {existingFeedback && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                {canEdit ? 'Edit Feedback' : 'Read Only'}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-[#01424E] dark:text-teal-100 pt-1">
            Rate & Review Event
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            {event?.title || 'Share your experience to help us improve future events'}
          </DialogDescription>
        </DialogHeader>

        {!canEdit && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>This review was submitted over 24 hours ago and is now read-only.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Overall Rating */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <Label className="text-sm font-bold text-[#01424E] dark:text-teal-200 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" /> Overall Experience *
            </Label>
            <StarRating
              size="lg"
              value={overallRating}
              onChange={setOverallRating}
              readOnly={!canEdit || submitting}
            />
            <span className="text-xs font-semibold text-slate-500">
              {overallRating === 5 && 'Excellent! Loved it! 🌟'}
              {overallRating === 4 && 'Very Good! 👍'}
              {overallRating === 3 && 'Average / Good 👌'}
              {overallRating === 2 && 'Needs Improvement 👎'}
              {overallRating === 1 && 'Poor Experience 😞'}
            </span>
          </div>

          {/* Detailed Category Ratings */}
          <div className="space-y-3.5 border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Breakdown</h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Event Organization</span>
                <StarRating
                  size="sm"
                  value={organizationRating}
                  onChange={setOrganizationRating}
                  readOnly={!canEdit || submitting}
                />
              </div>

              <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Content / Sessions</span>
                <StarRating
                  size="sm"
                  value={contentRating}
                  onChange={setContentRating}
                  readOnly={!canEdit || submitting}
                />
              </div>

              <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Venue & Facilities</span>
                <StarRating
                  size="sm"
                  value={venueRating}
                  onChange={setVenueRating}
                  readOnly={!canEdit || submitting}
                />
              </div>

              <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Speakers & Mentors (Optional)</span>
                <StarRating
                  size="sm"
                  value={speakerRating}
                  onChange={setSpeakerRating}
                  readOnly={!canEdit || submitting}
                />
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Would you recommend this event?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!canEdit || submitting}
                onClick={() => setRecommendation('yes')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all',
                  recommendation === 'yes'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" /> Yes
              </button>

              <button
                type="button"
                disabled={!canEdit || submitting}
                onClick={() => setRecommendation('maybe')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all',
                  recommendation === 'maybe'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500'
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" /> Maybe
              </button>

              <button
                type="button"
                disabled={!canEdit || submitting}
                onClick={() => setRecommendation('no')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all',
                  recommendation === 'no'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-500'
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" /> No
              </button>
            </div>
          </div>

          {/* Comments Textarea */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Comments & Suggestions
              </Label>
              <span className={cn('text-[11px] font-mono', comment.length > 280 ? 'text-amber-500 font-bold' : 'text-slate-400')}>
                {comment.length} / 300
              </span>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 300))}
              disabled={!canEdit || submitting}
              placeholder="Share your experience... What did you like? What can be improved?"
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* Anonymous Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="anonymous-check"
              checked={anonymous}
              onCheckedChange={(checked) => setAnonymous(!!checked)}
              disabled={!canEdit || submitting}
            />
            <Label htmlFor="anonymous-check" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              Submit anonymously (your name will not be shown to organizers)
            </Label>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {canEdit && (
              <Button
                type="submit"
                size="sm"
                disabled={submitting || overallRating < 1}
                className="bg-[#007C46] hover:bg-[#007C46]/90 text-white font-bold"
              >
                {submitting ? 'Saving...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
