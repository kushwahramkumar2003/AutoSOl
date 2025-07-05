"use client";

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
  Copy,
  ExternalLink,
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
import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/use-program";
import { toast } from "sonner";
import config from "@/config";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// Define proper types for transactions
interface TransactionData {
  schedule: {
    address: PublicKey;
    data: {
      owner: PublicKey;
      totalAmount: anchor.BN;
      remainingAmount: anchor.BN;
      paymentAmount: anchor.BN;
      recipient: PublicKey;
      payments: Array<{
        scheduledTime: anchor.BN;
        executed: boolean;
        executionTime: anchor.BN;
        txSignature: PublicKey | null;
      }>;
      createdAt: anchor.BN;
      status: string;
      memo: string;
    };
  };
  payment: {
    scheduledTime: anchor.BN;
    executed: boolean;
    executionTime: anchor.BN;
    txSignature: PublicKey | null;
  };
  index: number;
  scheduleAddress: PublicKey;
  recipient: PublicKey;
  amount: anchor.BN;
  memo: string;
  status: string;
  txSignature: PublicKey | null;
  scheduledTime: anchor.BN;
  executionTime: anchor.BN;
  isIncoming: boolean;
}

export default function TransactionsPage() {
  const { program } = useProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  // Pagination (simple client-side for now)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch transactions for the connected wallet (both outgoing and incoming)
  useEffect(() => {
    const fetchTxs = async () => {
      if (!wallet.publicKey || !program) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch outgoing transactions (where user is owner)
        const outgoingSchedules = await program.getSchedulesForOwner(
          wallet.publicKey
        );

        // Fetch incoming transactions (where user is recipient)
        const incomingSchedules = await program.getSchedulesForRecipient(
          wallet.publicKey
        );

        // Flatten all payments from all schedules
        const txs: TransactionData[] = [];

        // Process outgoing transactions
        outgoingSchedules.forEach((schedule) => {
          schedule.data.payments.forEach((p, idx) => {
            txs.push({
              schedule,
              payment: p,
              index: idx,
              scheduleAddress: schedule.address,
              recipient: schedule.data.recipient,
              amount: schedule.data.paymentAmount,
              memo: schedule.data.memo,
              status: p.executed ? "completed" : "pending",
              txSignature: p.txSignature,
              scheduledTime: p.scheduledTime,
              executionTime: p.executionTime,
              isIncoming: false,
            });
          });
        });

        // Process incoming transactions
        incomingSchedules.forEach((schedule) => {
          schedule.data.payments.forEach((p, idx) => {
            txs.push({
              schedule,
              payment: p,
              index: idx,
              scheduleAddress: schedule.address,
              recipient: schedule.data.recipient,
              amount: schedule.data.paymentAmount,
              memo: schedule.data.memo,
              status: p.executed ? "completed" : "pending",
              txSignature: p.txSignature,
              scheduledTime: p.scheduledTime,
              executionTime: p.executionTime,
              isIncoming: true,
            });
          });
        });

        // Sort by scheduledTime desc
        txs.sort(
          (a, b) => b.scheduledTime.toNumber() - a.scheduledTime.toNumber()
        );
        setTransactions(txs);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch transactions";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTxs();
  }, [wallet.publicKey, program]);

  // Filtering and searching
  const filteredTxs = useMemo(() => {
    let txs = transactions;
    if (search) {
      txs = txs.filter(
        (tx) =>
          tx.txSignature
            ?.toString()
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          tx.recipient
            ?.toString()
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          tx.memo?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterType !== "all") {
      txs = txs.filter((tx) => {
        return filterType === "incoming" ? tx.isIncoming : !tx.isIncoming;
      });
    }
    if (filterStatus !== "all") {
      txs = txs.filter((tx) => tx.status === filterStatus);
    }
    return txs;
  }, [transactions, search, filterType, filterStatus]);

  // Pagination
  const pagedTxs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTxs.slice(start, start + pageSize);
  }, [filteredTxs, page]);

  // Helper for formatting
  const formatLamports = (bn: anchor.BN) => {
    if (!bn || typeof bn.toNumber !== "function") return "0";
    return (bn.toNumber() / 1e9).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  };
  const formatDateTime = (bn: anchor.BN) => {
    if (!bn || typeof bn.toNumber !== "function") return "-";
    const date = new Date(bn.toNumber() * 1000);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Excel export function
  const exportToExcel = async () => {
    if (filteredTxs.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    setIsExporting(true);
    try {
      // Prepare data for Excel export
      const exportData = filteredTxs.map((tx) => {
        let status = tx.status;
        if (tx.schedule?.data?.status?.toLowerCase() === "cancelled") {
          status = "cancelled";
        }

        return {
          Type: tx.isIncoming ? "Incoming" : "Outgoing",
          Amount: `${tx.isIncoming ? "+" : "-"}${formatLamports(tx.amount)} SOL`,
          "Amount (SOL)": parseFloat(formatLamports(tx.amount)),
          Recipient: tx.recipient?.toString() || "",
          "Schedule Address": tx.scheduleAddress?.toString() || "",
          "Scheduled Date": formatDateTime(tx.scheduledTime),
          "Execution Date":
            tx.executionTime && tx.executionTime.toNumber() > 0
              ? formatDateTime(tx.executionTime)
              : "Not executed yet",
          Status: status.charAt(0).toUpperCase() + status.slice(1),
          "Transaction Signature": tx.txSignature?.toString() || "",
          Memo: tx.memo || "",
          "Explorer Link": tx.txSignature
            ? `https://explorer.solana.com/tx/${tx.txSignature.toString()}?cluster=${config.rpcEndpoint === "http://127.0.0.1:8899" ? "custom" : "devnet"}`
            : "",
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Type
        { wch: 18 }, // Amount
        { wch: 15 }, // Amount (SOL)
        { wch: 45 }, // Recipient
        { wch: 45 }, // Schedule Address
        { wch: 20 }, // Scheduled Date
        { wch: 20 }, // Execution Date
        { wch: 12 }, // Status
        { wch: 45 }, // Transaction Signature
        { wch: 20 }, // Memo
        { wch: 60 }, // Explorer Link
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const filename = `transactions_${dateStr}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);

      toast.success(
        `Exported ${filteredTxs.length} transactions to ${filename}`
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

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
            onClick={exportToExcel}
            disabled={isExporting || filteredTxs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>

        <div className="bg-dark-200 rounded-lg border border-white/10 p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search Transactions ..."
                className="pl-8 bg-white/5 border-white/10 focus-visible:ring-[#6E56CF]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() =>
                  setFilterType(
                    filterType === "all"
                      ? "outgoing"
                      : filterType === "outgoing"
                        ? "incoming"
                        : "all"
                  )
                }
              >
                <Filter className="h-4 w-4 mr-2" />
                {filterType === "all"
                  ? "All"
                  : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() =>
                  setFilterStatus(
                    filterStatus === "all"
                      ? "completed"
                      : filterStatus === "completed"
                        ? "pending"
                        : "all"
                  )
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                {filterStatus === "all"
                  ? "All Status"
                  : filterStatus.charAt(0).toUpperCase() +
                    filterStatus.slice(1)}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded p-3">
              {error}
            </div>
          )}

          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-dark-300">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-white/70">Type</TableHead>
                  <TableHead className="text-white/70">Amount</TableHead>
                  <TableHead className="text-white/70">Recipient</TableHead>
                  <TableHead className="text-white/70">Date & Time</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                  <TableHead className="text-white/70 text-right">
                    More
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(pageSize)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full bg-white/10" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pagedTxs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-white/70 py-8"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedTxs.map((tx, idx) => {
                    // Handle cancelled status
                    let status = tx.status;
                    if (
                      tx.schedule?.data?.status?.toLowerCase() === "cancelled"
                    ) {
                      status = "cancelled";
                    }
                    return (
                      <TableRow
                        key={tx.txSignature?.toString() + idx}
                        className={cn(
                          "border-white/10 transition-colors",
                          "hover:bg-dark-300/80",
                          status === "cancelled" && "opacity-60 bg-red-900/10"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                tx.isIncoming
                                  ? "bg-[#10B981]/20"
                                  : "bg-[#6E56CF]/20"
                              )}
                            >
                              {tx.isIncoming ? (
                                <ArrowDownRight className="h-4 w-4 text-[#10B981]" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-[#6E56CF]" />
                              )}
                            </div>
                            <span className="capitalize">
                              {tx.isIncoming ? "incoming" : "outgoing"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {tx.isIncoming ? "+" : "-"}
                            {formatLamports(tx.amount)} SOL
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[120px] md:max-w-[200px]">
                            <div className="font-medium truncate">
                              {tx.recipient?.toString()}
                            </div>
                            <div className="text-xs text-white/70 truncate">
                              {tx.scheduleAddress?.toString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDateTime(tx.scheduledTime)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-white/70">
                              <Clock className="h-3 w-3" />
                              <span>
                                {tx.executionTime &&
                                tx.executionTime.toNumber() > 0
                                  ? formatDateTime(tx.executionTime)
                                  : "Not executed yet"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "capitalize",
                              status === "completed"
                                ? "bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30"
                                : status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                                  : status === "cancelled"
                                    ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500"
                                    : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            )}
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.txSignature ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-xs border-white/10 bg-dark-300 hover:bg-white/10"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      tx.txSignature!.toString()
                                    );
                                    toast.success("Copied to clipboard");
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <a
                                  href={`https://explorer.solana.com/tx/${tx.txSignature.toString()}?cluster=${config.rpcEndpoint === "http://127.0.0.1:8899" ? "custom" : "devnet"}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 px-2 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/30"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </>
                            ) : (
                              <span className="text-white/40">-</span>
                            )}
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
                              {tx.txSignature && (
                                <DropdownMenuItem
                                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      tx.txSignature!.toString()
                                    );
                                    toast.success("Copied to clipboard");
                                  }}
                                >
                                  Copy Transaction ID
                                </DropdownMenuItem>
                              )}
                              {tx.txSignature && (
                                <DropdownMenuItem
                                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                  onClick={() => {
                                    window.open(
                                      `https://explorer.solana.com/tx/${tx.txSignature.toString()}?cluster=${config.rpcEndpoint === "http://127.0.0.1:8899" ? "custom" : "devnet"}`,
                                      "_blank"
                                    );
                                  }}
                                >
                                  View on Explorer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-white/70">
              Showing {pagedTxs.length} of {filteredTxs.length} transactions
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-dark-300 hover:bg-white/10"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-dark-300 hover:bg-white/10"
                disabled={page * pageSize >= filteredTxs.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Responsive tweaks for the table container */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .table-responsive {
            overflow-x: auto;
            display: block;
          }
          .table-responsive table {
            min-width: 700px;
          }
        }
      `}</style>
    </div>
  );
}
