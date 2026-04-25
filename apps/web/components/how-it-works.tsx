"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Wallet,
  CalendarClock,
  Coins,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

/* ── Step illustration card ───────────────────────────────────────────── */
function StepCard({
  step,
  index,
  total,
}: {
  step: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    visual: React.ReactNode;
  };
  index: number;
  total: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex flex-col rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.10] hover:bg-white/[0.035]"
    >
      {/* Step number + icon */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
            style={{ backgroundColor: step.color + "18", color: step.color }}
          >
            {index + 1}
          </div>
          <div className="h-px flex-1 min-w-[40px] bg-white/[0.06]" />
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: step.color + "12", color: step.color }}
        >
          {step.icon}
        </div>
      </div>

      {/* Visual illustration */}
      <div className="mb-4 rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
        {step.visual}
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-white">{step.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
        {step.description}
      </p>

      {/* Connector arrow (not on last) */}
      {index < total - 1 && (
        <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-background">
            <ArrowRight className="h-3 w-3 text-slate-500" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Wallet selection mock ────────────────────────────────────────────── */
function WalletSelectMock() {
  const wallets = [
    { name: "Phantom", icon: "/Phantom-Icon_Circle.svg", color: "#AB9FF2", active: true },
    { name: "Solflare", icon: "/solflare-logo.svg", color: "#FC8C1C", active: false },
    { name: "Backpack", icon: "https://backpack.app/favicon.ico", color: "#E33E3F", active: false },
  ];
  return (
    <div className="space-y-1.5">
      {wallets.map((w, i) => (
        <motion.div
          key={w.name}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.08 }}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
            w.active
              ? "border border-white/[0.10] bg-white/[0.04]"
              : "border border-white/[0.04] bg-white/[0.015]"
          }`}
        >
          <div
            className="h-5 w-5 shrink-0 overflow-hidden rounded-md"
            style={!w.icon ? { backgroundColor: w.color + "30" } : undefined}
          >
            {w.icon ? (
              <Image
                src={w.icon}
                alt={w.name}
                width={20}
                height={20}
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
          <span className="flex-1 text-xs text-slate-300">{w.name}</span>
          {w.active && (
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ── Schedule config mock ─────────────────────────────────────────────── */
function ScheduleConfigMock() {
  return (
    <div className="space-y-2">
      {[
        { label: "Recipient", value: "5xKp…9Nmf" },
        { label: "Amount", value: "2.5 SOL" },
        { label: "Frequency", value: "Weekly" },
        { label: "Payments", value: "4" },
      ].map((field, i) => (
        <motion.div
          key={field.label}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.06 }}
          className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5"
        >
          <span className="text-[10px] text-slate-500">{field.label}</span>
          <span className="text-[11px] font-medium text-slate-300">
            {field.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Vault funding mock ───────────────────────────────────────────────── */
function VaultFundMock() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9945FF] text-[9px] font-bold text-white">
            ◎
          </div>
          <span className="text-xs text-white">10.0 SOL</span>
        </div>
        <span className="text-[10px] text-emerald-400">Funded</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-emerald-400/60"
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>Required: 10 SOL</span>
        <span>Deposited: 10 SOL</span>
      </div>
    </div>
  );
}

/* ── Execution status mock ────────────────────────────────────────────── */
function ExecutionStatusMock() {
  const payments = [
    { id: "#1", status: "done" },
    { id: "#2", status: "done" },
    { id: "#3", status: "active" },
    { id: "#4", status: "pending" },
  ];
  return (
    <div className="flex gap-2">
      {payments.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.12 }}
          className={`flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 ${
            p.status === "done"
              ? "border-emerald-500/20 bg-emerald-500/[0.06]"
              : p.status === "active"
              ? "border-primary/30 bg-primary/[0.08]"
              : "border-white/[0.06] bg-white/[0.02]"
          }`}
        >
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              p.status === "done"
                ? "bg-emerald-400"
                : p.status === "active"
                ? "bg-primary"
                : "bg-slate-600"
            }`}
          />
          <span className="text-[10px] text-slate-400">{p.id}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── HowItWorks ───────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const steps = [
    {
      icon: <Wallet className="h-4 w-4" />,
      title: "Connect Wallet",
      description:
        "One-click connection with Phantom, Solflare, Backpack, or any Solana wallet.",
      color: "#AB9FF2",
      visual: <WalletSelectMock />,
    },
    {
      icon: <CalendarClock className="h-4 w-4" />,
      title: "Configure Schedule",
      description:
        "Set recipient, token, amount, frequency, and number of payments.",
      color: "#3b82f6",
      visual: <ScheduleConfigMock />,
    },
    {
      icon: <Coins className="h-4 w-4" />,
      title: "Fund Vault",
      description:
        "Deposit funds into a PDA-based on-chain vault. Fully transparent and auditable.",
      color: "#26A17B",
      visual: <VaultFundMock />,
    },
    {
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Auto Execute",
      description:
        "Payments execute on schedule. Track every execution from your dashboard.",
      color: "#F2A52B",
      visual: <ExecutionStatusMock />,
    },
  ];

  return (
    <section id="how-it-works" className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Inline heading — blends with flow instead of being a section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 max-w-xl"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            From wallet to execution in four steps
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Connect, configure, fund, and let the system handle the rest.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} total={steps.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
