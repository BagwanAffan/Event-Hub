'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, Copy, Check, FileText, Mail, Users, Share2, Award, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AIPage() {
  const [activeTab, setActiveTab] = useState('creation');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (feature: string) => {
    if (!prompt.trim()) {
      toast.error('Please enter instructions or details for the AI Copilot');
      return;
    }

    setGenerating(true);
    toast.info(`AI Copilot generating ${feature.replace('_', ' ')}...`);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature,
          prompt,
          context: { title: prompt.slice(0, 30) }
        })
      });
      const result = await res.json();
      if (result.success && result.data) {
        if (typeof result.data === 'object') {
          setOutput(JSON.stringify(result.data, null, 2));
        } else {
          setOutput(result.data);
        }
        toast.success('AI generation complete!');
      }
    } catch {
      toast.error('AI generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied output to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#01424E] via-[#013540] to-[#007C46] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-[#7CEAAB]" />
            <Badge className="bg-[#7CEAAB] text-[#01424E] font-bold">EventHub AI Studio</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI Event Copilot</h1>
          <p className="text-[#d1f8e8] text-sm mt-1 max-w-xl">
            Assistant for organizers: Generate complete event schedules, rules, email announcements, volunteer allocation strategies, and closing reports.
          </p>
        </div>
      </div>

      {/* Feature Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Button
          variant={activeTab === 'creation' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('creation'); setOutput(''); }}
          className={activeTab === 'creation' ? 'bg-[#01424E] text-[#7CEAAB]' : ''}
        >
          <Calendar className="mr-2 h-4 w-4" /> Full Event Wizard
        </Button>

        <Button
          variant={activeTab === 'email_draft' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('email_draft'); setOutput(''); }}
          className={activeTab === 'email_draft' ? 'bg-[#01424E] text-[#7CEAAB]' : ''}
        >
          <Mail className="mr-2 h-4 w-4" /> Email & Notices
        </Button>

        <Button
          variant={activeTab === 'volunteer_recommendations' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('volunteer_recommendations'); setOutput(''); }}
          className={activeTab === 'volunteer_recommendations' ? 'bg-[#01424E] text-[#7CEAAB]' : ''}
        >
          <Users className="mr-2 h-4 w-4" /> Volunteer Strategy
        </Button>

        <Button
          variant={activeTab === 'social' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('social'); setOutput(''); }}
          className={activeTab === 'social' ? 'bg-[#01424E] text-[#7CEAAB]' : ''}
        >
          <Share2 className="mr-2 h-4 w-4" /> Social Captions
        </Button>

        <Button
          variant={activeTab === 'summary' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('summary'); setOutput(''); }}
          className={activeTab === 'summary' ? 'bg-[#01424E] text-[#7CEAAB]' : ''}
        >
          <Award className="mr-2 h-4 w-4" /> Closing Summary
        </Button>
      </div>

      {/* Generator Studio Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">1. Prompt & Parameters</CardTitle>
            <CardDescription>
              {activeTab === 'creation' && 'Describe your event (topic, target audience, fee, team size)'}
              {activeTab === 'email_draft' && 'Specify notice purpose (reminder, approval, schedule change)'}
              {activeTab === 'volunteer_recommendations' && 'Enter event scale and expected attendance'}
              {activeTab === 'social' && 'Specify social platform (Instagram, LinkedIn, Twitter)'}
              {activeTab === 'summary' && 'Enter total participants, attendance counts, and winners'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={8}
              placeholder={
                activeTab === 'creation'
                  ? 'e.g. Create a 24-hour hackathon for 2nd and 3rd year CS students with ₹200 fee and team size of 4. Focus on AI and Green Tech.'
                  : activeTab === 'email_draft'
                  ? 'e.g. Draft an urgent email notice informing registered hackathon participants that the venue is moved to Block B Auditorium.'
                  : 'e.g. Recommend volunteer allocation for 200 hackathon participants across check-in, stage, and tech support.'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="font-sans text-sm"
            />
          </CardContent>
          <CardFooter className="border-t p-4 flex justify-end">
            <Button
              onClick={() => handleGenerate(activeTab)}
              disabled={generating}
              className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold px-6"
            >
              <Wand2 className="mr-2 h-4 w-4" /> {generating ? 'AI Thinking...' : 'Generate Content'}
            </Button>
          </CardFooter>
        </Card>

        {/* Output Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-200">2. Generated AI Output</CardTitle>
              {output && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              )}
            </div>
            <CardDescription>Review, copy, or refine AI generated output</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {output ? (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-auto max-h-[380px] whitespace-pre-wrap">
                {output}
              </div>
            ) : (
              <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Sparkles className="h-10 w-10 text-[#7CEAAB] mb-2 animate-pulse" />
                <p className="font-semibold text-sm">No output generated yet</p>
                <p className="text-xs">Enter your prompt on the left and click Generate Content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
