import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
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
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-background min-h-screen`}
      >
        <Navbar />
        <main className="pt-6 pb-4 px-2 mx-auto w-full max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
