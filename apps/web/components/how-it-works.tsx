"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Wallet,
  CalendarClock,
  Coins,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Image from "next/image";

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.5, 1, 1, 0.5]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.95, 1, 1, 0.95]
  );
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [50, 0, 0, 50]);

  const steps = [
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Connect Wallet",
      description:
        "Connect your Solana wallet to get started. We support all major Solana wallets including Phantom, Solflare, and Backpack.",
      color: "#6E56CF",
      illustration: "/connect-wallet-ill.jpg",
      details: [
        "One-click connection process",
        "Secure wallet integration",
        "Multiple wallet support",
        "No custody of your funds",
      ],
    },
    {
      icon: <CalendarClock className="h-8 w-8" />,
      title: "Schedule Payments",
      description:
        "Set up your recurring payment schedule with flexible options - choose frequency, amount, recipient, and more.",
      color: "#8A63D2",
      illustration: "/schedul-payment.jpg",
      details: [
        "Daily, weekly, monthly options",
        "Custom schedule configuration",
        "Multiple recipient support",
        "Variable payment amounts",
      ],
    },
    {
      icon: <Coins className="h-8 w-8" />,
      title: "Fund Your Account",
      description:
        "Deposit funds to cover your scheduled payments or enable auto-funding to ensure continuous operation.",
      color: "#A770D6",
      illustration: "/fund-your-account.jpg",
      details: [
        "Support for SOL and all SPL tokens",
        "Auto-funding capability",
        "Low transaction fees",
        "Real-time balance monitoring",
      ],
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Automatic Execution",
      description:
        "Sit back and relax as payments execute automatically according to your schedule with real-time notifications.",
      color: "#C27DDA",
      illustration: "/api/placeholder/600/400",
      details: [
        "Reliable execution engine",
        "Confirmation notifications",
        "Detailed transaction history",
        "Payment verification system",
      ],
    },
  ];

  const nextStep = () => {
    setActiveStep((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
  };

  const prevStep = () => {
    setActiveStep((prev) => (prev === 0 ? steps.length - 1 : prev - 1));
  };

  // For mobile view timeline
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - timelineRef.current.offsetLeft);
    setScrollLeft(timelineRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    timelineRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section
      id="how-it-works"
      className="py-32 bg-gradient-to-b from-dark-300 to-dark-400 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>
        <svg
          className="absolute top-1/2 left-0 text-purple-500/5 w-full h-96"
          viewBox="0 0 1200 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 94L50 106C100 118 200 142 300 130C400 118 500 70 600 70C700 70 800 118 900 142C1000 166 1100 166 1150 166L1200 166L1200 0L1150 0C1100 0 1000 0 900 0C800 0 700 0 600 0C500 0 400 0 300 0C200 0 100 0 50 0L0 0Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Top fading effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-dark-300 to-transparent z-10"></div>

      <div className="container mx-auto px-4 relative z-20" ref={containerRef}>
        <motion.div style={{ opacity, scale, y }} className="text-center mb-20">
          <span className="px-4 py-2 rounded-full bg-purple-900/20 text-purple-400 text-sm font-medium inline-block mb-6">
            SIMPLE & INTUITIVE
          </span>
          <h2 className="font-space text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="gradient-text">How AutoSOL Works</span>
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl">
            Setting up recurring payments on Solana has never been easier.
            Follow these simple steps to automate your payments.
          </p>
        </motion.div>

        {/* Mobile Timeline View */}
        <div
          ref={timelineRef}
          className="md:hidden mb-10 overflow-x-auto scrollbar-hide flex space-x-4 pb-4 pt-2 px-2"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex-shrink-0 w-40 p-4 rounded-xl ${activeStep === idx ? "bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30" : "bg-dark-400/50 border border-white/5"} cursor-pointer transition-all duration-300`}
              onClick={() => setActiveStep(idx)}
            >
              <div
                className={`w-10 h-10 mb-3 rounded-lg flex items-center justify-center`}
                style={{ backgroundColor: `${step.color}30` }}
              >
                <div style={{ color: step.color }}>{step.icon}</div>
              </div>
              <h4 className="text-white text-sm font-medium mb-1">
                {step.title}
              </h4>
              <span className="text-white/40 text-xs">Step {idx + 1}</span>
            </div>
          ))}
        </div>

        {/* Desktop Interactive Process View */}
        <div className="relative hidden md:block">
          {/* Connection line */}
          <div className="absolute left-1/2 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#6E56CF] via-[#A770D6] to-[#C27DDA]"></div>

          <div className="space-y-32 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 70,
                }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center gap-8 md:gap-16`}
              >
                {/* Content Column */}
                <div
                  className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}
                >
                  <div
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-2"
                    style={{
                      backgroundColor: `${step.color}20`,
                      color: step.color,
                    }}
                  >
                    Step {index + 1}
                  </div>
                  <motion.h3
                    className="text-3xl font-bold text-white mb-3 font-space"
                    initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {step.title}
                  </motion.h3>
                  <motion.p
                    className="text-white/70 text-lg"
                    initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {step.description}
                  </motion.p>

                  <motion.ul
                    className={`mt-4 space-y-2 ${index % 2 === 0 ? "md:ml-auto" : ""}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {step.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-white/60"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: step.color }}
                        ></div>
                        {detail}
                      </li>
                    ))}
                  </motion.ul>
                </div>

                {/* Center Icon */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute w-28 h-28 rounded-full opacity-20"
                    style={{ backgroundColor: step.color }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  ></motion.div>
                  <motion.div
                    className="w-20 h-20 rounded-full bg-dark-400/80 backdrop-blur-sm flex items-center justify-center z-10 border-4"
                    style={{ borderColor: `${step.color}50` }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <div style={{ color: step.color }}>{step.icon}</div>
                  </motion.div>
                </div>

                {/* Illustration Column */}
                <div className="flex-1">
                  <motion.div
                    className="rounded-2xl bg-dark-400/70 backdrop-blur-sm border border-white/5 p-1 overflow-hidden shadow-lg"
                    whileHover={{
                      y: -5,
                      boxShadow: `0 20px 25px -5px ${step.color}10, 0 8px 10px -6px ${step.color}10`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="rounded-xl overflow-hidden relative">
                      <div
                        className="absolute top-0 left-0 w-full h-1 z-10"
                        style={{
                          background: `linear-gradient(to right, ${step.color}, ${index === steps.length - 1 ? "#10B981" : steps[index + 1].color})`,
                        }}
                      ></div>
                      <Image
                        src={step.illustration}
                        alt={`${step.title} illustration`}
                        width={600}
                        height={400}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-400/80 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white/90 font-medium">
                          {index === 0 &&
                            "Connect with any Solana wallet in seconds"}
                          {index === 1 &&
                            "Flexible scheduling for all your payment needs"}
                          {index === 2 && "Support for SOL and all SPL tokens"}
                          {index === 3 &&
                            "Reliable execution with notifications"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Detailed Step View */}
        <div className="md:hidden mt-8">
          <div className="relative overflow-hidden rounded-2xl bg-dark-400/70 backdrop-blur-sm border border-white/5">
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{
                background: `linear-gradient(to right, ${steps[activeStep].color} 30%, ${activeStep === steps.length - 1 ? "#10B981" : steps[(activeStep + 1) % steps.length].color})`,
              }}
            ></div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${steps[activeStep].color}30`,
                        color: steps[activeStep].color,
                      }}
                    >
                      {steps[activeStep].icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {steps[activeStep].title}
                      </h3>
                      <p className="text-white/50 text-sm">
                        Step {activeStep + 1} of {steps.length}
                      </p>
                    </div>
                  </div>

                  <p className="text-white/70 mb-6">
                    {steps[activeStep].description}
                  </p>

                  <div className="rounded-xl overflow-hidden mb-6">
                    <Image
                      src={steps[activeStep].illustration}
                      alt={`${steps[activeStep].title} illustration`}
                      width={600}
                      height={400}
                    />
                  </div>

                  <ul className="space-y-2 mb-6">
                    {steps[activeStep].details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-white/70"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: steps[activeStep].color }}
                        ></div>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      className="border-white/10 hover:bg-white/5 text-white/70"
                      onClick={prevStep}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/10 hover:bg-white/5 text-white/70"
                      onClick={nextStep}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-20 text-center"
        >
          <Button className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white px-8 py-7 h-auto text-lg font-medium group rounded-full shadow-lg shadow-purple-900/20">
            Start Automating Payments
            <motion.div
              animate={{
                x: [0, 5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.div>
          </Button>
          <p className="mt-4 text-white/40 text-sm">
            No credit card required. Connect wallet to begin.
          </p>
        </motion.div>
      </div>

      {/* Bottom fading effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-300 to-transparent z-10"></div>
    </section>
  );
}
