"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FaqSection() {
  const faqs = [
    { q: "Is EventHub free to use?", a: "Yes, EventHub is completely free for students and basic organizers." },
    { q: "Can students register as teams?", a: "Absolutely. The platform supports both individual and team registrations." },
    { q: "How does QR attendance work?", a: "Every approved participant gets a unique QR pass. Volunteers scan it at the venue to mark attendance instantly." },
    { q: "Can organizers export reports?", a: "Yes, all participant and attendance data can be exported to CSV or Excel." },
    { q: "Do participants receive certificates?", a: "Organizers can set up automatic certificate generation for attendees who meet attendance criteria." },
    { q: "Can volunteers manage attendance?", a: "Volunteers are assigned specific scanners access to scan QR codes without seeing sensitive organizer data." },
  ];

  return (
    <section id="faq" className="py-16 lg:py-24 bg-white dark:bg-[#090909]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10 space-y-2">
          <span className="text-[#007C46] dark:text-[#7CEAAB] font-bold text-xs uppercase tracking-wider bg-[#edfcf6] dark:bg-teal-950/50 px-3 py-1 rounded-full border border-[#41B177]/30 inline-block">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F5F5F5] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#9CA3AF] max-w-xl mx-auto">
            Everything you need to know about EventHub portals, QR passes, and certificate verification.
          </p>
        </div>

        {/* Clean Accordion */}
        <Accordion className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b border-slate-200 dark:border-white/[0.08] py-1"
            >
              <AccordionTrigger className="text-left font-bold text-base sm:text-lg text-[#01424E] dark:text-teal-100 no-underline hover:no-underline py-3.5 cursor-pointer">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 dark:text-[#CFCFCF] pb-4 pt-1 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
