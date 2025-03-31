"use client";

import { Input } from "@/components/ui/input";
import { WalletConnect } from "../wallet-connect";
import { Search } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-dark-200 py-3 px-6">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <Input
            placeholder="Search..."
            className="pl-8 bg-white/5 border-white/10 focus-visible:ring-[#6E56CF]"
          />
        </div>

        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
