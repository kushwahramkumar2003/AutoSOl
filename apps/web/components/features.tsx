"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Clock,
  CreditCard,
  Shield,
  Zap,
  BarChart,
  Wallet,
  RefreshCcw,
  Settings,
  ArrowRight,
  Calendar,
  CheckCircle,
} from "lucide-react";

/* ── Token orbit visual ───────────────────────────────────────────────── */
function TokenOrbit() {
  const tokens = [
    { symbol: "◎", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", color: "#9945FF", label: "SOL" },
    { symbol: "$", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png", color: "#2775CA", label: "USDC" },
    { symbol: "₮", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg", color: "#26A17B", label: "USDT" },
    { symbol: "B", icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png", color: "#F2A52B", label: "BONK" },
    { symbol: "J", icon: "https://static.jup.ag/jup/icon.png", color: "#4FC08D", label: "JUP" },
    { symbol: "R", icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png", color: "transparent", label: "RAY" },
  ];

  return (
    <div className="relative flex h-44 items-center justify-center">
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
        <CreditCard className="h-5 w-5 text-slate-300" />
      </div>
      <div className="absolute h-36 w-36 rounded-full border border-white/[0.04]" />
      {tokens.map((token, i) => {
        const angle = (360 / tokens.length) * i;
        return (
          <motion.div
            key={token.label}
            className="absolute"
            animate={{ rotate: [angle, angle + 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="absolute flex items-center justify-center rounded-full text-[10px] font-bold text-white overflow-hidden"
              style={{
                width: 28, height: 28, backgroundColor: token.color,
                left: -14, top: -82,
              }}
              animate={{ rotate: [-(angle), -(angle + 360)] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {token.icon ? (
                <img src={token.icon} alt={token.label} className="h-full w-full object-cover" />
              ) : (
                token.symbol
              )}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Schedule type selector ───────────────────────────────────────────── */
function ScheduleTypesVisual() {
  const types = [
    { label: "Daily", icon: <Clock className="h-3.5 w-3.5" />, active: false },
    { label: "Weekly", icon: <Calendar className="h-3.5 w-3.5" />, active: true },
    { label: "Monthly", icon: <Calendar className="h-3.5 w-3.5" />, active: false },
    { label: "Custom", icon: <Settings className="h-3.5 w-3.5" />, active: false },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {types.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium ${
              t.active
                ? "border border-primary/30 bg-primary/10 text-primary"
                : "border border-white/[0.06] bg-white/[0.03] text-slate-500"
            }`}
          >
            {t.icon}
            {t.label}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="text-[9px] text-slate-600">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
            </div>
            <div
              className={`h-6 w-full rounded-md ${
                i === 2 ? "border border-primary/30 bg-primary/15" : "bg-white/[0.03]"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Live execution feed ──────────────────────────────────────────────── */
function ExecutionFeed() {
  const events = [
    { time: "2s ago", text: "Payment #127 executed", status: "success" },
    { time: "1m ago", text: "Schedule verified", status: "info" },
    { time: "3m ago", text: "Payment #126 confirmed", status: "success" },
    { time: "5m ago", text: "Vault funded 2.5 SOL", status: "info" },
  ];

  return (
    <div className="space-y-1.5">
      {events.map((ev, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
        >
          <div className={`h-1.5 w-1.5 rounded-full ${ev.status === "success" ? "bg-emerald-400" : "bg-primary"}`} />
          <span className="flex-1 text-xs text-slate-300">{ev.text}</span>
          <span className="text-[10px] text-slate-600">{ev.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Security layers ──────────────────────────────────────────────────── */
function SecurityVisual() {
  const layers = [
    { label: "Owner Authority", w: "100%" },
    { label: "PDA Vault", w: "85%" },
    { label: "Executor Gate", w: "70%" },
    { label: "On-chain Verify", w: "55%" },
  ];

  return (
    <div className="space-y-2">
      {layers.map((l, i) => (
        <motion.div
          key={l.label}
          initial={{ opacity: 0, width: 0 }}
          whileInView={{ opacity: 1, width: l.w }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.12 }}
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span className="text-[11px] font-medium text-slate-300">{l.label}</span>
          </div>
          <Shield className="h-3 w-3 text-slate-600" />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Wallet cards ─────────────────────────────────────────────────────── */
function WalletVisual() {
  const wallets = [
    { name: "Phantom", icon: "/Phantom-Icon_Circle.svg", color: "#AB9FF2" },
    { name: "Solflare", icon: "/solflare-logo.svg", color: "#FC8C1C" },
    { name: "Backpack", icon: "https://backpack.app/favicon.ico", color: "#E33E3F" },
    { name: "Glow", icon: "/glow-logo.svg", color: "#B0D94C" },
  ];

  return (
    <div className="flex gap-2">
      {wallets.map((w, i) => (
        <motion.div
          key={w.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ y: -3 }}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]"
        >
          <div className="h-6 w-6 overflow-hidden rounded-lg">
            {w.icon ? (
              <img src={w.icon} alt={w.name} className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full" style={{ backgroundColor: w.color + "30" }} />
            )}
          </div>
          <span className="text-[10px] text-slate-500">{w.name}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Features section ─────────────────────────────────────────────────── */
export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [hasMouse, setHasMouse] = useState(false);
  const spotX = useTransform(mouseX, (v) => v - 300);
  const spotY = useTransform(mouseY, (v) => v - 300);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const h = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseX.set(e.clientX - r.left);
      mouseY.set(e.clientY - r.top);
      setHasMouse(true);
    };
    el.addEventListener("mousemove", h);
    return () => el.removeEventListener("mousemove", h);
  }, [mouseX, mouseY]);

  return (
    <section ref={sectionRef} id="features" className="relative overflow-hidden py-12 lg:py-16">
      {hasMouse && (
        <motion.div
          className="pointer-events-none absolute z-0 h-[600px] w-[600px] rounded-full opacity-[0.025]"
          style={{ x: spotX, y: spotY, background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Bento grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Multi-Token — tall card with orbit */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035] sm:col-span-2 lg:col-span-1 lg:row-span-2"
          >
            <TokenOrbit />
            <h3 className="mt-4 text-lg font-semibold text-white">Multi-Token Support</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Pay with SOL, USDC, USDT, BONK, JUP — any SPL token. Each schedule gets its own on-chain vault.
            </p>
          </motion.div>

          {/* Flexible Scheduling */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035] lg:col-span-2"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Flexible Scheduling</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Daily, weekly, monthly, or custom intervals. Up to 10 payments per schedule.
                </p>
              </div>
            </div>
            <div className="mt-4"><ScheduleTypesVisual /></div>
          </motion.div>

          {/* Real-time Execution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035]"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Real-time Execution</h3>
                <p className="mt-0.5 text-xs text-slate-500">Sub-second confirmation</p>
              </div>
            </div>
            <ExecutionFeed />
          </motion.div>

          {/* Layered Security */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035]"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Layered Security</h3>
                <p className="mt-0.5 text-xs text-slate-500">PDA vaults & authority gates</p>
              </div>
            </div>
            <SecurityVisual />
          </motion.div>

          {/* Multi-Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035] lg:col-span-2"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Multi-Wallet Integration</h3>
                <p className="mt-0.5 text-xs text-slate-500">Connect with any Solana wallet</p>
              </div>
            </div>
            <WalletVisual />
          </motion.div>

          {/* Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
              <BarChart className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">Payment Analytics</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Track history, token distribution, and schedule health from a real-time dashboard.
            </p>
            <div className="mt-4 flex items-end gap-1.5">
              {[40, 65, 35, 80, 55, 70, 90, 45, 75, 60, 85, 50].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: h * 0.4 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  className="w-full rounded-sm bg-primary/20"
                />
              ))}
            </div>
          </motion.div>

          {/* Auto-Retry */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">Auto-Retry</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Failed payments automatically retry with configurable back-off to ensure delivery.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {["Attempt 1", "Retry", "Success"].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${i === 2 ? "bg-emerald-400" : i === 1 ? "bg-amber-400" : "bg-red-400/60"}`} />
                  <span className="text-[10px] text-slate-500">{s}</span>
                  {i < 2 && <ArrowRight className="h-3 w-3 text-slate-700" />}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Fee Control */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="group rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">Fee Control</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              On-chain fee settings with authority controls, token whitelisting, and a hard 5% cap.
            </p>
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Fee: 1.0%</span>
                <span className="text-slate-600">Max 5%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                <div className="h-full w-[20%] rounded-full bg-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
