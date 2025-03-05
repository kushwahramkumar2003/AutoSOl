"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md shadow-md py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center shadow-neon">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-xl text-white font-space">
            AutoSOL
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-white/70 hover:text-white transition-colors relative group"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="#how-it-works"
            className="text-white/70 hover:text-white transition-colors relative group"
          >
            How It Works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="#technical"
            className="text-white/70 hover:text-white transition-colors relative group"
          >
            Technical
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="#pricing"
            className="text-white/70 hover:text-white transition-colors relative group"
          >
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="outline"
            className="border-[#6E56CF] text-[#6E56CF] hover:bg-[#6E56CF]/20 hover:text-white transition-all"
          >
            Documentation
          </Button>
          <Button className="bg-gradient-to-r from-[#6E56CF] to-[#6E56CF]/80 hover:from-[#5a46b0] hover:to-[#5a46b0]/80 text-white transition-all shadow-neon">
            Connect Wallet
          </Button>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link
                href="#features"
                className="text-white/80 py-2 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-white/80 py-2 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#technical"
                className="text-white/80 py-2 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Technical
              </Link>
              <Link
                href="#pricing"
                className="text-white/80 py-2 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full border-[#6E56CF] text-[#6E56CF] hover:bg-[#6E56CF]/20 hover:text-white"
                >
                  Documentation
                </Button>
                <Button className="w-full bg-gradient-to-r from-[#6E56CF] to-[#6E56CF]/80 hover:from-[#5a46b0] hover:to-[#5a46b0]/80 text-white shadow-neon">
                  Connect Wallet
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
