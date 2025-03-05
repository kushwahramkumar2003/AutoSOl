"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Wallet, CalendarClock, Coins, CheckCircle } from "lucide-react"

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8])

  const steps = [
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Connect Wallet",
      description: "Connect your Solana wallet to get started. We support all major Solana wallets.",
    },
    {
      icon: <CalendarClock className="h-8 w-8" />,
      title: "Schedule Payments",
      description: "Set up your recurring payment schedule - choose frequency, amount, and recipient.",
    },
    {
      icon: <Coins className="h-8 w-8" />,
      title: "Fund Your Account",
      description: "Deposit funds to cover your scheduled payments or enable auto-funding.",
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Automatic Execution",
      description: "Sit back and relax as payments execute automatically according to your schedule.",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 bg-dark-300 relative overflow-hidden animated-gradient">
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-dark-200 to-transparent"></div>

      <div className="container mx-auto px-4" ref={containerRef}>
        <motion.div style={{ opacity, scale }} className="text-center mb-16">
          <h2 className="font-space gradient-text mb-4">How AutoSOL Works</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Setting up recurring payments on Solana has never been easier.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#6E56CF] to-[#10B981] hidden md:block"></div>

          <div className="space-y-12 md:space-y-0 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center gap-8 md:gap-16`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <h3 className="text-2xl font-bold text-white mb-2 font-space">{step.title}</h3>
                  <p className="text-white/70">{step.description}</p>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full glass flex items-center justify-center z-10 border-4 border-dark-300 shadow-neon">
                    <div className="text-[#6E56CF]">{step.icon}</div>
                  </div>
                  <div className="absolute w-24 h-24 rounded-full bg-[#6E56CF]/10 animate-pulse-glow"></div>
                </div>

                <div className="flex-1">
                  <div className="glass p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6E56CF] to-[#10B981]"></div>
                    <img
                      src={`/placeholder.svg?height=200&width=300&text=Step ${index + 1}`}
                      alt={`Step ${index + 1} illustration`}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                    <p className="text-sm text-white/70">
                      {index === 0 && "Connect with any Solana wallet in seconds."}
                      {index === 1 && "Flexible scheduling options for all your payment needs."}
                      {index === 2 && "Support for SOL and all SPL tokens."}
                      {index === 3 && "Reliable execution with confirmation notifications."}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Button className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white px-6 py-6 h-auto text-lg group shadow-neon">
            Start Automating Payments
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-200 to-transparent"></div>
    </section>
  )
}

