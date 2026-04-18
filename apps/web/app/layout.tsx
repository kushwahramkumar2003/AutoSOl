import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoSOL — Solana Recurring Payments Platform",
  description:
    "Schedule, automate, and manage recurring payments on Solana. Support for SOL and all SPL tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster richColors />
      </body>
    </html>
  );
}
