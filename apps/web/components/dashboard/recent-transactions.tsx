"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Filter,
  MoreHorizontal,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "incoming" | "outgoing";
  amount: number;
  token: string;
  recipient: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  className?: string;
}

export default function RecentTransactions({
  transactions,
  className,
}: RecentTransactionsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.amount.toString().includes(searchQuery)
  );

  return (
    <Card className={cn("bg-dark-200 border-white/10 text-white", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Recent Transactions
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Search transactions..."
              className="pl-8 h-8 bg-dark-300 border-white/10 focus-visible:ring-[#6E56CF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-white/10 bg-dark-300 hover:bg-white/10"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filter
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-dark-300">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="text-white/70">Type</TableHead>
                <TableHead className="text-white/70">Amount</TableHead>
                <TableHead className="text-white/70">Recipient</TableHead>
                <TableHead className="text-white/70">Date</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
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
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-xs">
                            {transaction.recipient.charAt(0)}
                          </span>
                        </div>
                        <span>{transaction.recipient}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-white/70">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{transaction.date}</span>
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
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            Copy Transaction ID
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            Export Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-white/50"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            className="border-white/10 bg-dark-300 hover:bg-white/10"
          >
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
