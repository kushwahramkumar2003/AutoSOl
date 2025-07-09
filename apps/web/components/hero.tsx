"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Wallet,
  ChevronDown,
  Shield,
  Clock,
  Coins,
  Users,
} from "lucide-react";
import NetworkBackground from "@/components/network-background";
import Image from "next/image";

export default function Hero() {
  const statsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(statsRef, { once: true, amount: 0.3 });
  const [hoverWallet, setHoverWallet] = useState<number | null>(null);

  const scrollToStats = () => {
    statsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const wallets = [
    {
      name: "Phantom",
      logo: "/Phantom-Logo-Purple.svg",
      color: "from-purple-500 to-blue-500",
    },
    {
      name: "Solflare",
      logo: "/Solflare-Solana-Wallet-Logo.png",
      color: "from-orange-500 to-red-500",
    },
    {
      name: "Backpack",
      logo: "/Default_Logo_Horizontal_RedAndWhite.png",
      color: "from-blue-500 to-teal-500",
    },
    {
      name: "Metamask",
      logo: "/MetaMask-logo-white.svg",
      color: "from-pink-500 to-purple-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <NetworkBackground />

      {/* Enhanced animated gradient orbs with more vibrant colors */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-teal-500/20 blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={itemVariants} className="flex flex-col gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block px-4 py-1.5 bg-muted/30 backdrop-blur-md border border-border/20 rounded-full shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-medium text-sm">
                  Solana Recurring Payments Platform
                </span>
              </div>
            </motion.div>

            <h1 className="font-space text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-blue-500 via-purple-600 to-teal-500 bg-clip-text text-transparent">
                Automate Recurring Payments on Solana
                <span className="animate-pulse">|</span>
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Schedule, automate, and manage recurring payments on Solana with
              ease. No more manual transfers or missed payments.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white  py-3 h-auto text-lg group shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10 hover:text-white hover:border-blue-500 py-3 h-auto text-lg transition-all duration-300"
              >
                View Documentation
              </Button>
            </div>

            <motion.button
              onClick={scrollToStats}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mt-6 self-start"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span>Explore Benefits</span>
              <ChevronDown size={16} />
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <div className="bg-background/30 backdrop-blur-xl p-6 rounded-xl border border-border/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-teal-500"></div>
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-foreground font-space">
                    Connect Your Wallet
                  </h3>
                  <motion.div
                    whileHover={{ rotate: 20 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Wallet className="h-6 w-6 text-blue-500" />
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Connect your Solana wallet to start setting up recurring
                    payments in seconds.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {wallets.map((wallet, idx) => (
                      <motion.div
                        key={idx}
                        className="relative bg-muted/30 backdrop-blur-md rounded-lg border border-border/20 p-3 flex items-center justify-center hover:bg-muted/50 transition-all cursor-pointer overflow-hidden group"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={() => setHoverWallet(idx)}
                        onMouseLeave={() => setHoverWallet(null)}
                      >
                        <AnimatePresence>
                          {hoverWallet === idx && (
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-10`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.15 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                        </AnimatePresence>
                        <Image
                          src={wallet.logo}
                          alt={wallet.name}
                          width={32}
                          height={32}
                          className="h-8 object-contain"
                        />
                      </motion.div>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300">
                    Connect Wallet
                  </Button>
                </div>
              </div>

              {/* Enhanced animated sparkles */}
              <div className="absolute top-1/4 right-6 w-2 h-2 rounded-full bg-blue-500 animate-pulse opacity-80"></div>
              <div
                className="absolute bottom-1/3 left-8 w-2 h-2 rounded-full bg-purple-500 animate-pulse opacity-80"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-teal-500 animate-pulse opacity-80"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            {/* Enhanced background glow effects */}
            <div className="absolute -z-10 -bottom-6 -right-6 h-64 w-64 bg-teal-500/30 rounded-full blur-3xl"></div>
            <div className="absolute -z-10 -top-6 -left-6 h-64 w-64 bg-blue-500/30 rounded-full blur-3xl"></div>
          </motion.div>
        </motion.div>

        <motion.div
          ref={statsRef}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-600/10 to-teal-500/10 rounded-xl"></div>
          <div className="border-t border-border/20 pt-10 py-6 px-6">
            <h3 className="text-center text-2xl font-bold text-foreground mb-8 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Powerful Benefits
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Transaction Cost",
                  value: "< $0.001",
                  icon: <Coins className="h-6 w-6 text-blue-500" />,
                  description: "Lowest fees in DeFi",
                  bgGradient: "from-blue-500/10 to-blue-600/5",
                },
                {
                  label: "Processing Time",
                  value: "400ms",
                  icon: <Clock className="h-6 w-6 text-purple-500" />,
                  description: "Lightning fast execution",
                  bgGradient: "from-purple-500/10 to-purple-600/5",
                },
                {
                  label: "Supported Tokens",
                  value: "All SPL",
                  icon: <Shield className="h-6 w-6 text-teal-500" />,
                  description: "Complete token support",
                  bgGradient: "from-teal-500/10 to-teal-600/5",
                },
                {
                  label: "Active Users",
                  value: "10,000+",
                  icon: <Users className="h-6 w-6 text-pink-500" />,
                  description: "Growing community",
                  bgGradient: "from-pink-500/10 to-pink-600/5",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className={`flex flex-col bg-background/30 backdrop-blur-md border border-border/40 p-4 rounded-lg hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden`}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground text-sm font-medium">
                        {stat.label}
                      </span>
                      {stat.icon}
                    </div>
                    <span className="text-2xl font-bold text-foreground font-space">
                      {stat.value}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add a decorative Solana logo in the background */}
      <div className="absolute bottom-[10.5rem] right-10 opacity-10 pointer-events-none">
        <Image
          src="https://cryptologos.cc/logos/solana-sol-logo.png"
          alt="Solana Logo"
          width={128}
          height={128}
        />
      </div>
    </section>
  );
}
