'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { feedbackService } from '@/services/feedback-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './star-rating';
import { Star, MessageSquare, ThumbsUp, Filter, TrendingUp, Calendar, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dataSync, useDataSync } from '@/lib/data-sync';


export function OrganizerFeedbackAnalytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({
    averageRating: 0,
    totalReviews: 0,
    recommendationPercent: 0,
    ratingDistribution: [
      { stars: 5, count: 0, percentage: 0 },
      { stars: 4, count: 0, percentage: 0 },
      { stars: 3, count: 0, percentage: 0 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ],
    eventRatings: [],
    recentFeedback: [],
  });

  // Filters
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await feedbackService.getOrganizerFeedbackAnalytics(profile.id);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading organizer feedback analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['feedback', 'events'], loadData, [profile?.id]);


  // Filter recent feedback
  const filteredFeedback = (analytics.recentFeedback || []).filter((fb: any) => {
    if (eventFilter !== 'all' && fb.event_id !== eventFilter) return false;
    if (ratingFilter !== 'all') {
      const targetRating = parseInt(ratingFilter, 10);
      const r = fb.overall_rating || fb.rating || 0;
      if (r !== targetRating) return false;
    }
    return true;
  }).sort((a: any, b: any) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

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
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> Event Feedback & Rating Insights
          </h2>
          <p className="text-xs text-muted-foreground">
            Monitor student ratings, reviews, and event recommendation statistics
          </p>
        </div>
        <Badge variant="outline" className="text-[#007C46] border-[#007C46] font-bold">
          {analytics.totalReviews} Total Reviews
        </Badge>
      </div>

      {/* Top Overview Cards & Distribution */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Rating Overview Stat */}
        <Card className="md:col-span-5 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Overall Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-[#01424E] dark:text-teal-200">
                {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '0.0'}
              </span>
              <div className="space-y-1">
                <StarRating size="md" value={analytics.averageRating} readOnly />
                <p className="text-xs text-slate-500">Based on {analytics.totalReviews} Reviews</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <ThumbsUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {analytics.recommendationPercent}%
                  </div>
                  <div className="text-[11px] text-muted-foreground">Would Recommend</div>
                </div>
              </div>
              <Badge className="bg-[#007C46] text-white text-[10px]">High Satisfaction</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution Bars */}
        <Card className="md:col-span-7 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Rating Distribution</CardTitle>
            <CardDescription className="text-xs">Breakdown across 5-star to 1-star reviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {analytics.ratingDistribution.map((item: any) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 shrink-0 font-semibold text-slate-700 dark:text-slate-300">
                  <span>{item.stars}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 rounded-full',
                      item.stars === 5 && 'bg-emerald-500',
                      item.stars === 4 && 'bg-teal-500',
                      item.stars === 3 && 'bg-amber-500',
                      item.stars === 2 && 'bg-orange-500',
                      item.stars === 1 && 'bg-rose-500'
                    )}
                    style={{ width: `${item.percentage || 0}%` }}
                  />
                </div>
                <div className="w-16 shrink-0 text-right text-muted-foreground font-mono text-[11px]">
                  {item.count} ({item.percentage}%)
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Event Ratings Summary Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Event Ratings Summary</CardTitle>
          <CardDescription className="text-xs">Performance breakdown per event</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.eventRatings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Average Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Recommendation %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.eventRatings.map((row: any) => (
                    <TableRow key={row.eventId}>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{row.eventTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StarRating size="sm" value={row.avgRating} readOnly />
                          <span className="font-bold text-xs">{row.avgRating > 0 ? row.avgRating.toFixed(1) : 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.reviewCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs font-bold', row.recommendationPercent >= 75 ? 'text-emerald-600 border-emerald-600' : 'text-slate-600')}>
                          {row.recommendationPercent}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">No event ratings recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Feedback Feed with Filters */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Recent Student Reviews</CardTitle>
              <CardDescription className="text-xs">Read feedback and ratings submitted by verified attendees</CardDescription>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={eventFilter} onValueChange={(val) => setEventFilter(val || 'all')}>
                <SelectTrigger className="w-[140px] text-xs h-8">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {analytics.eventRatings.map((e: any) => (
                    <SelectItem key={e.eventId} value={e.eventId}>{e.eventTitle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={(val) => setRatingFilter(val || 'all')}>
                <SelectTrigger className="w-[120px] text-xs h-8">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(val) => val && setSortOrder(val as 'newest' | 'oldest')}>
                <SelectTrigger className="w-[110px] text-xs h-8">
                  <SelectValue placeholder="Newest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredFeedback.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredFeedback.map((fb: any) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#01424E] dark:text-teal-200 block truncate max-w-[200px]">
                        {fb.events?.title || 'Event'}
                      </span>
                      <StarRating size="sm" value={fb.overall_rating || fb.rating || 5} readOnly className="mt-1" />
                    </div>
                    {fb.recommendation && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] capitalize font-bold',
                          fb.recommendation === 'yes' && 'text-emerald-600 border-emerald-600',
                          fb.recommendation === 'maybe' && 'text-amber-600 border-amber-600',
                          fb.recommendation === 'no' && 'text-rose-600 border-rose-600'
                        )}
                      >
                        Recommends: {fb.recommendation}
                      </Badge>
                    )}
                  </div>

                  {(fb.comment || fb.feedback) && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      "{fb.comment || fb.feedback}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {fb.anonymous ? '— Anonymous' : `— ${fb.profiles?.full_name || 'Student'}`}
                    </span>
                    <span>{format(new Date(fb.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40 text-[#007C46]" />
              <p className="text-xs font-semibold">No reviews match the selected filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
