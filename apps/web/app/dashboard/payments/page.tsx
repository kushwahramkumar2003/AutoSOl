import type { Metadata } from "next";
import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Recurring Payments | AutoSOL",
  description: "Manage your recurring payments on Solana",
};

const recurringPayments = [
  {
    id: "pay-001",
    name: "Solana Hosting",
    recipient: "8xDR54a...9j2K",
    amount: 25,
    token: "USDC",
    frequency: "Monthly",
    nextDate: "Apr 1, 2025",
    status: "active",
    createdAt: "Jan 1, 2025",
  },
  {
    id: "pay-002",
    name: "SolanaFM API",
    recipient: "3tYV87b...5rL1",
    amount: 0.5,
    token: "SOL",
    frequency: "Weekly",
    nextDate: "Apr 2, 2025",
    status: "active",
    createdAt: "Feb 15, 2025",
  },
  {
    id: "pay-003",
    name: "CryptoDevs DAO",
    recipient: "7pQR32c...8mN4",
    amount: 5,
    token: "SOL",
    frequency: "Monthly",
    nextDate: "Apr 5, 2025",
    status: "active",
    createdAt: "Dec 10, 2024",
  },
  {
    id: "pay-004",
    name: "Solana Staking",
    recipient: "2zXC45d...1pT7",
    amount: 1,
    token: "SOL",
    frequency: "Weekly",
    nextDate: "Apr 3, 2025",
    status: "active",
    createdAt: "Mar 1, 2025",
  },
  {
    id: "pay-005",
    name: "NFT Subscription",
    recipient: "5aSD78e...3qJ9",
    amount: 10,
    token: "USDC",
    frequency: "Monthly",
    nextDate: "Apr 15, 2025",
    status: "active",
    createdAt: "Jan 15, 2025",
  },
  {
    id: "pay-006",
    name: "Bonk Donation",
    recipient: "9bVN12f...7gH3",
    amount: 100000,
    token: "BONK",
    frequency: "Monthly",
    nextDate: "Apr 10, 2025",
    status: "paused",
    createdAt: "Feb 1, 2025",
  },
  {
    id: "pay-007",
    name: "Solana Foundation",
    recipient: "4cBM67g...2kL5",
    amount: 2,
    token: "SOL",
    frequency: "Monthly",
    nextDate: "N/A",
    status: "cancelled",
    createdAt: "Dec 5, 2024",
  },
];

export default function PaymentsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Recurring Payments
            </h1>
            <p className="text-white/70 mt-1">
              Manage your automated payment schedules
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon">
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>

        <div className="bg-dark-200 rounded-lg border border-white/10 p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search Payments..."
                className="pl-8 bg-white/5 border-white/10 focus-visible:ring-[#6E56CF]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-white/10 bg-dark-300 hover:bg-white/10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-dark-300 hover:bg-white/10"
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                Frequency
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-dark-300">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-white/70">Name</TableHead>
                  <TableHead className="text-white/70">Recipient</TableHead>
                  <TableHead className="text-white/70">Amount</TableHead>
                  <TableHead className="text-white/70">Frequency</TableHead>
                  <TableHead className="text-white/70">Next Payment</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Created</TableHead>
                  <TableHead className="text-white/70 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="hover:bg-dark-300 border-white/10"
                  >
                    <TableCell className="font-medium">
                      {payment.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#6E56CF]/20 flex items-center justify-center">
                          <span className="text-xs">
                            {payment.recipient.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm">{payment.recipient}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.amount} {payment.token}
                    </TableCell>
                    <TableCell>{payment.frequency}</TableCell>
                    <TableCell>{payment.nextDate}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "capitalize",
                          payment.status === "active"
                            ? "bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30"
                            : payment.status === "paused"
                              ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                              : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.createdAt}</TableCell>
                    <TableCell className="text-right">
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
                            Edit Payment
                          </DropdownMenuItem>
                          {payment.status === "active" ? (
                            <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                              Pause Payment
                            </DropdownMenuItem>
                          ) : payment.status === "paused" ? (
                            <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                              Resume Payment
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            View History
                          </DropdownMenuItem>
                          {payment.status !== "cancelled" && (
                            <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-red-500">
                              Cancel Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-white/70">Showing 7 of 7 payments</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-dark-300 hover:bg-white/10"
                disabled
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-dark-300 hover:bg-white/10"
                disabled
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
