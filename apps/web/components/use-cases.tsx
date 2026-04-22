"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Briefcase,
  CreditCard,
  Palette,
  Heart,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Repeat,
  DollarSign,
  FileText,
  Send,
  Zap,
} from "lucide-react";

/* ── Treasury dashboard mock ──────────────────────────────────────────── */
function TreasuryMock() {
  const streams = [
    { label: "Contributor Stipends", token: "USDC", amount: "3,200", status: "active", color: "#2775CA" },
    { label: "Infrastructure", token: "SOL", amount: "12.5", status: "active", color: "#9945FF" },
    { label: "Grant Payout #7", token: "USDC", amount: "1,500", status: "scheduled", color: "#2775CA" },
    { label: "Marketing Budget", token: "USDT", amount: "800", status: "active", color: "#26A17B" },
  ];

  return (
    <div className="space-y-3">
      {/* Mini calendar grid */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium text-white">Payment Calendar</span>
          <span className="text-[9px] text-slate-500">April 2026</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="flex h-5 items-center justify-center text-[8px] text-slate-600">
              {d}
            </div>
          ))}
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
            const hasPayment = [1, 5, 10, 15, 20, 25].includes(day);
            return (
              <div
                key={day}
                className={`flex h-5 items-center justify-center rounded-md text-[8px] ${
                  hasPayment
                    ? "border border-primary/30 bg-primary/10 text-primary font-medium"
                    : "text-slate-600"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment streams */}
      <div className="space-y-1.5">
        {streams.map((stream, i) => (
          <motion.div
            key={stream.label}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stream.color }} />
              <span className="text-[10px] text-slate-300">{stream.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-white">{stream.amount} {stream.token}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${
                  stream.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {stream.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Active Streams", value: "14" },
          { label: "Monthly Volume", value: "$18.4K" },
          { label: "Commitments", value: "6" },
        ].map((stat, i) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-2 text-center">
            <div className="text-xs font-semibold text-white">{stat.value}</div>
            <div className="text-[8px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Freelancer invoicing mock ────────────────────────────────────────── */
function FreelancerMock() {
  return (
    <div className="space-y-3">
      {/* Invoice list */}
      <div className="space-y-1.5">
        {[
          { client: "TechCorp DAO", amount: "2,500 USDC", period: "Monthly retainer", status: "paid", statusColor: "text-emerald-400 bg-emerald-500/10" },
          { client: "CreatorLabs", amount: "800 USDC", period: "Biweekly design", status: "active", statusColor: "text-primary bg-primary/10" },
          { client: "SolanaFi", amount: "1,200 USDT", period: "Monthly consulting", status: "pending", statusColor: "text-amber-400 bg-amber-500/10" },
        ].map((inv, i) => (
          <motion.div
            key={inv.client}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-slate-300">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-medium text-white">{inv.client}</div>
              <div className="text-[9px] text-slate-500">{inv.period}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium text-white">{inv.amount}</div>
              <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${inv.statusColor}`}>
                {inv.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment timeline */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
        <div className="mb-2 text-[10px] font-medium text-white">Payment Timeline</div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-6 w-full rounded-sm ${
                  i < 5 ? "bg-emerald-500/20" : i === 5 ? "bg-primary/20" : "bg-white/[0.04]"
                }`}
                style={{ height: [24, 20, 28, 22, 26, 18, 10, 10][i] }}
              />
              <span className="text-[7px] text-slate-600">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings summary */}
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] text-emerald-400">Total recurring income: <span className="font-semibold text-white">$4,500/mo</span></span>
      </div>
    </div>
  );
}

/* ── SaaS subscription mock ───────────────────────────────────────────── */
function SaaSMock() {
  return (
    <div className="space-y-3">
      {/* Subscription card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white">Customer Subscriptions</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">Live</span>
        </div>

        {[
          { name: "Acme Corp", plan: "Enterprise", amount: "499 USDC/mo", active: true },
          { name: "StartupXYZ", plan: "Pro", amount: "99 USDC/mo", active: true },
          { name: "DevTeam", plan: "Team", amount: "49 USDC/mo", active: true },
        ].map((sub, i) => (
          <motion.div
            key={sub.name}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="mb-1.5 flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <div>
                <div className="text-[10px] font-medium text-white">{sub.name}</div>
                <div className="text-[8px] text-slate-500">{sub.plan}</div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-slate-300">{sub.amount}</span>
          </motion.div>
        ))}
      </div>

      {/* Auto-charge flow */}
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
        {["Request Sent", "Customer Approved", "Auto-Charging"].map((step, i) => (
          <div key={step} className="flex flex-1 items-center gap-1.5">
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                i === 2 ? "bg-emerald-400" : "bg-primary"
              }`}
            />
            <span className="text-[8px] text-slate-400">{step}</span>
            {i < 2 && <ArrowRight className="ml-auto h-2.5 w-2.5 text-slate-700" />}
          </div>
        ))}
      </div>

      {/* MRR metric */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-2.5 text-center">
          <div className="text-lg font-semibold text-white">$647</div>
          <div className="text-[8px] text-slate-500">Monthly Recurring Revenue</div>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-2.5 text-center">
          <div className="text-lg font-semibold text-white">100%</div>
          <div className="text-[8px] text-slate-500">Collection Rate</div>
        </div>
      </div>
    </div>
  );
}

/* ── Creator economy mock ─────────────────────────────────────────────── */
function CreatorMock() {
  const milestones = [
    { label: "Kickoff Payment", amount: "500 USDC", done: true },
    { label: "Milestone 1 — Wireframes", amount: "1,000 USDC", done: true },
    { label: "Milestone 2 — Prototype", amount: "1,500 USDC", done: false },
    { label: "Final Delivery", amount: "2,000 USDC", done: false },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white">Sponsorship Commitment</span>
          <span className="rounded-md bg-[#F2A52B]/10 px-2 py-0.5 text-[9px] font-medium text-[#F2A52B]">In Progress</span>
        </div>

        <div className="space-y-1.5">
          {milestones.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2"
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  m.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-slate-600"
                }`}
              >
                {m.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
              </div>
              <div className="flex-1">
                <div className={`text-[10px] font-medium ${m.done ? "text-slate-300" : "text-slate-500"}`}>
                  {m.label}
                </div>
              </div>
              <span className={`text-[10px] font-medium ${m.done ? "text-white" : "text-slate-600"}`}>
                {m.amount}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
        <div className="mb-1.5 flex justify-between text-[9px] text-slate-500">
          <span>Commitment Progress</span>
          <span>50% Complete</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#F2A52B] to-emerald-400"
            initial={{ width: 0 }}
            whileInView={{ width: "50%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Personal mock ────────────────────────────────────────────────────── */
function PersonalMock() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9945FF]/15 text-[#9945FF]">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-white">Family Support</div>
            <div className="text-[10px] text-slate-500">Recurring transfer</div>
          </div>
        </div>

        <div className="space-y-1.5">
          {[
            { label: "Recipient", value: "Mom · 5xKp…9Nmf" },
            { label: "Amount", value: "1.0 SOL" },
            { label: "Frequency", value: "Weekly" },
            { label: "Next Payment", value: "Apr 28, 2026" },
            { label: "Remaining", value: "8 of 12 payments" },
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5">
              <span className="text-[10px] text-slate-500">{f.label}</span>
              <span className="text-[10px] font-medium text-slate-300">{f.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400">4 payments completed · On schedule</span>
        </div>
      </div>
    </div>
  );
}

/* ── Use Cases Section ────────────────────────────────────────────────── */
export default function UseCases() {
  const tabs = [
    { key: "treasury", label: "Treasury", icon: <Building2 className="h-3.5 w-3.5" /> },
    { key: "freelancer", label: "Freelancer", icon: <Briefcase className="h-3.5 w-3.5" /> },
    { key: "saas", label: "SaaS Business", icon: <CreditCard className="h-3.5 w-3.5" /> },
    { key: "creator", label: "Creator Economy", icon: <Palette className="h-3.5 w-3.5" /> },
    { key: "personal", label: "Personal", icon: <Heart className="h-3.5 w-3.5" /> },
  ] as const;

  type TabKey = (typeof tabs)[number]["key"];
  const [activeTab, setActiveTab] = useState<TabKey>("treasury");

  const tabContent: Record<TabKey, { title: string; description: string; flows: string[]; visual: React.ReactNode }> = {
    treasury: {
      title: "DAO & Treasury Operations",
      description: "Manage contributor stipends, grant disbursements, and infrastructure costs from a single dashboard. Use commitments for contractor obligations and payment requests for vendor proposals.",
      flows: ["Recurring Payments", "Commitments", "Payment Requests"],
      visual: <TreasuryMock />,
    },
    freelancer: {
      title: "Freelancer & Contractor Billing",
      description: "Send recurring billing requests to clients and track payment status across all your engagements. Receive commitment proposals from organizations with formal contract terms.",
      flows: ["Payment Requests", "Commitments"],
      visual: <FreelancerMock />,
    },
    saas: {
      title: "SaaS Subscription Management",
      description: "Send payment requests to customers for monthly subscriptions. Once approved, billing happens automatically — no chasing invoices, no manual collection.",
      flows: ["Payment Requests", "Recurring Payments"],
      visual: <SaaSMock />,
    },
    creator: {
      title: "Sponsorships & Campaign Agreements",
      description: "Formalize sponsorship commitments with milestone-based payment schedules. Recipients review and accept terms before activation, creating a transparent audit trail.",
      flows: ["Commitments", "Recurring Payments"],
      visual: <CreatorMock />,
    },
    personal: {
      title: "Personal & Family Transfers",
      description: "Set up simple recurring transfers to family members or personal savings. Choose your token, set the frequency, and let the automation handle the rest.",
      flows: ["Recurring Payments"],
      visual: <PersonalMock />,
    },
  };

  const active = tabContent[activeTab];

  const flowColors: Record<string, string> = {
    "Recurring Payments": "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    "Commitments": "border-[#9945FF]/20 bg-[#9945FF]/10 text-[#9945FF]",
    "Payment Requests": "border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#3b82f6]",
  };

  return (
    <section id="use-cases" className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 max-w-2xl"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Built for every payment relationship
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            From DAO treasuries to personal transfers — three payment models that adapt
            to how you actually move money.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr] lg:gap-8">
          {/* Left — tabs + text */}
          <div>
            {/* Tab selector */}
            <div className="mb-6 flex flex-wrap gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? "border border-white/[0.12] bg-white/[0.06] text-white"
                      : "border border-white/[0.04] bg-white/[0.015] text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <h3 className="text-lg font-semibold text-white">{active.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {active.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 self-center mr-1">Uses:</span>
                  {active.flows.map((flow) => (
                    <span
                      key={flow}
                      className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${flowColors[flow] || ""}`}
                    >
                      {flow}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right — visual mock */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5"
            >
              {active.visual}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
