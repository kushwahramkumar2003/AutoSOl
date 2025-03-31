import type { Metadata } from "next";
import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Clock,
  Download,
  Filter,
  MoreHorizontal,
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
  title: "Transactions | AutoSOL",
  description: "View your transaction history on Solana",
};

// Mock data for transactions
const transactions = [
  {
    id: "tx-001",
    type: "outgoing",
    amount: 5.2,
    token: "SOL",
    recipient: "CryptoDevs DAO",
    recipientAddress: "8xDR54a...9j2K",
    date: "Mar 30, 2025",
    time: "10:30 AM",
    status: "completed",
    fee: 0.000005,
    confirmations: 32,
  },
  {
    id: "tx-002",
    type: "incoming",
    amount: 100,
    token: "USDC",
    recipient: "John Smith",
    recipientAddress: "3tYV87b...5rL1",
    date: "Mar 30, 2025",
    time: "09:15 AM",
    status: "completed",
    fee: 0.000005,
    confirmations: 32,
  },
  {
    id: "tx-003",
    type: "outgoing",
    amount: 0.5,
    token: "SOL",
    recipient: "SolanaFM",
    recipientAddress: "7pQR32c...8mN4",
    date: "Mar 29, 2025",
    time: "3:45 PM",
    status: "completed",
    fee: 0.000005,
    confirmations: 32,
  },
  {
    id: "tx-004",
    type: "outgoing",
    amount: 25,
    token: "USDC",
    recipient: "Solana Hosting",
    recipientAddress: "2zXC45d...1pT7",
    date: "Mar 29, 2025",
    time: "1:20 PM",
    status: "pending",
    fee: 0.000005,
    confirmations: 0,
  },
  {
    id: "tx-005",
    type: "incoming",
    amount: 2.5,
    token: "SOL",
    recipient: "Alice Johnson",
    recipientAddress: "5aSD78e...3qJ9",
    date: "Mar 28, 2025",
    time: "11:30 AM",
    status: "completed",
    fee: 0.000005,
    confirmations: 32,
  },
  {
    id: "tx-006",
    type: "outgoing",
    amount: 100000,
    token: "BONK",
    recipient: "Bonk Foundation",
    recipientAddress: "9bVN12f...7gH3",
    date: "Mar 27, 2025",
    time: "2:15 PM",
    status: "completed",
    fee: 0.000005,
    confirmations: 32,
  },
  {
    id: "tx-007",
    type: "outgoing",
    amount: 1.2,
    token: "SOL",
    recipient: "Web3 Services",
    recipientAddress: "4cBM67g...2kL5",
    date: "Mar 26, 2025",
    time: "9:45 AM",
    status: "failed",
    fee: 0.000005,
    confirmations: 0,
  },
  {
    id: "tx-008",
    type: "incoming",
    amount: 50,
    token: "USDC",
    recipient: "Client Payment",
    recipientAddress: "1jKL90h...6mP2",
    date: "Mar 25, 2025",
    time: "4:30 PM",
    status: "completed",
    fee: 0.000005,
    confirmations: 32,
  },
];

export default function TransactionsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Transactions</h1>
            <p className="text-white/70 mt-1">
              View and manage your transaction history
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/10 bg-dark-300 hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="bg-dark-200 rounded-lg border border-white/10 p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search Transactions ..."
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
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-dark-300">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-white/70">Type</TableHead>
                  <TableHead className="text-white/70">Amount</TableHead>
                  <TableHead className="text-white/70">Recipient</TableHead>
                  <TableHead className="text-white/70">Date & Time</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Fee</TableHead>
                  <TableHead className="text-white/70 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="hover:bg-dark-300 border-white/10"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            transaction.type === "incoming"
                              ? "bg-[#10B981]/20"
                              : "bg-[#6E56CF]/20"
                          )}
                        >
                          {transaction.type === "incoming" ? (
                            <ArrowDownRight className="h-4 w-4 text-[#10B981]" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-[#6E56CF]" />
                          )}
                        </div>
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {transaction.type === "incoming" ? "+" : "-"}
                        {transaction.amount} {transaction.token}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transaction.recipient}
                        </div>
                        <div className="text-xs text-white/70">
                          {transaction.recipientAddress}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.date}</div>
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <Clock className="h-3 w-3" />
                          <span>{transaction.time}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "capitalize",
                          transaction.status === "completed"
                            ? "bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30"
                            : transaction.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                              : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                        )}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white/70">
                        {transaction.fee} SOL
                      </div>
                    </TableCell>
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
                          className=" border-white/10 text-white"
                        >
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            Copy Transaction ID
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            View on Explorer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            Export Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-white/70">
              Showing 8 of 24 transactions
            </div>
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
