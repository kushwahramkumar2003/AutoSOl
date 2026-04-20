"use client";

import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight, ArrowUpRight, Clock, Download,
  Search, Copy, ExternalLink, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import config from "@/config";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import { useProgram } from "@/hooks/use-program";
import { fetchTransactionsResilient } from "@/lib/resilient-data";
import { formatRawTokenAmount } from "@/lib/token-registry";

interface Transaction {
  id: string;
  scheduleId: string;
  paymentIndex: number;
  amount: number;
  token: string;
  mint: string;
  isSol: boolean;
  recipient: string;
  executedAt: string;
  executedBy: string;
  signature: string;
  isIncoming: boolean;
  scheduleOwner: string;
  scheduleStatus: string;
  memo: string;
}

export default function TransactionsPage() {
  const wallet = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchTxs = useCallback(async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const result = await fetchTransactionsResilient(
        wallet.publicKey,
        program
      );
      setTransactions(result.data);
      setDataNotice(result.notice);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);

  // Filter + search
  const filteredTxs = useMemo(() => {
    let txs = transactions;
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter((t) =>
        t.recipient.toLowerCase().includes(q) ||
        t.executedBy.toLowerCase().includes(q) ||
        t.memo?.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") txs = txs.filter((t) => filterType === "incoming" ? t.isIncoming : !t.isIncoming);
    if (filterStatus !== "all") {
      txs = txs.filter((t) => {
        if (filterStatus === "cancelled") return t.scheduleStatus === "cancelled";
        return filterStatus === "completed";
      });
    }
    return txs;
  }, [transactions, search, filterType, filterStatus]);

  const pagedTxs = useMemo(() => filteredTxs.slice((page - 1) * pageSize, page * pageSize), [filteredTxs, page]);

  const formatAmount = (tx: Transaction) =>
    formatRawTokenAmount(tx.amount, tx.mint, tx.isSol);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const truncAddr = (a: string) => a.length > 8 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;

  const exportToExcel = async () => {
    if (filteredTxs.length === 0) { toast.error("No data"); return; }
    setIsExporting(true);
    try {
      const rows = filteredTxs.map((t) => ({
        Type: t.isIncoming ? "Incoming" : "Outgoing",
        Amount: `${t.isIncoming ? "+" : "-"}${formatAmount(t)} ${t.token}`,
        Recipient: t.recipient,
        Schedule: t.scheduleId,
        Date: fmtDate(t.executedAt),
        Status: t.scheduleStatus,
        Executor: t.executedBy,
        Signature: t.signature,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Transactions");
      XLSX.writeFile(wb, `transactions_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Exported ${filteredTxs.length} transactions`);
    } catch { toast.error("Export failed"); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />

      <div className="app-page page-stack flex-1">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-white">{filteredTxs.length} transactions</span>
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-white/[0.03] text-xs hover:bg-white/[0.06]"
            onClick={exportToExcel} disabled={isExporting || filteredTxs.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1" />
            {isExporting ? "Exporting…" : "Export"}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {dataNotice && (
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs text-slate-400">
              {dataNotice}
            </div>
          )}
          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Search…" className="field-surface h-9 pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"} size="sm"
                className={cn("rounded-xl text-xs", filterType === "all" ? "bg-primary hover:bg-primary/90" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")}
                onClick={() => setFilterType(filterType === "all" ? "outgoing" : filterType === "outgoing" ? "incoming" : "all")}
              >
                <Filter className="h-3 w-3 mr-1" />
                {filterType === "all" ? "All" : filterType === "outgoing" ? "Outgoing" : "Incoming"}
              </Button>
              <Button
                variant={filterStatus === "all" ? "default" : "outline"} size="sm"
                className={cn("rounded-xl text-xs", filterStatus === "all" ? "bg-primary hover:bg-primary/90" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")}
                onClick={() => setFilterStatus(filterStatus === "all" ? "completed" : filterStatus === "completed" ? "cancelled" : "all")}
              >
                <Clock className="h-3 w-3 mr-1" />
                {filterStatus === "all" ? "All Status" : filterStatus === "completed" ? "Completed" : "Cancelled"}
              </Button>
            </div>
          </div>

          {/* Data */}
          <div className="mobile-scroll">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="hover:bg-transparent border-white/[0.06]">
                  <TableHead className="text-slate-500 text-xs">Type</TableHead>
                  <TableHead className="text-slate-500 text-xs">Amount</TableHead>
                  <TableHead className="text-slate-500 text-xs">Recipient</TableHead>
                  <TableHead className="text-slate-500 text-xs">Date</TableHead>
                  <TableHead className="text-slate-500 text-xs">Status</TableHead>
                  <TableHead className="text-slate-500 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full bg-white/[0.04]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pagedTxs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedTxs.map((tx) => {
                    const cancelled = tx.scheduleStatus === "cancelled";
                    return (
                      <TableRow key={tx.id} className={cn("border-white/[0.04] transition-colors hover:bg-white/[0.02]", cancelled && "opacity-50")}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg border",
                              tx.isIncoming
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-white/[0.04] border-white/[0.08] text-slate-300"
                            )}>
                              {tx.isIncoming ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                            </div>
                            <span className="text-sm capitalize">{tx.isIncoming ? "In" : "Out"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-white">
                            {tx.isIncoming ? "+" : "−"}{formatAmount(tx)} {tx.token}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-white">{truncAddr(tx.recipient)}</div>
                          <div className="text-[11px] text-slate-500">{truncAddr(tx.scheduleId)}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-300">{fmtDate(tx.executedAt)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("border text-[10px] capitalize",
                            cancelled
                              ? "bg-red-500/10 text-red-400 border-red-500/20 line-through"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          )}>
                            {cancelled ? "cancelled" : "completed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {tx.signature && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}?cluster=${config.rpcEndpoint === "http://127.0.0.1:8899" ? "custom" : "devnet"}`, "_blank")}>
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-white/[0.06] hover:text-white"
                              onClick={() => { navigator.clipboard.writeText(tx.signature || tx.executedBy); toast.success("Copied"); }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
            <span className="text-[11px] text-slate-500">{pagedTxs.length} of {filteredTxs.length}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 rounded-lg border-white/[0.08] bg-white/[0.02] px-3 text-[11px] hover:bg-white/[0.06]"
                disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button variant="outline" size="sm" className="h-7 rounded-lg border-white/[0.08] bg-white/[0.02] px-3 text-[11px] hover:bg-white/[0.06]"
                disabled={page * pageSize >= filteredTxs.length} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
