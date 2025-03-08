"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, User } from "lucide-react";
import Image from "next/image";

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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);

  const next = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrent((current) => (current + 1) % testimonials.length);

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [testimonials.length, isTransitioning]);

  const prev = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrent(
      (current) => (current - 1 + testimonials.length) % testimonials.length
    );

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [testimonials.length, isTransitioning]);

  // Handle autoplay
  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay, next]);

  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      next();
    }

    if (isRightSwipe) {
      prev();
    }

    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [next, prev]);

  // Intersection observer for pausing autoplay when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoplay(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Avatar Fallback Component
  interface AvatarWithFallbackProps {
    src: string;
    alt: string;
    className?: string;
  }

  const AvatarWithFallback = ({ src, alt, className }: AvatarWithFallbackProps) => {
    const [error, setError] = useState(false);

    return error ? (
      <div
        className={`${className} bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center`}
      >
        <User className="w-6 h-6 text-white" />
      </div>
    ) : (
      <Image
        src={src}
        alt={alt}
        width={80}
        height={80}
        className={className}
        onError={() => setError(true)}
      />
    );
  };

  return (
    <section
      ref={containerRef}
      className="py-24 bg-gradient-to-br from-dark-400 to-dark-600 relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-full h-full">
        <motion.div
          initial={{ x: -100, opacity: 0.3 }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-80 h-80 rounded-full bg-[#6E56CF]/10 blur-3xl"
        />
        <motion.div
          initial={{ x: 100, opacity: 0.3 }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 15,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#10B981]/10 blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-space bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-teal-400 mb-4">
            What Our Users Say
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Join thousands of satisfied users who trust AutoSOL for their
            recurring payment needs.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Previous button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 md:-translate-x-full z-20"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              disabled={isTransitioning}
              className="w-12 h-12 rounded-full backdrop-blur-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-[#6E56CF] hover:border-[#6E56CF]/50 transition-all duration-300 shadow-lg hover:shadow-[#6E56CF]/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </motion.div>

          {/* Next button */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 md:translate-x-full z-20"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <button
              onClick={next}
              aria-label="Next testimonial"
              disabled={isTransitioning}
              className="w-12 h-12 rounded-full backdrop-blur-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-[#6E56CF] hover:border-[#6E56CF]/50 transition-all duration-300 shadow-lg hover:shadow-[#6E56CF]/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>

          {/* Testimonial cards */}
          <div className="relative h-[300px] md:h-[250px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className="absolute inset-0"
              >
                <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-8 shadow-xl h-full flex flex-col justify-between">
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
                    <p className="text-white text-lg italic leading-relaxed">
                      &quot;{testimonials[current].content}&quot;
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                    <AvatarWithFallback
                      src={testimonials[current].avatar}
                      alt={testimonials[current].name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30"
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

          {/* Pagination dots */}
          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTransitioning) {
                    setCurrent(index);
                    setAutoplay(false);
                  }
                }}
                aria-label={`Go to testimonial ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === current
                    ? "bg-[#6E56CF] w-8"
                    : "bg-white/30 hover:bg-white/50"
                }`}
                disabled={isTransitioning}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              label: "Active Users",
              value: "10,000+",
              icon: (
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-purple-400 mb-2"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 3.13C17.7699 3.58425 19.0078 5.17853 19.0078 7.005C19.0078 8.83147 17.7699 10.4258 16 10.88"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>
              ),
            },
            {
              label: "Transactions Processed",
              value: "$25M+",
              icon: (
                <motion.div
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-teal-400 mb-2"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 1V23"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>
              ),
            },
            {
              label: "Average Savings",
              value: "98%",
              icon: (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-green-400 mb-2"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 8L2 22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 15L13 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M11 8C11 7.07174 11.3687 6.1815 12.0251 5.52513C12.6815 4.86875 13.5717 4.5 14.5 4.5H19.5C20.4283 4.5 21.3185 4.86875 21.9749 5.52513C22.6313 6.1815 23 7.07174 23 8V13C23 13.9283 22.6313 14.8185 21.9749 15.4749C21.3185 16.1313 20.4283 16.5 19.5 16.5H18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>
              ),
            },
            {
              label: "Customer Satisfaction",
              value: "4.9/5",
              icon: (
                <motion.div
                  animate={{ rotateY: [0, 180, 360] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-yellow-400 mb-2"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="currentColor"
                    />
                  </svg>
                </motion.div>
              ),
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 shadow-md text-center flex flex-col items-center"
            >
              {stat.icon}
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
