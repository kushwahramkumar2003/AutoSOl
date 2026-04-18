"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink, Zap, Shield, Layers, Clock, DollarSign, Activity } from "lucide-react";

/* ── Architecture diagram ─────────────────────────────────────────────── */
function ArchitectureDiagram() {
  const nodes = [
    { label: "Solana Program", sub: "Anchor / Rust", color: "#9945FF", col: 0 },
    { label: "Monitor", sub: "Event Listener", color: "#3b82f6", col: 1 },
    { label: "Redis", sub: "Event Stream", color: "#E84142", col: 2 },
    { label: "Worker", sub: "DB Sync", color: "#F2A52B", col: 3 },
    { label: "Executor", sub: "Cron Runner", color: "#26A17B", col: 4 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex flex-1 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex w-full flex-col items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.025] p-2.5"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-[10px] font-medium text-slate-300">
                {node.label}
              </span>
              <span className="text-[9px] text-slate-600">{node.sub}</span>
            </motion.div>
            {i < nodes.length - 1 && (
              <div className="mx-1 h-px w-3 shrink-0 bg-white/[0.08]" />
            )}
          </div>
        ))}
      </div>
      {/* Data flow labels */}
      <div className="flex items-center gap-2 px-2">
        {["Deploy", "Events", "Stream", "Persist", "Execute"].map((label, i) => (
          <motion.span
            key={label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className="flex-1 text-center text-[9px] text-slate-600"
          >
            {label} →
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ── Benchmark comparison ─────────────────────────────────────────────── */
function BenchmarkVisual() {
  const benchmarks = [
    {
      label: "AutoSOL (Solana)",
      speed: "400ms",
      cost: "$0.0005",
      barSpeed: 98,
      barCost: 99,
      highlight: true,
    },
    {
      label: "Ethereum",
      speed: "15s",
      cost: "$5–$20",
      barSpeed: 12,
      barCost: 8,
      highlight: false,
    },
    {
      label: "Polygon",
      speed: "2s",
      cost: "$0.01",
      barSpeed: 60,
      barCost: 85,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-3">
      {benchmarks.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={`rounded-xl border p-3 ${
            b.highlight
              ? "border-primary/20 bg-primary/[0.04]"
              : "border-white/[0.04] bg-white/[0.015]"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-xs font-medium ${b.highlight ? "text-white" : "text-slate-400"}`}>
              {b.label}
            </span>
            <div className="flex gap-3">
              <span className="text-[10px] text-slate-500">
                <Clock className="mr-0.5 inline h-3 w-3" />
                {b.speed}
              </span>
              <span className="text-[10px] text-slate-500">
                <DollarSign className="mr-0.5 inline h-3 w-3" />
                {b.cost}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                <motion.div
                  className={`h-full rounded-full ${b.highlight ? "bg-primary" : "bg-slate-600"}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.barSpeed}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                <motion.div
                  className={`h-full rounded-full ${b.highlight ? "bg-emerald-400/70" : "bg-slate-600"}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.barCost}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      <div className="flex gap-2 px-3">
        <span className="flex-1 text-center text-[9px] text-slate-600">Speed</span>
        <span className="flex-1 text-center text-[9px] text-slate-600">Cost Efficiency</span>
      </div>
    </div>
  );
}

/* ── Technical section ────────────────────────────────────────────────── */
export default function TechnicalHighlights() {
  const [activeTab, setActiveTab] = useState<"speed" | "security" | "architecture">("speed");

  const tabs = [
    { key: "speed" as const, label: "Speed", icon: <Zap className="h-3.5 w-3.5" /> },
    { key: "security" as const, label: "Security", icon: <Shield className="h-3.5 w-3.5" /> },
    { key: "architecture" as const, label: "Architecture", icon: <Layers className="h-3.5 w-3.5" /> },
  ];

  const content = {
    speed: {
      title: "Sub-second payments, near-zero cost",
      points: [
        "400ms average confirmation time",
        "< $0.001 per transaction",
        "Parallel instruction batching",
        "Optimized Anchor CPI calls",
      ],
      visual: <BenchmarkVisual />,
    },
    security: {
      title: "Non-custodial, authority-gated",
      points: [
        "PDA-derived vault accounts per schedule",
        "Authority-gated executor key validation",
        "On-chain fee capped at 5% maximum",
        "Owner-only cancel with full refund",
      ],
      visual: (
        <div className="space-y-2">
          {[
            { label: "Vault Derivation", detail: "PDA seeds: [owner, schedule_id]", color: "#9945FF" },
            { label: "Executor Check", detail: "Signer must match config authority", color: "#3b82f6" },
            { label: "Fee Validation", detail: "On-chain cap enforced (max 5%)", color: "#26A17B" },
            { label: "Cancel & Refund", detail: "Owner-only, remaining SOL/SPL returned", color: "#F2A52B" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
            >
              <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <div className="text-[11px] font-medium text-slate-300">{item.label}</div>
                <div className="text-[10px] text-slate-600">{item.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
      ),
    },
    architecture: {
      title: "Event-driven microservice pipeline",
      points: [
        "Rust-based blockchain monitor for events",
        "Redis streams for reliable delivery",
        "Worker service for DB synchronization",
        "Separate executor with cron scheduling",
      ],
      visual: <ArchitectureDiagram />,
    },
  };

  const active = content[activeTab];

  return (
    <section id="technical" className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Left panel — tab content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 lg:col-span-2"
          >
            {/* Tab bar */}
            <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              {active.title}
            </h3>

            <ul className="mt-4 space-y-2">
              {active.points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.03] text-sm text-white hover:bg-white/[0.06]"
              >
                View Docs
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>

          {/* Right panel — visual + stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4 lg:col-span-3"
          >
            {/* Visual */}
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
              {active.visual}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Clock className="h-4 w-4 text-primary" />, value: "400ms", label: "Avg. Confirmation" },
                { icon: <DollarSign className="h-4 w-4 text-emerald-400" />, value: "$0.0005", label: "Avg. Tx Cost" },
                { icon: <Activity className="h-4 w-4 text-[#F2A52B]" />, value: "99.9%", label: "Execution Uptime" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="mb-2">{stat.icon}</div>
                  <div className="text-xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
