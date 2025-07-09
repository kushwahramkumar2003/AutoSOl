"use client";

import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Plus,
  Search,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  DollarSign,
  Users,
  Activity,
  Pause,
  Play,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProgram } from "@/hooks/use-program";
import { useWallet } from "@solana/wallet-adapter-react";
import { ScheduleWithAddress, PaymentScheduleData } from "../../../lib/program";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import config from "@/config";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import * as anchor from "@coral-xyz/anchor";

type FilterType = "all" | "active" | "completed" | "paused";
type SortType =
  | "newest"
  | "oldest"
  | "amount_high"
  | "amount_low"
  | "remaining_high"
  | "remaining_low";

interface CustomError extends Error {
  code?: string;
}

// Utility to extract status string from object
function getStatusString(statusObj: unknown): string {
  if (typeof statusObj === "string") return statusObj;
  if (typeof statusObj === "object" && statusObj !== null) {
    const keys = Object.keys(statusObj);
    if (keys.length > 0) return keys[0];
  }
  return "unknown";
}

export default function PaymentsPage() {
  const { program } = useProgram();
  const wallet = useWallet();
  const router = useRouter();
  const [payments, setPayments] = useState<ScheduleWithAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [selectedPayment, setSelectedPayment] =
    useState<ScheduleWithAddress | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cancelingPayment, setCancelingPayment] =
    useState<ScheduleWithAddress | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!wallet.publicKey || !program) {
      console.log("Wallet not connected or program not available");
      return;
    }

    setLoading(true);
    try {
      const res = await program.getSchedulesForOwner(wallet.publicKey);
      if (res) {
        setPayments(res);
        console.log("Paymets", res);
        toast.success(`Loaded ${res.length} payment schedules`);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment schedules");
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Helper functions
  const formatLamports = (bn: anchor.BN) => {
    if (!bn || typeof bn.toNumber !== "function") return "0";
    return (bn.toNumber() / 1e9).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  };

  const formatDate = (bn: anchor.BN) => {
    if (!bn || typeof bn.toNumber !== "function") return "-";
    const date = new Date(bn.toNumber() * 1000);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const truncateAddress = (address: string, start = 4, end = 4) => {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (status: unknown) => {
    switch (getStatusString(status).toLowerCase()) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 hover:bg-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30";
    }
  };

  const getStatusIcon = (status: unknown) => {
    switch (getStatusString(status).toLowerCase()) {
      case "active":
        return <Play className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "paused":
        return <Pause className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getProgress = (payment: PaymentScheduleData) => {
    const total = payment.totalAmount.toNumber();
    const remaining = payment.remainingAmount.toNumber();
    const paid = total - remaining;
    return total > 0 ? (paid / total) * 100 : 0;
  };

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = payments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.data.recipient
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.data.memo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.address
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(
        (payment) =>
          getStatusString(payment.data.status).toLowerCase() ===
          filter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.data.createdAt.toNumber() - a.data.createdAt.toNumber();
        case "oldest":
          return a.data.createdAt.toNumber() - b.data.createdAt.toNumber();
        case "amount_high":
          return b.data.totalAmount.toNumber() - a.data.totalAmount.toNumber();
        case "amount_low":
          return a.data.totalAmount.toNumber() - b.data.totalAmount.toNumber();
        case "remaining_high":
          return (
            b.data.remainingAmount.toNumber() -
            a.data.remainingAmount.toNumber()
          );
        case "remaining_low":
          return (
            a.data.remainingAmount.toNumber() -
            b.data.remainingAmount.toNumber()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [payments, searchTerm, filter, sort]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activePayments = payments.filter(
      (p) => getStatusString(p.data.status).toLowerCase() === "active"
    );
    const totalAmount = payments.reduce(
      (sum, p) => sum + p.data.totalAmount.toNumber(),
      0
    );
    const totalRemaining = payments.reduce(
      (sum, p) => sum + p.data.remainingAmount.toNumber(),
      0
    );
    const totalPaid = totalAmount - totalRemaining;

    return {
      total: payments.length,
      active: activePayments.length,
      completed: payments.filter(
        (p) => getStatusString(p.data.status).toLowerCase() === "completed"
      ).length,
      totalAmount: totalAmount / 1e9,
      totalPaid: totalPaid / 1e9,
      totalRemaining: totalRemaining / 1e9,
    };
  }, [payments]);

  // Cancel schedule handler with robust validation and feedback
  const onCancelSchedule = async (payment: ScheduleWithAddress) => {
    if (cancelLoading) return;
    if (!program) {
      toast.error("Program not initialized. Please connect your wallet.");
      return;
    }
    if (!payment || !payment.data) {
      toast.error("Invalid payment schedule.");
      return;
    }
    setCancelLoading(true);
    try {
      // This will throw if not owner or not active/paused
      const tx = await program.cancelPaymentSchedule(payment.address);
      toast.success("Payment schedule cancelled successfully!", {
        description: tx ? (
          <a
            href={`https://explorer.solana.com/tx/${tx}?cluster=${config.rpcEndpoint === "http://127.0.0.1:8899" ? "custom" : "devnet"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            View on Solana Explorer
          </a>
        ) : undefined,
      });
      setCancelingPayment(null);
      fetchPayments();
    } catch (err: unknown) {
      // Try to surface the most user-friendly error message
      const error = err as CustomError;
      let message = error?.message || String(err);
      if (error?.code === "UNAUTHORIZED_CANCELLATION") {
        message = "You are not the owner of this payment schedule.";
      } else if (error?.code === "INVALID_SCHEDULE_STATUS") {
        message = "Only active payment schedules can be cancelled.";
      } else if (message.includes("WALLET_NOT_CONNECTED")) {
        message = "Wallet not connected.";
      }
      toast.error("Failed to cancel payment schedule.", {
        description: message,
      });
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Activity className="h-8 w-8 text-[#6E56CF]" />
              Recurring Payments
            </h1>
            <p className="text-white/70 mt-1">
              Manage your automated payment schedules on Solana
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchPayments}
              disabled={loading}
              className="border-white/10 bg-dark-300 hover:bg-white/10"
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              onClick={() => {
                router.push("/dashboard/payments/new");
              }}
              className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-lg shadow-[#6E56CF]/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Payment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full bg-white/10" />
              ))}
            </>
          ) : (
            <>
              <Card className="bg-dark-200 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">
                    Total Schedules
                  </CardTitle>
                  <Users className="h-4 w-4 text-white/50" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.total}
                  </div>
                  <p className="text-xs text-white/50">
                    {stats.active} active schedules
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-200 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">
                    Total Value
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-white/50" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalAmount.toFixed(2)} SOL
                  </div>
                  <p className="text-xs text-white/50">Across all schedules</p>
                </CardContent>
              </Card>

              <Card className="bg-dark-200 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">
                    Paid Out
                  </CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">
                    {stats.totalPaid.toFixed(2)} SOL
                  </div>
                  <p className="text-xs text-white/50">
                    Successfully processed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-200 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">
                    Remaining
                  </CardTitle>
                  <ArrowDownRight className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.totalRemaining.toFixed(2)} SOL
                  </div>
                  <p className="text-xs text-white/50">To be processed</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Content */}
        <Card className="bg-dark-200 border-white/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  placeholder="Search payments, recipients, or memos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 focus-visible:ring-[#6E56CF]"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filter}
                  onValueChange={(value: FilterType) => setFilter(value)}
                >
                  <SelectTrigger className="w-[120px] bg-dark-300 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-300 border-white/10">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sort}
                  onValueChange={(value: SortType) => setSort(value)}
                >
                  <SelectTrigger className="w-[140px] bg-dark-300 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-300 border-white/10">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="amount_high">Amount: High</SelectItem>
                    <SelectItem value="amount_low">Amount: Low</SelectItem>
                    <SelectItem value="remaining_high">
                      Remaining: High
                    </SelectItem>
                    <SelectItem value="remaining_low">
                      Remaining: Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-dark-300">
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead className="text-white/70">Recipient</TableHead>
                    <TableHead className="text-white/70">Amount</TableHead>
                    <TableHead className="text-white/70">Progress</TableHead>
                    <TableHead className="text-white/70">Status</TableHead>
                    <TableHead className="text-white/70">Created</TableHead>
                    <TableHead className="text-white/70">Memo</TableHead>
                    <TableHead className="text-white/70 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(7)].map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-full bg-white/10" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredAndSortedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-white/70 py-8"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-white/30" />
                          <p>No payment schedules found</p>
                          {searchTerm && (
                            <p className="text-sm text-white/50">
                              Try adjusting your search or filters
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedPayments.map((payment) => (
                      <TableRow
                        key={payment.address.toString()}
                        className="hover:bg-dark-300/50 border-white/10 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {payment.data.recipient
                                  .toString()
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {truncateAddress(
                                  payment.data.recipient.toString()
                                )}
                              </div>
                              <div className="text-xs text-white/50">
                                {truncateAddress(payment.address.toString())}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-white">
                            {formatLamports(payment.data.totalAmount)} SOL
                          </div>
                          <div className="text-xs text-white/50">
                            {formatLamports(payment.data.paymentAmount)} SOL per
                            payment
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-full max-w-[120px]">
                            <div className="flex justify-between text-xs text-white/70 mb-1">
                              <span>Progress</span>
                              <span>
                                {getProgress(payment.data).toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={getProgress(payment.data)}
                              className="h-2 bg-white/10"
                            />
                            <div className="text-xs text-white/50 mt-1">
                              {formatLamports(payment.data.remainingAmount)} SOL
                              remaining
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "capitalize flex items-center gap-1",
                              getStatusColor(payment.data.status)
                            )}
                          >
                            {getStatusIcon(payment.data.status)}
                            {getStatusString(payment.data.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-white">
                            {formatDate(payment.data.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate text-sm text-white/70">
                            {payment.data.memo || "No memo"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-white/10"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className=" border-white/10 text-white min-w-[160px]"
                            >
                              <DropdownMenuItem
                                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                onClick={() =>
                                  copyToClipboard(payment.address.toString())
                                }
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Address
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                onClick={() =>
                                  copyToClipboard(
                                    payment.data.recipient.toString()
                                  )
                                }
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Recipient
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              {getStatusString(
                                payment.data.status
                              ).toLowerCase() === "active" && (
                                <>
                                  <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause Schedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit Schedule
                                  </DropdownMenuItem>
                                </>
                              )}
                              {getStatusString(
                                payment.data.status
                              ).toLowerCase() === "paused" && (
                                <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume Schedule
                                </DropdownMenuItem>
                              )}
                              {(getStatusString(
                                payment.data.status
                              ).toLowerCase() === "active" ||
                                getStatusString(
                                  payment.data.status
                                ).toLowerCase() === "paused") && (
                                <DropdownMenuItem
                                  className="hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-red-400"
                                  onClick={() => setCancelingPayment(payment)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancel Schedule
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-white/70">
                Showing {filteredAndSortedPayments.length} of {payments.length}{" "}
                payment schedules
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
                  disabled
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent
          className="border-white/10 text-white max-w-2xl w-full p-0 md:p-0"
          style={{
            maxWidth: "90vw",
            width: "100%",
            padding: 0,
          }}
        >
          <div
            className="max-h-[80vh] md:max-h-[80vh] overflow-y-auto px-6 py-6 md:px-8 md:py-8 custom-scrollbar"
            // style={{
            //   scrollbarWidth: "none",
            //   msOverflowStyle: "none",
            // }}
            /* Hide scrollbar for Chrome, Safari and Opera */
            /* You can also add a custom class for this if you prefer */
          >
            {loading && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full bg-white/10" />
                  <Skeleton className="h-12 w-full bg-white/10" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-full bg-white/10" />
                  <Skeleton className="h-12 w-full bg-white/10" />
                  <Skeleton className="h-12 w-full bg-white/10" />
                </div>
                <Skeleton className="h-8 w-full bg-white/10" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full bg-white/10" />
                  <Skeleton className="h-10 w-full bg-white/10" />
                </div>
                <Skeleton className="h-16 w-full bg-white/10" />
                <Skeleton className="h-32 w-full bg-white/10" />
              </div>
            )}
            <DialogHeader>
              <DialogTitle className="text-xl">
                Payment Schedule Details
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Complete information about this payment schedule
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70">
                      Schedule Address
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-white/10 px-2 py-1 rounded">
                        {truncateAddress(
                          selectedPayment.address.toString(),
                          6,
                          6
                        )}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(selectedPayment.address.toString())
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Recipient</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-white/10 px-2 py-1 rounded">
                        {truncateAddress(
                          selectedPayment.data.recipient.toString(),
                          6,
                          6
                        )}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(
                            selectedPayment.data.recipient.toString()
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-white/70">
                      Total Amount
                    </label>
                    <div className="text-lg font-semibold text-white mt-1">
                      {formatLamports(selectedPayment.data.totalAmount)} SOL
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">
                      Payment Amount
                    </label>
                    <div className="text-lg font-semibold text-white mt-1">
                      {formatLamports(selectedPayment.data.paymentAmount)} SOL
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Remaining</label>
                    <div className="text-lg font-semibold text-white mt-1">
                      {formatLamports(selectedPayment.data.remainingAmount)} SOL
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/70">Progress</label>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-white/70 mb-1">
                      <span>Completion</span>
                      <span>
                        {getProgress(selectedPayment.data).toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={getProgress(selectedPayment.data)}
                      className="h-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70">Status</label>
                    <div className="mt-1">
                      <Badge
                        className={cn(
                          "capitalize",
                          getStatusColor(selectedPayment.data.status)
                        )}
                      >
                        {getStatusIcon(selectedPayment.data.status)}
                        {getStatusString(selectedPayment.data.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Created</label>
                    <div className="text-sm text-white mt-1">
                      {formatDateTime(selectedPayment.data.createdAt)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/70">Memo</label>
                  <div className="text-sm text-white mt-1 p-3 bg-white/5 rounded-lg">
                    {selectedPayment.data.memo || "No memo provided"}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/70">
                    Payment History
                  </label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {selectedPayment.data.payments &&
                    selectedPayment.data.payments.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {selectedPayment.data.payments.map((payment, index) => {
                          // Determine status and color
                          const status = payment.executed
                            ? "Completed"
                            : "Pending";
                          const statusColor = payment.executed
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-yellow-500/20 text-yellow-400";
                          const statusIcon = payment.executed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          );
                          return (
                            <div
                              key={index}
                              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs text-white/50 shrink-0">
                                  #{index + 1}
                                </span>
                                <span className="truncate text-sm text-white/80 font-mono">
                                  Scheduled:{" "}
                                  {formatDateTime(payment.scheduledTime)}
                                </span>
                                <span className="truncate text-sm text-white/50 font-mono">
                                  {payment.executionTime &&
                                  payment.executionTime.toNumber() > 0
                                    ? `Executed: ${formatDateTime(payment.executionTime)}`
                                    : "Not executed yet"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusColor}`}
                                >
                                  {statusIcon}
                                  {status}
                                </span>
                                <span className="text-xs text-white/70">
                                  Amount:{" "}
                                  <span className="font-semibold text-white">
                                    {formatLamports(
                                      selectedPayment.data.paymentAmount
                                    )}{" "}
                                    SOL
                                  </span>
                                </span>
                                <span className="text-xs text-white/70">
                                  Executer:
                                  {payment.txSignature ? (
                                    <span className="inline-flex items-center gap-1 ml-1">
                                      <code className="bg-white/10 px-1 rounded text-white font-mono">
                                        {truncateAddress(
                                          payment.txSignature.toString(),
                                          6,
                                          6
                                        )}
                                      </code>

                                      {payment.txSignature && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            payment?.txSignature &&
                                            copyToClipboard(
                                              payment.txSignature.toString()
                                            )
                                          }
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <a
                                        href={`https://explorer.solana.com/address/${payment.txSignature.toString()}?cluster=${config.rpcEndpoint === "http://127.0.0.1:8899" ? "custom" : "devnet"}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline ml-1"
                                      >
                                        <ExternalLink className="h-3 w-3 inline" />
                                      </a>
                                    </span>
                                  ) : (
                                    <span className="ml-1 text-white/40">
                                      -
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-white/50 p-2 bg-white/5 rounded">
                        No payments processed yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Payment AlertDialog (outside DropdownMenu) */}
      <AlertDialog
        open={!!cancelingPayment}
        onOpenChange={(open) => {
          if (!open) setCancelingPayment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this payment schedule? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={cancelLoading}
                onClick={async () => {
                  if (cancelingPayment)
                    await onCancelSchedule(cancelingPayment);
                }}
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
