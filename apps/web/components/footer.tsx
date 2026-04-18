"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Twitter, Github, Linkedin, Send, CheckCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Footer(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();
  const router = useRouter();

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email"); return; }
    setSubscribed(true);
    setError("");
    setTimeout(() => { setSubscribed(false); setEmail(""); }, 3000);
  };

  return (
    <footer className="pt-8 pb-0">
      {/* Footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Image src="/favicon.ico" alt="AutoSOL" height={24} width={24} />
              <span className="text-base font-semibold text-white">AutoSOL</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              Automated recurring payments on Solana. Non-custodial, multi-token, fully on-chain.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((item, idx) => (
                <Link key={idx} href={item.href} aria-label={item.label}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white">
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-600">
              Product
            </h3>
            <ul className="space-y-2">
              {["Features", "Pricing", "Documentation", "API Reference"].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-slate-500 transition-colors hover:text-white">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-600">
              Company
            </h3>
            <ul className="space-y-2">
              {["About Us", "Blog", "Careers", "Contact"].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-slate-500 transition-colors hover:text-white">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-600">
              Stay Updated
            </h3>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  placeholder="you@example.com"
                  className="h-9 rounded-lg border-white/[0.08] bg-white/[0.03] pr-10 text-sm text-white placeholder:text-slate-600 focus:border-white/20"
                />
                {!subscribed ? (
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-1 top-0.5 h-7 w-7 rounded-md bg-primary text-white hover:bg-primary/90"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                ) : (
                  <div className="absolute right-2.5 top-0 flex h-full items-center">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                )}
              </div>
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              {subscribed && <p className="text-[11px] text-emerald-400">Thanks for subscribing!</p>}
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row">
          <p className="text-[11px] text-slate-600">
            © {currentYear} AutoSOL. All rights reserved.
          </p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Legal"].map((item) => (
              <Link key={item} href="#" className="text-[11px] text-slate-600 transition-colors hover:text-white">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
