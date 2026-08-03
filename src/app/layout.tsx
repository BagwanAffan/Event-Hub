import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EventHub — One Platform for Every Campus Event",
    template: "%s | EventHub",
  },
  description:
    "EventHub is a centralized Event and Volunteer Management Platform designed for colleges and universities. Manage events, registrations, volunteers, attendance, certificates, and more.",
  keywords: [
    "event management",
    "college events",
    "campus events",
    "volunteer management",
    "QR attendance",
    "certificate generation",
    "event registration",
  ],
  authors: [{ name: "EventHub" }],
  openGraph: {
    title: "EventHub — One Platform for Every Campus Event",
    description:
      "Centralized Event and Volunteer Management Platform for colleges.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "EventHub",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventHub — One Platform for Every Campus Event",
    description:
      "Centralized Event and Volunteer Management Platform for colleges.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans min-h-screen antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
