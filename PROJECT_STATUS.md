# EventHub Project Status & Summary

EventHub is an enterprise-grade campus event management platform built using Next.js, Tailwind CSS v4, Supabase, and Google Gemini AI. It provides a complete workflow for organizers, students, and volunteers to host, register, coordinate, and check-in to campus events with integrated AI features and automated digital ticketing/certification.

---

## 🚀 Tech Stack

### Frontend & Core
* **Framework**: Next.js (v16.2.12 App Router) with React 19.
* **Styling**: Tailwind CSS v4 with custom design tokens for brand colors (Teal/Green/Mint theme: `#01424E`, `#7CEAAB`, `#007C46`) and built-in smooth transitions, card layouts, and responsive utilities.
* **State Management**: Zustand (client sidebar state) & TanStack React Query (data fetching & client-side caching).
* **Component Library**: Radix UI primitives (`@base-ui/react`), Lucide React icons, and pre-styled shadcn/ui components.

### Backend & Database
* **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS) policies configured for role-based access.
* **Storage**: Supabase Storage buckets for `payment-screenshots` (public access for viewing, authenticated for upload) and `profile-images`.

### AI Integration
* **Google Gemini AI**: Powered by `@google/genai` (`gemini-2.5-flash` model) to assist organizers in creating event content, scheduling, FAQs, drafting participant updates, and planning volunteer strategies.
* **Mock Fallbacks**: Intelligent local fallback generators to ensure seamless functionality when API keys are absent or rate-limited.

### Specialized Libraries
* **QR & Encryption**: `qrcode` (generating passes), `crypto-js` (encrypting QR ticket tokens for security), and `html5-qrcode` (real-time webcam scanning for ticket validation).
* **Document Exports**: `exceljs` (multi-sheet Excel reporting) and `jspdf`/`jspdf-autotable` (landscape digital certificate PDFs with decorative borders, metadata, and validation codes).

---

## 🗄️ Database Schema & Migrations

The database structure in `supabase/migrations/` is modular and highly relational:

1. **`profiles`**: Links to Supabase authentication (`auth.users`) to store extended details (Full Name, College, Department, Year, Status) and roles (`student`, `organizer`, `volunteer`).
2. **`events`**: Details of draft/published events. Supports individual/team registrations, categories, dates, pricing, banner/poster attachments, custom contact details, and location details (venue, building, room).
3. **`registrations`**: Connects students to events. Tracks ticket QR tokens, payment status, and team associations.
4. **`teams` & `team_members`**: Manages hackathons and group event structures, handling member invitation states (`invited`, `accepted`, `rejected`, `removed`) and leader profiles.
5. **`payments`**: Handles organizer-reviewed ticket fees. Stores transaction references, screenshot upload URLs, and approval status.
6. **`volunteers`**: Event-specific applications by users wanting to volunteer.
7. **`volunteer_tasks`**: Checklist-based task manager for approved volunteers with priority ranks (`low`, `medium`, `high`, `urgent`) and statuses (`pending`, `in_progress`, `completed`).
8. **`attendance`**: Real-time logging of attendee check-ins, matching QR tickets to user profiles and volunteer scanner IDs.
9. **`certificates`**: Generates participation/winner/runner-up/volunteer digital credentials, complete with unique cryptographic verification hashes.
10. **`notifications` & `announcements`**: Relays in-app alerts (success, info, warning, announcements) to specific users and broadcast notices to event participants/volunteers.
11. **`event_faqs`**, **`event_gallery`**, **`feedback`**: Supports dynamic FAQ items, photo galleries, and rating reviews (1–5 stars with text comments).
12. **`audit_logs` & `ai_history`**: Back-end tracing for security actions and AI-prompt utilization history.

---

## 🗺️ Application Architecture & Page Routes

The application has separate layouts and route folders mapped under Next.js:

### 🏠 Public Portal (`/(public)`)
* `/`: Vibrant, dynamic landing page with a hero showcase, statistics counts, interactive feature blocks, AI & QR ticketing demonstrations, testimonials, and FAQs.
* `/events`: Public directory listing all upcoming, ongoing, and completed campus events.
* `/events/[id]`: Detailed event overview page detailing schedules, rules, registration cost, and FAQS.
* `/verify-certificate`: Public validation portal where anyone can input a certificate verification ID to check its authenticity.
* `/about`, `/contact`, `/privacy`, `/terms`: Informative site pages.

### 🔑 Authentication (`/(auth)`)
* `/login`, `/signup`: Secure access portal supporting profile setup.
* `/forgot-password`, `/reset-password`, `/verify-email`: Automated credentials management.

### 🛠️ Organizer Dashboard (`/(dashboard)/organizer`)
* `/dashboard`: Overview cards showing active events, registration trends (graph charts), and pending payment counts.
* `/events/create`: Step-by-step event creation wizard with an integrated AI Event Copilot to auto-complete descriptions, rules, schedules, and categories.
* `/events/[id]`: Detailed manager page to configure checklists, announcements, and view registrations.
* `/registrations`: Lists participant sign-ups with approval tools.
* `/payments`: Screen to review payment screenshot files, cross-reference transaction codes, and confirm tickets.
* `/volunteers`: Approve/reject volunteer candidates and assign them event roles.
* `/attendance`: Real-time list of checked-in students and manual check-in options.
* `/certificates`: Custom dashboard to trigger batch certificate issuance for participants, winners, and volunteers.
* `/analytics`: Dedicated reporting tab utilizing graphs and data tables with instant Excel exports.
* `/settings`, `/profile`: User and theme controls.

### 🎓 Student Dashboard (`/(dashboard)/student`)
* `/dashboard`: Summary of registered events, pending actions (like pending ticket payment), and certificates earned.
* `/events`: Portal to register for individual or group-based competitions.
* `/registrations/[id]`: QR check-in pass card details page (revealing encrypted QR code and registration receipt).
* `/payment/[registrationId]`: File uploader for UPI/Bank receipts to verify tickets.
* `/teams`: Group manager to create teams, join groups via custom code, and monitor invite statuses.
* `/certificates`: View of earned certificates with quick PDF download buttons.
* `/settings`, `/profile`, `/notifications`.

### 🎛️ Volunteer Dashboard (`/(dashboard)/volunteer`)
* `/dashboard`: Shows assigned tasks list and quick actions.
* `/scanner`: Web-camera scanning route utilizing HTML5 QR code reader to decode encrypted passes, verify tickets, and check-in attendees in real-time.
* `/tasks`: Action-items checklist dashboard supporting status updates.
* `/attendance`: Attendance log showing all participants scanned in by the volunteer.
* `/certificates`: Access point for volunteer certificates.

---

## ⚙️ Core Application Services (`src/services/`)

* **`analytics-service.ts`**: Aggregates counts, computes daily registration curves, and parses category/department metrics.
* **`attendance-service.ts`**: Handles QR code decryption, ticket validation, and records attendance entries.
* **`certificate-service.ts`**: Oversees DB insertion and fetching of verification hashes.
* **`export-service.ts`**: Core utility generating Excel sheets using `exceljs` and constructing certificate layouts using `jspdf`.
* **`event-service.ts`**: Creation, reading, updating, and deleting of event postings.
* **`payment-service.ts`**: Manages payment uploads and review workflows.
* **`registration-service.ts` & `team-service.ts`**: Organizes registrations, invitations, and team formations.
* **`volunteer-service.ts`**: Handles tasks allocation and application screenings.
