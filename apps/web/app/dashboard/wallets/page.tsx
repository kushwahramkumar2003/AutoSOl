import type { Metadata } from "next";
import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Plus,
  WalletIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TokenDistribution from "@/components/dashboard/token-distribution";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Wallets | AutoSOL",
  description: "Manage your connected wallets on Solana",
};

// Mock data for wallets
const wallets = [
  {
    id: "wallet-001",
    name: "Main Wallet",
    type: "Phantom",
    address: "8xDR54a...9j2K",
    balance: {
      sol: 10.25,
      usdc: 245.67,
      bonk: 1250000,
      ray: 25.5,
    },
    isActive: true,
    lastUsed: "Today, 10:30 AM",
  },
  {
    id: "wallet-002",
    name: "Business Wallet",
    type: "Solflare",
    address: "3tYV87b...5rL1",
    balance: {
      sol: 2.2,
      usdc: 100,
      bonk: 0,
      ray: 0,
    },
    isActive: true,
    lastUsed: "Yesterday, 3:45 PM",
  },
  {
    id: "wallet-003",
    name: "Savings Wallet",
    type: "Backpack",
    address: "7pQR32c...8mN4",
    balance: {
      sol: 0,
      usdc: 0,
      bonk: 0,
      ray: 0,
    },
    isActive: false,
    lastUsed: "Mar 15, 2025",
  },
];

// Mock data for token distribution
const tokens = [
  {
    name: "Solana",
    symbol: "SOL",
    amount: 12.45,
    value: 1245.0,
    color: "#9945FF",
    percentage: 65,
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    amount: 345.67,
    value: 345.67,
    color: "#2775CA",
    percentage: 18,
  },
  {
    name: "Bonk",
    symbol: "BONK",
    amount: 1250000,
    value: 250.0,
    color: "#F7931A",
    percentage: 13,
  },
  {
    name: "Raydium",
    symbol: "RAY",
    amount: 25.5,
    value: 76.5,
    color: "#00C2CE",
    percentage: 4,
  },
];

export default function WalletsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Wallets</h1>
            <p className="text-white/70 mt-1">
              Manage your connected Solana wallets
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon">
            <Plus className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => (
                <Card
                  key={wallet.id}
                  className={cn(
                    "bg-dark-200 border-white/10 text-white",
                    wallet.isActive ? "border-[#6E56CF]/50" : ""
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#6E56CF]/20 flex items-center justify-center">
                          <WalletIcon className="h-4 w-4 text-[#6E56CF]" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {wallet.name}
                          </CardTitle>
                          <CardDescription className="text-white/70">
                            {wallet.type}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-dark-200 border-white/10 text-white"
                        >
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            Edit Name
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            View on Explorer
                          </DropdownMenuItem>
                          {wallet.isActive ? (
                            <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-yellow-500">
                              Disconnect
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-[#10B981]">
                              Reconnect
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-sm text-white/70 truncate">
                        {wallet.address}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-3.5 w-3.5 text-white/70" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/70">
                          SOL Balance
                        </span>
                        <span className="font-medium">
                          {wallet.balance.sol}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/70">
                          USDC Balance
                        </span>
                        <span className="font-medium">
                          ${wallet.balance.usdc}
                        </span>
                      </div>
                      {wallet.balance.bonk > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/70">
                            BONK Balance
                          </span>
                          <span className="font-medium">
                            {wallet.balance.bonk.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {wallet.balance.ray > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/70">
                            RAY Balance
                          </span>
                          <span className="font-medium">
                            {wallet.balance.ray}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            wallet.isActive
                              ? "bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30"
                              : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                          )}
                        >
                          {wallet.isActive ? "Active" : "Disconnected"}
                        </Badge>
                        <span className="text-xs text-white/50">
                          Last used: {wallet.lastUsed}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4 text-white/70" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-dark-200 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-lg">
                  Recent Wallet Activity
                </CardTitle>
                <CardDescription className="text-white/70">
                  Recent transactions across all connected wallets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-dark-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6E56CF]/20 flex items-center justify-center">
                          <ArrowUpRight className="h-5 w-5 text-[#6E56CF]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Sent 2.5 SOL</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-white/70">
                              To: 8xDR54a...9j2K
                            </span>
                            <Badge className="bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30">
                              Completed
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Mar 30, 2025</div>
                        <div className="text-sm text-white/70">10:30 AM</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 border-white/10 bg-dark-300 hover:bg-white/10"
                >
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <TokenDistribution tokens={tokens} />

            <Card className="bg-dark-200 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Wallet Security</CardTitle>
                <CardDescription className="text-white/70">
                  Enhance the security of your wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg border border-white/10 bg-dark-300">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-white/70 mt-1">
                    Add an extra layer of security to your account
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-3 border-white/10 hover:bg-white/10"
                  >
                    Enable 2FA
                  </Button>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-dark-300">
                  <h4 className="font-medium">Transaction Notifications</h4>
                  <p className="text-sm text-white/70 mt-1">
                    Get notified for all wallet activities
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-3 border-white/10 hover:bg-white/10"
                  >
                    Configure Alerts
                  </Button>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-dark-300">
                  <h4 className="font-medium">Spending Limits</h4>
                  <p className="text-sm text-white/70 mt-1">
                    Set daily transaction limits for your wallets
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-3 border-white/10 hover:bg-white/10"
                  >
                    Set Limits
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
