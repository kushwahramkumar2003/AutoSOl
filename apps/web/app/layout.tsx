import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Roboto } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Providers } from "@/components/Providers";

import "./fonts/fonts.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoSOL - Solana Recurring Payments Platform",
  description:
    "Automate recurring payments on Solana with ease. Schedule, manage, and track your payments in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.className} geist-vf geist-mono-vf font-sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" bg-background min-h-screen`}
      >
        <Providers>
          <main className="pt-6 pb-4 px-2 mx-auto w-full max-w-7xl">
            {children}
          </main>
        </Providers>
        <Toaster richColors />
      </body>
    </html>
  );
}
