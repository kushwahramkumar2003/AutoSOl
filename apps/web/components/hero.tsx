"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Wallet } from "lucide-react"
import NetworkBackground from "@/components/network-background"

export default function Hero() {
  const [text, setText] = useState("")
  const fullText = "Automate Recurring Payments on Solana"
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + fullText[index])
        setIndex(index + 1)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [index])

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <NetworkBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-block px-4 py-1.5 glass rounded-full">
              <span className="text-[#6E56CF] font-medium text-sm">Solana Recurring Payments Platform</span>
            </div>

            <h1 className="font-space gradient-text leading-tight">
              {text}
              <span className="animate-pulse">|</span>
            </h1>

            <p className="text-lg text-white/70 max-w-xl">
              Schedule, automate, and manage recurring payments on Solana with ease. No more manual transfers or missed
              payments.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white px-6 py-6 h-auto text-lg group shadow-neon">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                className="border-[#6E56CF] text-[#6E56CF] hover:bg-[#6E56CF]/20 hover:text-white px-6 py-6 h-auto text-lg"
              >
                View Documentation
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="glass p-6 shadow-xl relative overflow-hidden animate-float">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6E56CF] to-[#10B981]"></div>
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white font-space">Connect Your Wallet</h3>
                  <Wallet className="h-6 w-6 text-[#6E56CF]" />
                </div>

                <div className="space-y-4">
                  <p className="text-white/70">
                    Connect your Solana wallet to start setting up recurring payments in seconds.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass p-3 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                      <img src="/placeholder.svg?height=30&width=120" alt="Phantom" className="h-6" />
                    </div>
                    <div className="glass p-3 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                      <img src="/placeholder.svg?height=30&width=120" alt="Solflare" className="h-6" />
                    </div>
                    <div className="glass p-3 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                      <img src="/placeholder.svg?height=30&width=120" alt="Backpack" className="h-6" />
                    </div>
                    <div className="glass p-3 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                      <img src="/placeholder.svg?height=30&width=120" alt="Glow" className="h-6" />
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon">
                    Connect Wallet
                  </Button>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 -bottom-6 -right-6 h-64 w-64 bg-[#10B981]/10 rounded-full blur-3xl"></div>
            <div className="absolute -z-10 -top-6 -left-6 h-64 w-64 bg-[#6E56CF]/10 rounded-full blur-3xl"></div>
          </motion.div>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-10">
          {[
            { label: "Transaction Cost", value: "<$0.001" },
            { label: "Processing Time", value: "400ms" },
            { label: "Supported Tokens", value: "All SPL" },
            { label: "Active Users", value: "10,000+" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="flex flex-col glass p-4 rounded-lg"
            >
              <span className="text-white/60 text-sm">{stat.label}</span>
              <span className="text-2xl font-bold text-white font-space">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

