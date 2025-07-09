"use client";

import { useState, useMemo } from "react";
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
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Eye,
  Download,
  BarChart3,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "outgoing" ? (
      <ArrowUpRight className="h-4 w-4" />
    ) : (
      <ArrowDownRight className="h-4 w-4" />
    );
  };

  const getTypeColor = (type: string) => {
    return type === "outgoing"
      ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
      : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const viewOnExplorer = (signature?: string) => {
    if (signature) {
      window.open(`https://solscan.io/tx/${signature}`, "_blank");
    }
  };

  return (
    <Card
      className={cn("transition-all duration-200 hover:shadow-md", className)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest payment activities</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {onViewAll && (
              <Button variant="outline" size="sm" onClick={onViewAll}>
                View All
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">
                No transactions found
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No recent transactions to display"}
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg transition-all duration-200 hover:bg-muted/50 cursor-pointer",
                  onTransactionClick && "hover:shadow-sm"
                )}
                onClick={() => onTransactionClick?.(transaction)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      getTypeColor(transaction.type)
                    )}
                  >
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium truncate">
                        {transaction.recipient}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.token}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {transaction.date}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground font-mono">
                        {transaction.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-medium">
                      {transaction.type === "outgoing" ? "-" : "+"}
                      {transaction.amount.toFixed(4)} {transaction.token}
                    </div>
                    <Badge
                      className={cn("mt-1", getStatusColor(transaction.status))}
                    >
                      {transaction.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-1">
                    {transaction.txSignature && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewOnExplorer(transaction.txSignature);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(transaction.id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    {onTransactionClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionClick(transaction);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredTransactions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </span>
              {filteredTransactions.length === maxItems && (
                <Button variant="link" size="sm" onClick={onViewAll}>
                  View All Transactions
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
