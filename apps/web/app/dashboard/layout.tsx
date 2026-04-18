import type React from "react";
import type { Metadata } from "next";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/sidebar";

export const metadata: Metadata = {
  title: "Dashboard | AutoSOL",
  description: "Manage your recurring payments on Solana",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="app-shell flex min-h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
