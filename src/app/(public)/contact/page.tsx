'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Phone, MapPin } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export default function ContactPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast.success('Message sent successfully! We will get back to you soon.');
    form.reset();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24 max-w-6xl animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#01424E] dark:text-teal-100">Contact Us</h1>
        <p className="text-base text-muted-foreground">Have questions about EventHub? We&apos;re here to help.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
        <div className="lg:col-span-1 space-y-8">
          <div className="flex items-start space-x-4">
            <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#01424E] dark:text-teal-100">Email</h3>
              <p className="text-xs text-muted-foreground">support@eventhub.edu</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#01424E] dark:text-teal-100">Phone</h3>
              <p className="text-xs text-muted-foreground">+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-2.5 rounded-xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#01424E] dark:text-teal-100">Office</h3>
              <p className="text-xs text-muted-foreground">Student Activities Center<br />University Campus</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Name</label>
                <Input placeholder="Your name" className="rounded-xl text-xs" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <Input placeholder="your.email@example.com" className="rounded-xl text-xs" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
              <Input placeholder="How can we help?" className="rounded-xl text-xs" {...form.register('subject')} />
              {form.formState.errors.subject && (
                <p className="text-xs text-red-500">{form.formState.errors.subject.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message</label>
              <Textarea placeholder="Write your message here..." className="min-h-[140px] rounded-xl text-xs" {...form.register('message')} />
              {form.formState.errors.message && (
                <p className="text-xs text-red-500">{form.formState.errors.message.message}</p>
              )}
            </div>
            <Button type="submit" size="lg" className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs rounded-xl px-6 cursor-pointer">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
