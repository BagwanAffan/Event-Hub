'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { feedbackService } from '@/services/feedback-service';
import { dataSync } from '@/lib/data-sync';
import type { Feedback, FeedbackSubmissionPayload } from '@/types/database.types';
import { toast } from 'sonner';

export function isEditableWithin24h(createdAt?: string | null): boolean {
  if (!createdAt) return true;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffHours = (now - created) / (1000 * 60 * 60);
  return diffHours <= 24;
}

export function useFeedback() {
  const { profile } = useAuth();
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);

  const fetchPending = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const pending = await feedbackService.getStudentPendingFeedback(profile.id);
      setPendingList(pending || []);
    } catch (err) {
      console.error('Error fetching pending feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPending();
    const unsubFb = dataSync.subscribe('feedback', fetchPending);
    const unsubReg = dataSync.subscribe('registrations', fetchPending);
    const unsubAtt = dataSync.subscribe('attendance', fetchPending);

    return () => {
      unsubFb();
      unsubReg();
      unsubAtt();
    };
  }, [fetchPending]);

  const openModal = useCallback((event: any, feedback: Feedback | null = null) => {
    setSelectedEvent(event);
    setExistingFeedback(feedback);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedEvent(null);
    setExistingFeedback(null);
  }, []);

  const handleSubmit = async (payload: Omit<FeedbackSubmissionPayload, 'userId' | 'eventId'>) => {
    if (!profile?.id || !selectedEvent?.id) {
      toast.error('Unable to submit feedback. Missing user or event details.');
      return false;
    }

    if (!payload.overallRating || payload.overallRating < 1) {
      toast.error('Overall rating is required.');
      return false;
    }

    try {
      setSubmitting(true);
      if (existingFeedback?.id) {
        if (!isEditableWithin24h(existingFeedback.created_at)) {
          toast.error('Feedback can only be edited within 24 hours of submission.');
          return false;
        }
        await feedbackService.updateFeedback(existingFeedback.id, profile.id, payload);
        toast.success('Feedback updated successfully! ⭐');
      } else {
        await feedbackService.submitFeedback({
          ...payload,
          userId: profile.id,
          eventId: selectedEvent.id,
          registrationId: selectedEvent.registration_id || null,
        });
        toast.success('Thank you for rating your experience! ⭐');
      }
      closeModal();
      await fetchPending();
      dataSync.notify("feedback", "events", "admin", "registrations");
      return true;

    } catch (err: any) {
      console.error('Feedback submission error:', err);
      toast.error(err.message || 'Failed to submit feedback.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    pendingList,
    pendingCount: pendingList.length,
    loading,
    submitting,
    isOpen,
    selectedEvent,
    existingFeedback,
    openModal,
    closeModal,
    handleSubmit,
    fetchPending,
  };
}
