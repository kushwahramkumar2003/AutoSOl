"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  Eye,
  Search,
} from "lucide-react";
import { Transaction } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  onViewAll?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  className,
  maxItems = 10,
  showFilters = true,
  onViewAll,
  onTransactionClick,
}: RecentTransactionsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch =
          tx.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || tx.status === statusFilter;
        const matchesType = typeFilter === "all" || tx.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .slice(0, maxItems);
  }, [transactions, searchTerm, statusFilter, typeFilter, maxItems]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "border-primary/20 bg-primary/10 text-primary";
      case "pending":
        return "border-white/10 bg-white/[0.05] text-slate-200";
      case "failed":
        return "border-white/10 bg-white/[0.03] text-slate-400";
      default:
        return "border-white/10 bg-white/[0.05] text-slate-300";
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "outgoing" ? (
      <ArrowUpRight className="h-4 w-4" />
    ) : (
      <ArrowDownLeft className="h-4 w-4" />
    );
  };

  const getTypeClass = (type: string) => {
    return type === "outgoing"
      ? "bg-primary/12 text-primary"
      : "bg-white/[0.08] text-slate-200";
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <Card
      className={cn(
        "glass-panel rounded-[28px] border-white/[0.06] text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-white">
              Recent Transactions
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              Latest confirmed and pending payment activity.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onViewAll ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
              >
                View all
              </Button>
            ) : null}
          </div>
        </div>

        {showFilters ? (
          <div className="flex flex-col gap-2 pt-2 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search recipient, token, or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-white/10 bg-white/[0.04] pl-10 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-slate-100 lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black text-slate-100">
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-slate-100 lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black text-slate-100">
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-200">
              No transactions to show
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Adjust the filters or wait for new payment activity.
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={cn(
                "flex flex-col gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]",
                onTransactionClick && "cursor-pointer"
              )}
              onClick={() => onTransactionClick?.(transaction)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-1 flex h-10 w-10 items-center justify-center rounded-2xl",
                    getTypeClass(transaction.type)
                  )}
                >
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">
                      {transaction.recipient}
                    </p>
                    <Badge className="border-white/10 bg-white/[0.05] text-slate-200">
                      {transaction.token}
                    </Badge>
                    <Badge className={cn("border", getStatusClass(transaction.status))}>
                      {transaction.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                    <span>{transaction.date}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono">{transaction.id.slice(0, 12)}...</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    {transaction.type === "outgoing" ? "-" : "+"}
                    {transaction.amount.toFixed(4)} {transaction.token}
                  </div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {transaction.type}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                {transaction.executorAddress ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `https://solscan.io/address/${transaction.executorAddress}`,
                        "_blank"
                      );
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await copyToClipboard(transaction.id);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {onTransactionClick ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTransactionClick(transaction);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
