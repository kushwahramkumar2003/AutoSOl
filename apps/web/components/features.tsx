"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  Clock,
  CreditCard,
  Shield,
  Zap,
  BarChart,
  Wallet,
  RefreshCcw,
  Settings,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Scheduled Payments",
      description:
        "Set up recurring payments on any schedule - daily, weekly, monthly, or custom intervals.",
      color: "#6E56CF",
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Multi-Token Support",
      description:
        "Support for SOL and all SPL tokens, including USDC, BONK, and more.",
      color: "#8A63D2",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Non-Custodial",
      description:
        "Your funds remain in your wallet until the scheduled payment execution.",
      color: "#A770D6",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description:
        "Leverage Solana's speed with sub-second confirmation times.",
      color: "#C27DDA",
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Payment Analytics",
      description:
        "Track and analyze your payment history with detailed insights.",
      color: "#DE8ADE",
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Multi-Wallet Integration",
      description:
        "Connect with Phantom, Solflare, Backpack, and other popular wallets.",
      color: "#F897E2",
    },
    {
      icon: <RefreshCcw className="h-6 w-6" />,
      title: "Auto-Retry Mechanism",
      description:
        "Failed payments automatically retry to ensure successful transactions.",
      color: "#FFA4E6",
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Customizable Triggers",
      description:
        "Set conditional payments based on on-chain events or external triggers.",
      color: "#FFB1EA",
    },
  ];

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });
  const controls = useAnimation();

  console.log(activeFeature);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
      },
    },
  };

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    if (hoveredIndex === index) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-32 bg-gradient-to-b from-dark-200 to-dark-300 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-800/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-800/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-violet-800/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            type: "spring",
            damping: 20,
          }}
          className="text-center mb-20"
        >
          <span className="px-4 py-2 rounded-full bg-purple-900/20 text-purple-400 text-sm font-medium inline-block mb-6">
            POWERFUL TOOLKIT
          </span>
          <h2 className="font-space text-4xl md:text-5xl font-bold gradient-text mb-6 leading-tight">
            Everything You Need for <br className="hidden md:block" /> Seamless
            Payment Automation
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl">
            AutoSOL provides a comprehensive suite of tools to automate and
            manage recurring payments on Solana&apos;s lightning-fast
            blockchain.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={featureVariants}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseEnter={() => {
                setHoveredIndex(index);
                setTimeout(() => setActiveFeature(index), 100);
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setActiveFeature(null);
              }}
              className="relative glass p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-500 group"
              style={{
                background:
                  hoveredIndex === index
                    ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(110, 86, 207, 0.15), rgba(25, 25, 35, 0.9) 70%)`
                    : "",
                transformStyle: "preserve-3d",
                transform:
                  hoveredIndex === index
                    ? "perspective(1000px) rotateX(2deg) rotateY(2deg) scale(1.02)"
                    : "perspective(1000px) rotateX(0) rotateY(0) scale(1)",
                boxShadow:
                  hoveredIndex === index
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
                    : "0 10px 30px -15px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${feature.color}20 0%, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${feature.color}30 0%, ${feature.color}10 100%)`,
                  color: feature.color,
                  transform:
                    hoveredIndex === index
                      ? "translateZ(30px)"
                      : "translateZ(0)",
                  boxShadow:
                    hoveredIndex === index
                      ? `0 10px 20px -10px ${feature.color}50`
                      : "none",
                }}
              >
                <motion.div
                  animate={
                    hoveredIndex === index ? { rotate: [0, 5, 0, -5, 0] } : {}
                  }
                  transition={{
                    duration: 2,
                    repeat: hoveredIndex === index ? Infinity : 0,
                    repeatType: "reverse",
                  }}
                >
                  {feature.icon}
                </motion.div>
              </div>

              <h3
                className="text-2xl font-bold text-white mb-3 font-space tracking-tight transition-all duration-300"
                style={{
                  transform:
                    hoveredIndex === index
                      ? "translateZ(25px)"
                      : "translateZ(0)",
                  background:
                    hoveredIndex === index
                      ? `linear-gradient(to right, white, ${feature.color})`
                      : "",
                  WebkitBackgroundClip: hoveredIndex === index ? "text" : "",
                  WebkitTextFillColor:
                    hoveredIndex === index ? "transparent" : "",
                }}
              >
                {feature.title}
              </h3>

              <p
                className="text-white/70 text-lg transition-all duration-300"
                style={{
                  transform:
                    hoveredIndex === index
                      ? "translateZ(20px)"
                      : "translateZ(0)",
                }}
              >
                {feature.description}
              </p>

              {/* Subtle arrow indicator */}
              <div
                className={`absolute bottom-8 right-8 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}
                style={{
                  color: feature.color,
                  transform:
                    hoveredIndex === index
                      ? "translateZ(25px)"
                      : "translateZ(0)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12H19M19 12L12 5M19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
