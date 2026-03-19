import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idhi Yaaparam — Student Earning Platform",
  description: "Rent campus items or earn by writing records and assignments. India's student earning platform for college students.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yaaparam",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8faff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { PWAProvider } from "@/components/providers/pwa-provider";
import { Toaster } from "@/components/ui/sonner";
import { CollegeProvider } from "@/contexts/CollegeContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
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
          <AppModeProvider>
            <PWAProvider>
              <main className="mx-auto max-w-md min-h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-x-hidden">
                <PageTransition>
                  {children}
                </PageTransition>
              </main>
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    marginTop: '80px',
                    background: "rgba(255, 255, 255, 0.9)",
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
          </AppModeProvider>
        </CollegeProvider>
      </body>
    </html>
  );
}
