import type { Metadata } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hyperion Team — OS untuk Tim Esports",
    template: "%s · Hyperion Team",
  },
  description:
    "Platform manajemen tim esports — kelola scrim, roster, jadwal, dan komunikasi dalam satu workspace.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`dark ${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <NotifyProvider>
            {children}
          </NotifyProvider>
        </QueryProvider>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#1C1C1C",
              border: "1px solid #2D2D2D",
              color: "#E5E2E1",
              borderRadius: "10px",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
            },
            classNames: {
              toast: "!bg-[#1C1C1C] !border-[#2D2D2D] !text-[#E5E2E1] !rounded-[10px] !shadow-xl",
              title: "!text-[#E5E2E1] !font-medium",
              description: "!text-[#9B9A97]",
              actionButton: "!bg-[#252525] !text-[#E5E2E1]",
              cancelButton: "!bg-[#252525] !text-[#9B9A97]",
              closeButton: "!bg-[#252525] !border-[#2D2D2D] !text-[#9B9A97]",
              success: "!border-l-2 !border-l-[#4ade80]/60",
              error: "!border-l-2 !border-l-[#f87171]/60",
              warning: "!border-l-2 !border-l-[#facc15]/60",
              info: "!border-l-2 !border-l-[#60a5fa]/60",
            },
          }}
        />
      </body>
    </html>
  );
}
