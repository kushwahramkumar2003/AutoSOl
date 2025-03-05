"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, CreditCard, Shield, Zap, BarChart, Wallet, RefreshCcw, Settings } from "lucide-react"

export default function Features() {
  const features = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Scheduled Payments",
      description: "Set up recurring payments on any schedule - daily, weekly, monthly, or custom intervals.",
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Multi-Token Support",
      description: "Support for SOL and all SPL tokens, including USDC, BONK, and more.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Non-Custodial",
      description: "Your funds remain in your wallet until the scheduled payment execution.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Leverage Solana's speed with sub-second confirmation times.",
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Payment Analytics",
      description: "Track and analyze your payment history with detailed insights.",
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Multi-Wallet Integration",
      description: "Connect with Phantom, Solflare, Backpack, and other popular wallets.",
    },
    {
      icon: <RefreshCcw className="h-6 w-6" />,
      title: "Auto-Retry Mechanism",
      description: "Failed payments automatically retry to ensure successful transactions.",
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Customizable Triggers",
      description: "Set conditional payments based on on-chain events or external triggers.",
    },
  ]

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="features" className="py-24 bg-dark-200">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-space gradient-text mb-4">Powerful Features for Automated Payments</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            AutoSOL provides everything you need to automate and manage recurring payments on Solana.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                y: -5,
              }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className="glass p-6 hover:border-[#6E56CF]/30 transition-all duration-300"
              style={{
                transformStyle: "preserve-3d",
                transform:
                  hoveredIndex === index
                    ? "perspective(1000px) rotateX(2deg) rotateY(2deg)"
                    : "perspective(1000px) rotateX(0) rotateY(0)",
              }}
            >
              <div
                className="w-12 h-12 rounded-lg bg-[#6E56CF]/10 flex items-center justify-center mb-4 text-[#6E56CF]"
                style={{
                  transform: hoveredIndex === index ? "translateZ(20px)" : "translateZ(0)",
                }}
              >
                {feature.icon}
              </div>
              <h3
                className="text-xl font-bold text-white mb-2 font-space"
                style={{
                  transform: hoveredIndex === index ? "translateZ(15px)" : "translateZ(0)",
                }}
              >
                {feature.title}
              </h3>
              <p
                className="text-white/70"
                style={{
                  transform: hoveredIndex === index ? "translateZ(10px)" : "translateZ(0)",
                }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

