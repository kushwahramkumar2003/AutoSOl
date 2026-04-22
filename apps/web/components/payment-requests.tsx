"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  DollarSign,
  CalendarClock,
  Inbox,
  ThumbsUp,
  Zap,
} from "lucide-react";

/* ── Invoice / Request Card Mock ──────────────────────────────────────── */
function RequestCard({
  from,
  amount,
  token,
  tokenIcon,
  tokenColor,
  frequency,
  memo,
  status,
  delay,
}: {
  from: string;
  amount: string;
  token: string;
  tokenIcon: string;
  tokenColor: string;
  frequency: string;
  memo: string;
  status: "pending" | "approved" | "declined";
  delay: number;
}) {
  const statusMap = {
    pending: {
      label: "Pending Approval",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    approved: {
      label: "Approved",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    declined: {
      label: "Declined",
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  };

  const s = statusMap[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-slate-300">
            <User className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-white">{from}</div>
            <div className="text-[9px] text-slate-500">Requested payment</div>
          </div>
        </div>
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.color}`}
        >
          {s.label}
        </span>
      </div>

      {/* Details */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5">
          <span className="text-[10px] text-slate-500">Amount</span>
          <div className="flex items-center gap-1.5">
            <img
              src={tokenIcon}
              alt={token}
              className="h-3.5 w-3.5 rounded-full object-cover"
            />
            <span className="text-[11px] font-medium text-white">
              {amount} {token}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5">
          <span className="text-[10px] text-slate-500">Frequency</span>
          <span className="text-[11px] font-medium text-slate-300">
            {frequency}
          </span>
        </div>
      </div>

      {/* Memo */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-[10px] leading-relaxed text-slate-400">
        {memo}
      </div>

      {/* Actions (for pending) */}
      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <div className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-1.5 text-[10px] font-medium text-emerald-400">
            <ThumbsUp className="h-3 w-3" />
            Approve
          </div>
          <div className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 text-[10px] font-medium text-slate-500">
            <XCircle className="h-3 w-3" />
            Decline
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Request-to-Schedule Flow Diagram ─────────────────────────────────── */
function RequestFlowDiagram() {
  const steps = [
    {
      icon: <Send className="h-3 w-3" />,
      label: "Requester\nCreates",
      color: "#3b82f6",
    },
    {
      icon: <Inbox className="h-3 w-3" />,
      label: "Payer\nReviews",
      color: "#9945FF",
    },
    {
      icon: <ThumbsUp className="h-3 w-3" />,
      label: "Payer\nApproves",
      color: "#26A17B",
    },
    {
      icon: <DollarSign className="h-3 w-3" />,
      label: "Schedule\nFunded",
      color: "#F2A52B",
    },
    {
      icon: <Zap className="h-3 w-3" />,
      label: "Auto\nExecute",
      color: "#22c55e",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
    >
      <div className="mb-3 text-xs font-semibold text-white">
        Request → Schedule Flow
      </div>
      <div className="flex items-start gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-1 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08]"
                style={{
                  backgroundColor: step.color + "15",
                  color: step.color,
                }}
              >
                {step.icon}
              </div>
              <span className="whitespace-pre-wrap text-center text-[8px] font-medium leading-tight text-slate-500">
                {step.label}
              </span>
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                className="mx-0.5 mt-4 h-px flex-1 origin-left bg-white/[0.08]"
              />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Status tracker cards ─────────────────────────────────────────────── */
function RequestStatusTracker() {
  const statuses = [
    {
      label: "Pending",
      count: 3,
      color: "#f59e0b",
      icon: <Clock className="h-3 w-3" />,
    },
    {
      label: "Approved",
      count: 12,
      color: "#22c55e",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    {
      label: "Declined",
      count: 1,
      color: "#ef4444",
      icon: <XCircle className="h-3 w-3" />,
    },
    {
      label: "Active",
      count: 8,
      color: "#3b82f6",
      icon: <Zap className="h-3 w-3" />,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {statuses.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + i * 0.08 }}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ backgroundColor: s.color + "15", color: s.color }}
          >
            {s.icon}
          </div>
          <span className="text-base font-semibold text-white">{s.count}</span>
          <span className="text-[9px] text-slate-500">{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Payment Requests Section ─────────────────────────────────────────── */
export default function PaymentRequests() {
  const bullets = [
    {
      icon: <Receipt className="h-3.5 w-3.5" />,
      text: "Payees create structured billing requests with exact schedule terms",
    },
    {
      icon: <User className="h-3.5 w-3.5" />,
      text: "Payers review, approve or decline — always in full control until acceptance",
    },
    {
      icon: <CalendarClock className="h-3.5 w-3.5" />,
      text: "Approved requests automatically convert into funded recurring schedules",
    },
    {
      icon: <Zap className="h-3.5 w-3.5" />,
      text: "Ideal for SaaS subscriptions, freelancer invoicing, DAO stipends, and B2B billing",
    },
  ];

  return (
    <section id="payment-requests" className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — visual mocks */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 space-y-3 lg:order-1"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <RequestCard
                from="DesignStudio.sol"
                amount="250"
                token="USDC"
                tokenIcon="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                tokenColor="#2775CA"
                frequency="Monthly × 12"
                memo="Design retainer for product UI/UX support, Q3–Q4 2026."
                status="pending"
                delay={0.2}
              />
              <RequestCard
                from="CloudHost Inc."
                amount="89"
                token="USDT"
                tokenIcon="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg"
                tokenColor="#26A17B"
                frequency="Monthly"
                memo="Server infrastructure subscription — auto-renews."
                status="approved"
                delay={0.3}
              />
            </div>
            <RequestFlowDiagram />
            <RequestStatusTracker />
          </motion.div>

          {/* Right — text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Payment Requests
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-400">
              Let payees initiate structured billing — you stay in control.
              Service providers create requests with exact terms, and payers
              approve at their discretion. Once accepted, the schedule funds and
              executes automatically.
            </p>

            <div className="mt-6 space-y-3">
              {bullets.map((bullet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-300">
                    {bullet.icon}
                  </div>
                  <span className="text-sm leading-relaxed text-slate-400">
                    {bullet.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Comparison callout */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="mb-2 text-[11px] font-medium text-slate-300">
                Traditional Invoice vs. AutoSOL Request
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3 text-center">
                  <div className="text-[10px] text-slate-500">Traditional</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-slate-400">
                    Static PDF → Manual follow-up → Manual transfer each cycle
                  </div>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/[0.05] p-3 text-center">
                  <div className="text-[10px] text-primary">AutoSOL</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-slate-300">
                    Structured request → One-click approve → Auto-execute
                    forever
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
