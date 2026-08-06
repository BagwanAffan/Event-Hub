'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { feedbackService } from '@/services/feedback-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './star-rating';
import { Star, MessageSquare, ThumbsUp, Trash2, Award, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { dataSync, useDataSync } from '@/lib/data-sync';


export function AdminFeedbackAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({
    platformRating: 0,
    totalFeedback: 0,
    recommendationPercent: 0,
    topRatedEvents: [],
    lowestRatedEvents: [],
    mostReviewedEvents: [],
    allFeedback: [],
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getAdminFeedbackAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading admin feedback analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useDataSync(['admin', 'feedback', 'events'], loadData, []);


  const handleDeleteReview = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback review? This action cannot be undone.')) return;
    try {
      setDeletingId(feedbackId);
      await feedbackService.deleteFeedback(feedbackId);
      toast.success('Abusive review deleted successfully.');
      loadData();
    } catch (err: any) {
      console.error('Delete feedback error:', err);
      toast.error(err.message || 'Failed to delete feedback.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse py-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> Platform Feedback & Quality Oversight
          </h2>
          <p className="text-xs text-muted-foreground">
            Platform-wide event satisfaction metrics, leaderboards, and review moderation
          </p>
        </div>
        <Badge variant="outline" className="text-[#007C46] border-[#007C46] font-bold">
          {analytics.totalFeedback} Total Reviews
        </Badge>
      </div>

      {/* Platform Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Platform Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#01424E] dark:text-teal-200">
                {analytics.platformRating > 0 ? analytics.platformRating.toFixed(1) : '0.0'}
              </span>
              <StarRating size="sm" value={analytics.platformRating} readOnly />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all completed events</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Reviews Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#01424E] dark:text-teal-200">{analytics.totalFeedback}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Verified attendee reviews</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Recommendation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{analytics.recommendationPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">Attendees would recommend events</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Summaries: Top Rated vs Lowest Rated */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Rated Events */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-emerald-600 flex items-center gap-2">
              <Award className="h-4 w-4" /> Top Rated Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topRatedEvents.length > 0 ? (
              <div className="space-y-3">
                {analytics.topRatedEvents.map((evt: any) => (
                  <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="truncate max-w-[200px]">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{evt.title}</div>
                      <div className="text-[11px] text-muted-foreground">{evt.reviewCount} reviews</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarRating size="sm" value={evt.avgRating} readOnly />
                      <span className="text-xs font-bold">{evt.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No rated events yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Lowest Rated Events */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Lowest Rated Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.lowestRatedEvents.length > 0 ? (
              <div className="space-y-3">
                {analytics.lowestRatedEvents.map((evt: any) => (
                  <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="truncate max-w-[200px]">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{evt.title}</div>
                      <div className="text-[11px] text-muted-foreground">{evt.reviewCount} reviews</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarRating size="sm" value={evt.avgRating} readOnly />
                      <span className="text-xs font-bold">{evt.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No rated events yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Moderation Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Review Moderation Log</CardTitle>
          <CardDescription className="text-xs">Inspect reviews across all events and delete abusive content</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.allFeedback.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.allFeedback.map((fb: any) => (
                    <TableRow key={fb.id}>
                      <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                        {fb.events?.title || 'Event'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {fb.anonymous ? (
                          <span className="text-muted-foreground italic">Anonymous</span>
                        ) : (
                          fb.profiles?.full_name || 'Student'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <StarRating size="sm" value={fb.overall_rating || fb.rating || 5} readOnly />
                          <span className="text-xs font-bold">{fb.overall_rating || fb.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[240px] truncate">
                        {fb.comment || fb.feedback || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(fb.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReview(fb.id)}
                          disabled={deletingId === fb.id}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 h-8 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">No platform reviews recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
