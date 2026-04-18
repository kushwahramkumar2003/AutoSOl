"use client";

import { Input } from "@/components/ui/input";
import { WalletConnect } from "../wallet-connect";
import { Search } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
      <div className="app-page flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search…"
            className="field-surface h-10 rounded-2xl pl-9 text-sm focus-visible:border-primary/50 focus-visible:ring-primary/40"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
