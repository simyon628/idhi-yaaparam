import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idhi Yaaparam — Campus Rental Network",
  description: "Verified peer-to-peer lab tool rental for college students. OTP login · Roll-number verified · 2-strike trust system.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yaaparam",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { PWAProvider } from "@/components/providers/pwa-provider";
import { Toaster } from "@/components/ui/sonner";
import { CollegeProvider } from "@/contexts/CollegeContext";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import { PageTransition } from "@/components/providers/PageTransition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <CollegeProvider>
          <PWAProvider>
            <main className="mx-auto max-w-md min-h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-x-hidden">
              <PushNotificationManager />
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  marginTop: '80px',
                  background: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(224, 231, 255, 0.6)",
                  color: "#1e293b",
                  boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.15)",
                  borderRadius: "1rem",
                  fontWeight: "600",
                },
              }}
            />
          </PWAProvider>
        </CollegeProvider>
      </body>
    </html>
  );
}
