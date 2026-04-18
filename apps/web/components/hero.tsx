"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

/* ── Floating token pill ─────────────────────────────────────────────── */
function FloatingToken({
  name,
  icon,
  symbol,
  color,
  x,
  y,
  delay,
  size = 44,
}: {
  name: string;
  icon?: string;
  symbol?: string;
  color: string;
  x: string;
  y: string;
  delay: number;
  size?: number;
}) {
  return (
    <motion.div
      className="absolute z-10 select-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
    >
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{
          duration: 3 + delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-sm"
      >
        <div
          className="flex items-center justify-center rounded-full text-xs font-bold text-white overflow-hidden"
          style={{
            width: size * 0.55,
            height: size * 0.55,
            backgroundColor: color,
          }}
        >
          {icon ? (
            <img src={icon} alt={name} className="h-full w-full object-cover" />
          ) : (
            symbol
          )}
        </div>
        <span className="text-xs font-medium text-slate-300">{name}</span>
      </motion.div>
    </motion.div>
  );
}

/* ── Mini calendar day ────────────────────────────────────────────────── */
function MiniCalendar() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = [
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28],
  ];
  const scheduledDays = [3, 10, 17, 24]; // weekly payments

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">April 2026</span>
        <div className="flex gap-1">
          <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-primary">
            Weekly
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex h-6 items-center justify-center text-[10px] font-medium text-slate-500"
          >
            {d}
          </div>
        ))}
        {dates.flat().map((date, i) => {
          const isScheduled = scheduledDays.includes(date);
          const isPast = date < 18;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.02 }}
              className={`flex h-6 items-center justify-center rounded-[10px] text-[10px] font-medium transition-colors ${
                isScheduled
                  ? isPast
                    ? "bg-primary/20 text-primary"
                    : "border border-primary/40 bg-primary/10 text-primary"
                  : "text-slate-500"
              }`}
            >
              {date}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Mock payment row ─────────────────────────────────────────────────── */
function PaymentRow({
  token,
  icon,
  color,
  recipient,
  amount,
  status,
  delay,
}: {
  token: string;
  icon?: string;
  color: string;
  recipient: string;
  amount: string;
  status: "completed" | "pending" | "scheduled";
  delay: number;
}) {
  const statusStyles = {
    completed: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-amber-500/15 text-amber-400",
    scheduled: "bg-primary/15 text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white overflow-hidden"
          style={{ backgroundColor: color }}
        >
          {icon ? (
            <img src={icon} alt={token} className="h-full w-full object-cover" />
          ) : (
            token.charAt(0)
          )}
        </div>
        <div>
          <div className="text-xs font-medium text-white">{recipient}</div>
          <div className="text-[10px] text-slate-500">{amount}</div>
        </div>
      </div>
      <span
        className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${statusStyles[status]}`}
      >
        {status}
      </span>
    </motion.div>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
export default function Hero() {
  const router = useRouter();
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });

  const tokens = [
    { name: "Solana", symbol: "◎", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", color: "#9945FF", x: "5%", y: "18%" },
    { name: "USDC", symbol: "$", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png", color: "#2775CA", x: "78%", y: "12%" },
    { name: "USDT", symbol: "₮", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg", color: "#26A17B", x: "85%", y: "45%" },
    { name: "BONK", symbol: "B", icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png", color: "#F2A52B", x: "8%", y: "65%" },
    { name: "JUP", symbol: "J", icon: "https://static.jup.ag/jup/icon.png", color: "#4FC08D", x: "72%", y: "72%" },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16">

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm font-medium text-slate-300">
                  Solana Payment Automation
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]"
            >
              Schedule & automate payments on Solana
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              Multi-token recurring payments with on-chain security.
              SOL, USDC, BONK — any SPL token. Daily, weekly, monthly.
              Fully non-custodial.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button
                onClick={() => router.push("/auth")}
                className="h-10 rounded-[14px] bg-[#3B82F6] px-5 text-sm font-medium text-white hover:bg-[#3B82F6]/90 transition-all"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-[14px] border-white/10 bg-[#121212] px-5 text-sm font-medium text-white hover:bg-white/[0.06] transition-all"
              >
                View Documentation
              </Button>
            </motion.div>

            {/* Token ribbon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex items-center gap-2"
            >
              <span className="text-xs text-slate-500">Supports</span>
              {[
                { label: "SOL", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" },
                { label: "USDC", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png" },
                { label: "USDT", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg" },
                { label: "BONK", icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png" },
                { label: "+ more", icon: null },
              ].map((t, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-slate-400"
                >
                  {t.icon && <img src={t.icon} alt={t.label} className="h-3 w-3 rounded-full object-cover" />}
                  {t.label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — product preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            {/* Floating tokens around the preview card */}
            {tokens.map((token, i) => (
              <FloatingToken
                key={token.symbol}
                {...token}
                delay={0.5 + i * 0.15}
              />
            ))}

            {/* Main preview card */}
            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.025] p-5 sm:p-6 backdrop-blur-sm">
              {/* Top bar */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex gap-1.5">
                  {["Daily", "Weekly", "Monthly"].map((f, i) => (
                    <span
                      key={f}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-medium ${
                        i === 1
                          ? "border border-primary/30 bg-primary/10 text-primary"
                          : "border border-white/[0.06] bg-white/[0.03] text-slate-500"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Two-column: calendar + payments */}
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniCalendar />

                <div className="space-y-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Upcoming
                    </span>
                    <span className="text-[10px] text-slate-500">
                      4 schedules
                    </span>
                  </div>
                  <PaymentRow
                    token="Solana"
                    icon="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                    color="#9945FF"
                    recipient="Team Salary"
                    amount="2.5 SOL · Weekly"
                    status="completed"
                    delay={0.9}
                  />
                  <PaymentRow
                    token="USDC"
                    icon="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                    color="#2775CA"
                    recipient="Server Costs"
                    amount="50 USDC · Monthly"
                    status="pending"
                    delay={1.0}
                  />
                  <PaymentRow
                    token="USDT"
                    icon="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg"
                    color="#26A17B"
                    recipient="Freelancer"
                    amount="120 USDT · Biweekly"
                    status="scheduled"
                    delay={1.1}
                  />
                  <PaymentRow
                    token="BONK"
                    icon="https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png"
                    color="#F2A52B"
                    recipient="Community Tips"
                    amount="500K BONK · Daily"
                    status="scheduled"
                    delay={1.2}
                  />
                </div>
              </div>

              {/* Bottom stats row */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Active", value: "4", sub: "schedules" },
                  { label: "Processed", value: "127", sub: "payments" },
                  { label: "Volume", value: "$12.4K", sub: "this month" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + i * 0.1 }}
                    className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center"
                  >
                    <div className="text-base font-semibold text-white">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {stat.label} · {stat.sub}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom social proof / trust bar */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={
            isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.5 }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="flex flex-col items-center gap-6 rounded-[22px] border border-white/[0.06] bg-white/[0.02] px-6 py-5 sm:flex-row sm:justify-between">
            {[
              { value: "< $0.001", label: "Per transaction" },
              { value: "400ms", label: "Confirmation" },
              { value: "All SPL", label: "Tokens supported" },
              { value: "99.9%", label: "Uptime" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-semibold text-white">
                  {item.value}
                </div>
                <div className="text-xs text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
