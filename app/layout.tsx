import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Idhi Yaaparam",
  description: "Campus Lab Tool Rental PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yaaparam",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { PWAProvider } from "@/components/providers/pwa-provider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <PWAProvider>
          <main className="mx-auto max-w-md min-h-screen flex flex-col shadow-xl bg-white dark:bg-zinc-950">
            {children}
          </main>
          <Toaster position="top-center" />
        </PWAProvider>
      </body>
    </html>
  );
}
