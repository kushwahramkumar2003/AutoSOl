"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Handshake,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Eye,
  Sparkles,
  FileCheck,
  CalendarRange,
} from "lucide-react";

/* ── Commitment lifecycle timeline ────────────────────────────────────── */
function CommitmentTimeline() {
  const stages = [
    {
      label: "Proposed",
      icon: <FileText className="h-3.5 w-3.5" />,
      color: "#3b82f6",
      status: "done",
    },
    {
      label: "Reviewed",
      icon: <Eye className="h-3.5 w-3.5" />,
      color: "#9945FF",
      status: "done",
    },
    {
      label: "Accepted",
      icon: <Handshake className="h-3.5 w-3.5" />,
      color: "#26A17B",
      status: "done",
    },
    {
      label: "Active",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      color: "#F2A52B",
      status: "active",
    },
    {
      label: "Executing",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      color: "#22c55e",
      status: "pending",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">
          Commitment Lifecycle
        </span>
        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          Active
        </span>
      </div>

      {/* Timeline nodes */}
      <div className="flex items-center gap-0">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-1 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  stage.status === "done"
                    ? "border border-white/[0.08] bg-white/[0.06]"
                    : stage.status === "active"
                      ? "border-2 shadow-[0_0_12px_rgba(242,169,43,0.3)]"
                      : "border border-white/[0.04] bg-white/[0.02]"
                }`}
                style={{
                  borderColor:
                    stage.status === "active" ? stage.color + "60" : undefined,
                  backgroundColor:
                    stage.status === "active" ? stage.color + "15" : undefined,
                  color: stage.status === "pending" ? "#475569" : stage.color,
                }}
              >
                {stage.icon}
              </div>
              <span
                className={`text-[9px] font-medium ${
                  stage.status === "pending"
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {stage.label}
              </span>
            </motion.div>
            {i < stages.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
                className={`mx-1 h-px flex-1 origin-left ${
                  stage.status === "done"
                    ? "bg-white/[0.12]"
                    : "bg-white/[0.04]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Contract/Note preview card ───────────────────────────────────────── */
function ContractPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9945FF]/15 text-[#9945FF]">
          <FileCheck className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-white">
            Attached Contract
          </div>
          <div className="text-[9px] text-slate-500">
            contract_retainer_v2.md
          </div>
        </div>
        <div className="ml-auto rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium text-slate-400">
          IPFS
        </div>
      </div>

      {/* Contract summary fields */}
      <div className="space-y-1.5">
        {[
          { label: "Commitment", value: "6-month USDC retainer" },
          { label: "Amount", value: "500 USDC × 6 payments" },
          { label: "Frequency", value: "Monthly" },
          { label: "Start", value: "May 1, 2026" },
        ].map((field, i) => (
          <motion.div
            key={field.label}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.06 }}
            className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5"
          >
            <span className="text-[10px] text-slate-500">{field.label}</span>
            <span className="text-[11px] font-medium text-slate-300">
              {field.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Recipient accept mock ────────────────────────────────────────────── */
function RecipientAcceptMock() {
  const [accepted, setAccepted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.7 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2775CA] text-[9px] font-bold text-white">
          <img
            src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
            alt="USDC"
            className="h-full w-full rounded-full object-cover"
          />
        </div>
        <div>
          <div className="text-[11px] font-medium text-white">
            Contractor Review
          </div>
          <div className="text-[9px] text-slate-500">From: 7xKp…3Qmf</div>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-[10px] leading-relaxed text-slate-400">
        &ldquo;This commitment covers the design retainer for Q3 2026. Please
        review the attached contract and accept to activate the payment
        schedule.&rdquo;
      </div>

      <AnimatePresence mode="wait">
        {!accepted ? (
          <motion.button
            key="accept"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setAccepted(true)}
            className="relative w-full overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative flex items-center justify-center gap-1.5">
              <Handshake className="h-3.5 w-3.5" />
              Accept Commitment
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] py-2 text-xs font-medium text-emerald-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Commitment Accepted — Schedule Activating
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Commitment Payments Section ──────────────────────────────────────── */
export default function CommitmentPayments() {
  const bullets = [
    {
      icon: <FileText className="h-3.5 w-3.5" />,
      text: "Sender creates a formal proposal with payment terms, schedule, and attached contract",
    },
    {
      icon: <Eye className="h-3.5 w-3.5" />,
      text: "Recipient reviews exact amounts, token, timing, and contract note before agreeing",
    },
    {
      icon: <Handshake className="h-3.5 w-3.5" />,
      text: "Bilateral acceptance creates a verifiable on-chain audit trail",
    },
    {
      icon: <Shield className="h-3.5 w-3.5" />,
      text: "Perfect for grants, retainers, scholarships, and service contracts",
    },
  ];

  return (
    <section id="commitments" className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Commitment Payments
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-400">
              Formalize payment agreements with recipient acceptance. Both
              parties review and agree on terms before any money moves —
              creating a transparent, auditable record of mutual commitment.
            </p>

            <div className="mt-6 space-y-3">
              {bullets.map((bullet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08 }}
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

            {/* Mini flow diagram */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-2"
            >
              {["Propose", "Review", "Accept", "Activate", "Execute"].map(
                (step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                        i < 3
                          ? "border border-[#9945FF]/20 bg-[#9945FF]/10 text-[#9945FF]"
                          : i === 3
                            ? "border border-[#F2A52B]/20 bg-[#F2A52B]/10 text-[#F2A52B]"
                            : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {step}
                    </span>
                    {i < 4 && <ArrowRight className="h-3 w-3 text-slate-600" />}
                  </div>
                ),
              )}
            </motion.div>
          </motion.div>

          {/* Right — visual mocks */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-3"
          >
            <CommitmentTimeline />
            <div className="grid gap-3 sm:grid-cols-2">
              <ContractPreview />
              <RecipientAcceptMock />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
