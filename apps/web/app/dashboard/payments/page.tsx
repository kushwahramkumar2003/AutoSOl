"use client";

import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal, Plus, Search, Clock, AlertCircle, RefreshCw, Eye, Trash2,
  Copy, ExternalLink, Pause, Play, CheckCircle, XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProgram } from "@/hooks/use-program";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import config from "@/config";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { fetchSchedulesResilient } from "@/lib/resilient-data";
import { formatRawTokenAmount } from "@/lib/token-registry";

type FilterType = "all" | "active" | "completed" | "cancelled";
type SortType = "newest" | "oldest" | "amount_high" | "amount_low";

// BE-sourced schedule type (no Anchor BN)
interface Schedule {
  id: string;
  owner: string;
  recipient: string;
  token: string;
  mint: string;
  isSol: boolean;
  totalAmount: number;
  paymentAmount: number;
  feeAmount: number;
  paymentCount: number;
  paymentsExecuted: number;
  remainingAmount: number;
  status: string;
  createdAt: string;
  memo: string;
}

export default function PaymentsPage() {
  const { program } = useProgram();
  const wallet = useWallet();
  const router = useRouter();
  const [payments, setPayments] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [selectedPayment, setSelectedPayment] = useState<Schedule | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cancelingPayment, setCancelingPayment] = useState<Schedule | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [dataNotice, setDataNotice] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const result = await fetchSchedulesResilient(wallet.publicKey, program);
      setPayments(result.data);
      setDataNotice(result.notice);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      toast.error("Failed to load payment schedules");
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Helpers
  const truncAddr = (a: string) => a.length > 8 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
  const formatAmount = (value: number, schedule: Schedule) =>
    formatRawTokenAmount(value, schedule.mint, schedule.isSol);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const copyTo = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copied"); };
  const getProgress = (p: Schedule) => {
    const total = p.totalAmount;
    const remaining = p.remainingAmount;
    return total > 0 ? ((total - remaining) / total) * 100 : 0;
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-primary/10 text-primary border-primary/20";
      case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "cancelled": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-white/[0.04] text-slate-400 border-white/[0.08]";
    }
  };
  const statusIcon = (s: string) => {
    switch (s) {
      case "active": return <Play className="h-3 w-3" />;
      case "completed": return <CheckCircle className="h-3 w-3" />;
      case "cancelled": return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Filter + sort
  const filtered = useMemo(() => {
    let list = payments;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) => p.recipient.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.memo.toLowerCase().includes(q));
    }
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    list.sort((a, b) => {
      switch (sort) {
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount_high": return b.totalAmount - a.totalAmount;
        case "amount_low": return a.totalAmount - b.totalAmount;
        default: return 0;
      }
    });
    return list;
  }, [payments, searchTerm, filter, sort]);

  const stats = useMemo(() => ({
    total: payments.length,
    active: payments.filter((p) => p.status === "active").length,
    completed: payments.filter((p) => p.status === "completed").length,
  }), [payments]);

  // Cancel (still uses on-chain program)
  const onCancelSchedule = async (payment: Schedule) => {
    if (cancelLoading || !program) {
      toast.error("Program not ready. Connect your wallet.");
      return;
    }
    setCancelLoading(true);
    try {
      const tx = await program.cancelSchedule(new PublicKey(payment.id));
      toast.success("Schedule cancelled!", {
        description: tx ? (
          <a href={`https://explorer.solana.com/tx/${tx}?cluster=${config.rpcEndpoint === "http://127.0.0.1:8899" ? "custom" : "devnet"}`}
            target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
            View on Explorer
          </a>
        ) : undefined,
      });
      setCancelingPayment(null);
      fetchPayments();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Failed to cancel.", { description: error?.message });
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />

      <div className="app-page page-stack flex-1">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" onClick={fetchPayments} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-white">{stats.total} schedules</span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{stats.active} active</span>
              <span className="rounded-md bg-white/[0.03] px-2 py-0.5 text-xs text-slate-500">{stats.completed} done</span>
            </div>
          </div>
          <Button size="sm" className="rounded-xl bg-primary text-xs hover:bg-primary/90" onClick={() => router.push("/dashboard/payments/new")}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New Payment
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Search…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="field-surface h-9 pl-10 text-sm focus-visible:ring-primary/40" />
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(v: FilterType) => setFilter(v)}>
                <SelectTrigger className="field-surface h-9 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v: SortType) => setSort(v)}>
                <SelectTrigger className="field-surface h-9 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="amount_high">Amount ↓</SelectItem>
                  <SelectItem value="amount_low">Amount ↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dataNotice && (
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs text-slate-400">
              {dataNotice}
            </div>
          )}

          {/* Data */}
          <div className="mobile-scroll">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="hover:bg-transparent border-white/[0.06]">
                  <TableHead className="text-slate-500 text-xs">Recipient</TableHead>
                  <TableHead className="text-slate-500 text-xs">Amount</TableHead>
                  <TableHead className="text-slate-500 text-xs">Progress</TableHead>
                  <TableHead className="text-slate-500 text-xs">Status</TableHead>
                  <TableHead className="text-slate-500 text-xs">Created</TableHead>
                  <TableHead className="text-slate-500 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full bg-white/[0.04]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <AlertCircle className="mx-auto h-6 w-6 text-slate-600" />
                      <p className="mt-2 text-sm text-slate-500">No schedules found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="font-medium text-sm text-white">{truncAddr(p.recipient)}</div>
                        <div className="text-[11px] text-slate-500">{truncAddr(p.id)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-white">{formatAmount(p.totalAmount, p)} {p.token}</div>
                        <div className="text-[11px] text-slate-500">{formatAmount(p.paymentAmount, p)} per tx</div>
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-[100px]">
                          <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                            <span>{getProgress(p).toFixed(0)}%</span>
                            <span>{p.paymentsExecuted}/{p.paymentCount}</span>
                          </div>
                          <Progress value={getProgress(p)} className="h-1.5 bg-white/[0.06]" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border text-[10px] capitalize gap-1", statusColor(p.status))}>
                          {statusIcon(p.status)}
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-300">{fmtDate(p.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/[0.06]">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-white/10 bg-[#0a0a0a] text-white min-w-[140px]">
                            <DropdownMenuItem className="text-xs cursor-pointer hover:bg-white/[0.06]" onClick={() => { setSelectedPayment(p); setShowDetails(true); }}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs cursor-pointer hover:bg-white/[0.06]" onClick={() => copyTo(p.id)}>
                              <Copy className="h-3.5 w-3.5 mr-2" /> Copy Address
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs cursor-pointer hover:bg-white/[0.06]" onClick={() => copyTo(p.recipient)}>
                              <Copy className="h-3.5 w-3.5 mr-2" /> Copy Recipient
                            </DropdownMenuItem>
                            {p.status === "active" && (
                              <>
                                <DropdownMenuSeparator className="bg-white/[0.06]" />
                                <DropdownMenuItem className="text-xs cursor-pointer text-red-400 hover:bg-red-500/10" onClick={() => setCancelingPayment(p)}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Cancel
                                </DropdownMenuItem>
                              </>
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

          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
            <span className="text-[11px] text-slate-500">
              {filtered.length} of {payments.length} schedules
            </span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="border-white/[0.08] bg-[#0a0a0a] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
            <DialogDescription className="text-slate-500">
              {selectedPayment && truncAddr(selectedPayment.id)}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Recipient</span><span className="text-white font-mono text-xs">{truncAddr(selectedPayment.recipient)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white">{formatAmount(selectedPayment.totalAmount, selectedPayment)} {selectedPayment.token}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Per Payment</span><span className="text-white">{formatAmount(selectedPayment.paymentAmount, selectedPayment)} {selectedPayment.token}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Progress</span><span className="text-white">{selectedPayment.paymentsExecuted} / {selectedPayment.paymentCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status</span>
                <Badge className={cn("border text-[10px] capitalize", statusColor(selectedPayment.status))}>{selectedPayment.status}</Badge>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Created</span><span className="text-slate-300">{fmtDate(selectedPayment.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Fee</span><span className="text-slate-300">{formatAmount(selectedPayment.feeAmount, selectedPayment)} {selectedPayment.token}</span></div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl border-white/[0.08] text-xs"
                  onClick={() => window.open(`https://explorer.solana.com/address/${selectedPayment.id}?cluster=devnet`, "_blank")}>
                  Explorer <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="flex-1 rounded-xl border-white/[0.08] text-xs" onClick={() => copyTo(selectedPayment.id)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelingPayment} onOpenChange={() => setCancelingPayment(null)}>
        <AlertDialogContent className="border-white/[0.08] bg-[#0a0a0a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Schedule</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will cancel the schedule and return remaining funds. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/[0.08] text-xs">Keep</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-500 text-xs hover:bg-red-600"
              disabled={cancelLoading} onClick={() => cancelingPayment && onCancelSchedule(cancelingPayment)}>
              {cancelLoading ? "Cancelling…" : "Cancel Schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
