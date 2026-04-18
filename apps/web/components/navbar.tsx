"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletConnect } from "./wallet-connect";
import Image from "next/image";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#technical", label: "Technical" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-white/[0.06] bg-background/80 backdrop-blur-xl py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/favicon.ico" alt="AutoSOL" height={28} width={28} />
          <span className="text-lg font-semibold tracking-tight text-white">
            AutoSOL
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <WalletConnect />
        </div>

        {/* Mobile */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/[0.06]"
              aria-label="Menu"
            >
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 border-white/[0.06] bg-background p-0"
          >
            <SheetHeader className="border-b border-white/[0.06] p-6">
              <SheetTitle>
                <div className="flex items-center gap-2.5">
                  <Image src="/favicon.ico" alt="AutoSOL" height={26} width={26} />
                  <span className="text-lg font-semibold text-white">
                    AutoSOL
                  </span>
                </div>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-white/[0.06] p-6">
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                  asChild
                >
                  <Link href="/docs" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpen className="mr-2 h-4 w-4 text-slate-400" />
                    Documentation
                  </Link>
                </Button>
                <WalletConnect />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
