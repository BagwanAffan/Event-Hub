# 🎓 EventHub — Next-Gen Campus Event Platform

> **TechRush Hackathon Submission**  
> *The unified, intelligent, and seamless end-to-end event management ecosystem for universities, student clubs, organizers, and volunteers.*

---

## 🌟 Overview

**EventHub** is a production-ready, full-stack campus event management and verification portal. Designed to replace fragmented Google Forms, manual WhatsApp group notifications, and physical paper tickets, EventHub delivers a unified digital experience for campus life.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**, EventHub provides automated role-based workflows for **Students**, **Organizers**, **Volunteers**, and **System Administrators**.

---

## 🔥 Key Features

### 👨‍🎓 1. Student Experience Portal
- **Interactive Event Discovery**: Filter events by category (Technical, Cultural, Sports, Workshops, Hackathons), search keywords, or host clubs.
- **Instant QR Digital Pass**: Automatic generation of unique, tamper-proof QR tickets upon event registration.
- **Team Creation & Registrations**: Form squads for multi-member hackathons and competitions with shareable invite codes.
- **Verified E-Certificates**: Receive digital certificates of participation/achievement with a public QR verification URL.

### 🏛️ 2. Organizer Control Hub & Verification
- **Simplified 4-Field Verification Flow**: Frictionless onboarding for club leads (Head Name, Club Name, College/Institution, Club Type).
- **AI Event Assistant**: AI-powered content generation for event titles, descriptions, schedules, and promotional banners.
- **Participant Roster & Payment Tracking**: Live dashboard of registrations, ticketing statuses, and payment verifications.
- **Automated Certificate Dispensing**: One-click bulk certificate generation for verified attendees.

### 🛡️ 3. On-Site Volunteer Operations
- **Real-Time QR Scanner**: Built-in camera scanner for instant entry validation at physical event venues.
- **Volunteer Task Board**: Checklists, attendance logs, and coordinator assignments.
- **Live Scanned Telemetry**: Instant sync with Supabase Realtime to prevent double-entry and unauthorized pass re-use.

### ⚙️ 4. System Administrator Governance
- **Global Control Center**: Platform-wide telemetry (Total Users, Registrations, Event Categories, Monthly Trends).
- **Streamlined Approvals Portal**: Admin review queue to verify and approve/reject new club organizer profiles with 1-click controls.
- **User & Event Management**: Soft-delete, status toggle (active/suspended), password overrides, and system audit logs.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16 (App Router & Turbopack)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Components** | [Tailwind CSS](https://tailwindcss.com/), `@base-ui/react`, [Lucide Icons](https://lucide.dev/), [Sonner](https://sonner.emilkowal.si/) |
| **Charts & Telemetry** | [Recharts](https://recharts.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth, Storage, Realtime) |
| **Date & Utilities** | `date-fns`, `clsx`, `tailwind-merge` |

---

## 📂 Project Architecture

```text
Event Hub/
├── src/
│   ├── app/                        # Next.js App Router Structure
│   │   ├── (auth)/                 # Login, Signup, Forgot/Reset Password
│   │   ├── (dashboard)/            # Protected Dashboard Layouts & Pages
│   │   │   ├── admin/              # Approvals, Governance, User Management, Analytics, Notifications
│   │   │   ├── organizer/          # Event Creation, AI Tools, Registrations, Verify Profile
│   │   │   ├── student/            # Discover Events, Digital QR Passes, Certificates, Teams
│   │   │   └── volunteer/          # Task Management, Live QR Scanner, Attendance Logs
│   │   └── (public)/               # Landing Page, About, Contact, Public Event View
│   ├── components/                 # Reusable UI & Layout Components
│   │   ├── layout/                 # Sidebar, TopNavbar, Public Header/Footer
│   │   ├── shared/                 # StatusBadges, StatCards, SearchBars, Loading Skeletons
│   │   └── ui/                     # Base UI Primitive wrappers (Button, Card, Dialog, Table, Input)
│   ├── hooks/                      # Custom React Hooks (useAuth, useProfileCompletion)
│   ├── lib/                        # Supabase Client & Utility Helpers
│   ├── services/                   # Modular API Data Access Layer (adminService, profileService, etc.)
│   └── types/                      # Database Schemas & TypeScript Definitions
├── supabase/                       # Supabase Migrations, SQL Schemas, and RLS Policies
└── public/                         # Static Assets & Branding Media
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher
- **npm** or **pnpm** or **yarn**

### 2. Clone the Repository
```bash
git clone https://github.com/BagwanAffan/Event-Hub.git
cd Event-Hub
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore EventHub!

---

## 🛡️ Production Build & Verification

To verify TypeScript compliance and generate an optimized production bundle:

```bash
# Typecheck TypeScript without emitting output
npx tsc --noEmit

# Generate production build
npm run build
```

---

## 🏆 Hackathon Highlights

- **Zero-Friction Onboarding**: Club leads register and complete verification in under 60 seconds with our simplified 4-field verification profile.
- **Enterprise Security**: Full Row-Level Security (RLS) policies on Supabase prevent cross-role data leaks between Students, Organizers, Volunteers, and Admins.
- **Responsive Glassmorphism UI**: Beautiful, accessible, high-contrast dark/light design system crafted with curated HSL color palettes and smooth animations.

---

## 📄 License

This project is created for the **TechRush Hackathon**. Distributed under the [MIT License](LICENSE).