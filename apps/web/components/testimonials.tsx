"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Founder, SolPay",
      avatar: "/placeholder.svg?height=80&width=80",
      content:
        "AutoSOL has revolutionized how we handle subscription payments. The reliability and speed are unmatched in the crypto space.",
      rating: 5,
    },
    {
      name: "Sarah Williams",
      role: "CFO, BlockChain Ventures",
      avatar: "/placeholder.svg?height=80&width=80",
      content:
        "We've reduced payment processing costs by 98% since switching to AutoSOL. The automation capabilities have saved us countless hours.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Developer, CryptoSaaS",
      avatar: "/placeholder.svg?height=80&width=80",
      content:
        "The API is incredibly well-documented and easy to integrate. We were up and running with recurring payments in less than a day.",
      rating: 4,
    },
    {
      name: "Jessica Taylor",
      role: "Product Manager, DeFi Solutions",
      avatar: "/placeholder.svg?height=80&width=80",
      content:
        "AutoSOL's customer support is exceptional. They helped us customize the solution to fit our unique payment schedule requirements.",
      rating: 5,
    },
  ];

  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const next = useCallback(() => {
    setCurrent((current) => (current + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrent(
      (current) => (current - 1 + testimonials.length) % testimonials.length
    );
  }, [testimonials.length]);

  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay, next]);

  return (
    <section className="py-24 bg-dark-300 relative overflow-hidden animated-gradient">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#6E56CF]/10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-[#10B981]/10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-space gradient-text mb-4">What Our Users Say</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Join thousands of satisfied users who trust AutoSOL for their
            recurring payment needs.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 md:-translate-x-full z-20"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-[#6E56CF] hover:text-white transition-colors shadow-neon"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 md:translate-x-full z-20"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <button
              onClick={next}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-[#6E56CF] hover:text-white transition-colors shadow-neon"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="relative h-[300px] md:h-[250px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="glass p-8 shadow-xl h-full flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonials[current].rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-500"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-white text-lg italic">
                      "{testimonials[current].content}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                    <img
                      src={testimonials[current].avatar || "/placeholder.svg"}
                      alt={testimonials[current].name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-white font-space">
                        {testimonials[current].name}
                      </h4>
                      <p className="text-sm text-white/70">
                        {testimonials[current].role}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrent(index);
                  setAutoplay(false);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === current ? "bg-[#6E56CF]" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Active Users", value: "10,000+" },
            { label: "Transactions Processed", value: "$25M+" },
            { label: "Average Savings", value: "98%" },
            { label: "Customer Satisfaction", value: "4.9/5" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="glass p-6 shadow-md text-center"
            >
              <h3 className="text-3xl font-bold text-white mb-1 font-space">
                {stat.value}
              </h3>
              <p className="text-sm text-white/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
