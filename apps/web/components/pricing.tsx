"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import * as React from "react";
import {
  Check,
  Sparkles,
  Shield,
  Zap,
  BarChart,
  Clock,
  Users,
  Award,
} from "lucide-react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Show savings calculation



  const calculateSavings = (monthlyPrice: number): string => {
    const monthlyCost = monthlyPrice * 12;
    const annualCost = monthlyPrice * 9; // 25% off (12 months for the price of 9)
    return (monthlyCost - annualCost).toFixed(0);
  };

  // Animation settings
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // List of plans with more detailed information
  const plans = [
    {
      name: "Basic",
      description: "Perfect for individuals and small projects",
      price: isAnnual ? 9 : 12,
      monthlyPrice: 12,
      icon: <Clock className="h-5 w-5 text-blue-400" />,
      color: "blue",
      gradient: "from-blue-500 to-purple-500",
      features: [
        "Up to 10 recurring payments",
        "Daily, weekly, monthly schedules",
        "Email notifications",
        "Basic analytics dashboard",
        "Community support forum access",
      ],
      notIncluded: [
        "Advanced analytics",
        "Webhook integrations",
        "Custom payment schedules",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      description: "Ideal for businesses and growing projects",
      price: isAnnual ? 29 : 39,
      monthlyPrice: 39,
      icon: <Zap className="h-5 w-5 text-purple-400" />,
      color: "purple",
      gradient: "from-purple-500 to-indigo-500",
      features: [
        "Unlimited recurring payments",
        "Custom payment schedules",
        "Advanced analytics dashboard",
        "Webhook integrations",
        "Priority email support",
        "Multi-wallet support",
        "Payment retry logic",
        "Transaction history exports",
      ],
      notIncluded: [
        "Custom integrations",
        "Dedicated account manager",
        "White-label solution",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      price: "Custom",
      icon: <Award className="h-5 w-5 text-teal-400" />,
      color: "teal",
      gradient: "from-teal-500 to-emerald-500",
      features: [
        "Everything in Pro plan",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantees (99.9% uptime)",
        "Custom reporting",
        "White-label solution",
        "API rate limits increase (5x)",
        "Security audit assistance",
        "Implementation consulting",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  // Features section for more detailed comparison
  const featureCategories = [
    {
      name: "Core Features",
      icon: <Sparkles className="h-5 w-5" />,
      features: [
        {
          name: "Recurring Payments",
          basic: "Up to 10",
          pro: "Unlimited",
          enterprise: "Unlimited",
        },
        {
          name: "Payment Schedules",
          basic: "Standard",
          pro: "Custom",
          enterprise: "Custom",
        },
        { name: "Email Notifications", basic: "✓", pro: "✓", enterprise: "✓" },
      ],
    },
    {
      name: "Analytics & Reporting",
      icon: <BarChart className="h-5 w-5" />,
      features: [
        {
          name: "Dashboard",
          basic: "Basic",
          pro: "Advanced",
          enterprise: "Advanced",
        },
        {
          name: "Transaction History",
          basic: "30 days",
          pro: "1 year",
          enterprise: "Unlimited",
        },
        { name: "Custom Reports", basic: "—", pro: "Limited", enterprise: "✓" },
      ],
    },
    {
      name: "Support & Security",
      icon: <Shield className="h-5 w-5" />,
      features: [
        {
          name: "Support",
          basic: "Community",
          pro: "Priority Email",
          enterprise: "Dedicated",
        },
        { name: "SLA Guarantee", basic: "—", pro: "—", enterprise: "✓" },
        {
          name: "API Rate Limits",
          basic: "Standard",
          pro: "2x",
          enterprise: "5x",
        },
      ],
    },
    {
      name: "Integrations",
      icon: <Users className="h-5 w-5" />,
      features: [
        { name: "Webhooks", basic: "—", pro: "✓", enterprise: "✓" },
        {
          name: "Multi-wallet",
          basic: "—",
          pro: "Up to 5",
          enterprise: "Unlimited",
        },
        { name: "White-labeling", basic: "—", pro: "—", enterprise: "✓" },
      ],
    },
  ];

  // Observe element for animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("pricing-section");
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  return (
    <section
      id="pricing-section"
      className="py-24 bg-gradient-to-b from-dark-300 to-dark-400 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-3">
            <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent text-sm font-medium px-4 py-1 rounded-full border border-purple-400/20">
              Pricing
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent font-space">
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Choose the plan that fits your needs. No hidden fees, no surprises.
            All plans include access to our core platform features.
          </p>

          <motion.div
            className="flex items-center justify-center mt-8 bg-white/5 w-fit mx-auto px-4 py-2 rounded-full border border-white/10"
            whileHover={{ boxShadow: "0 0 20px rgba(110, 86, 207, 0.3)" }}
          >
            <span
              className={`mr-3 ${isAnnual ? "text-white/50" : "text-white font-medium"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label={`Switch to ${isAnnual ? "monthly" : "annual"} billing`}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${
                isAnnual
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                  : "bg-gray-700"
              }`}
            >
              <motion.span
                layout
                className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
                animate={{ x: isAnnual ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span
              className={`ml-3 flex items-center gap-1 ${isAnnual ? "text-white font-medium" : "text-white/50"}`}
            >
              Annual
              <motion.span
                initial={{ scale: 1 }}
                animate={isAnnual ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-500/20"
              >
                Save 25%
              </motion.span>
            </span>
          </motion.div>
        </motion.div>

        {/* Main pricing cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-4 lg:gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "show" : "hidden"}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`rounded-2xl backdrop-blur-sm overflow-hidden relative transition-all duration-300 ${
                selectedPlan === index
                  ? "ring-2 ring-offset-2 ring-offset-dark-400 scale-[1.02] z-10"
                  : "hover:scale-[1.01]"
              } ${
                plan.popular
                  ? "bg-gradient-to-b from-white/10 to-purple-900/20 border border-purple-500/20"
                  : "glass border border-white/10"
              }`}
              onClick={() => setSelectedPlan(index)}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center text-sm py-1.5 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    <span>MOST POPULAR</span>
                  </div>
                </div>
              )}

              <div className={`p-8 ${plan.popular ? "pt-12" : ""}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg bg-${plan.color}-500/10`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white font-space">
                    {plan.name}
                  </h3>
                </div>

                <p className="text-white/70 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  {typeof plan.price === "number" ? (
                    <div className="flex items-end">
                      <span className="text-4xl font-bold text-white font-space">
                        ${plan.price}
                      </span>
                      <span className="text-white/70 ml-1 mb-1">/month</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-white font-space">
                      {plan.price}
                    </div>
                  )}
                  {isAnnual && typeof plan.price === "number" && (
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-sm text-emerald-400">
                        Billed annually (${plan.price * 12}/year)
                      </p>
                      <p className="text-xs text-white/50">
                        Save ${calculateSavings(plan.monthlyPrice ?? 0)} per year
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className={`w-full h-11 font-medium transition-all duration-300 ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.gradient} hover:brightness-110 hover:shadow-lg hover:shadow-purple-500/20 text-white`
                      : `bg-white/5 hover:bg-white/10 border border-white/10 hover:border-${plan.color}-500/30 text-white`
                  }`}
                >
                  {plan.cta}
                </Button>

                <div className="border-t border-white/10 mt-8 pt-6">
                  <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>What&apos;s included:</span>
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                      >
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-white/80">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {plan.notIncluded && (
                    <div className="mt-6 pt-4 border-t border-white/5">
                      <p className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                        <span>Not included:</span>
                      </p>
                      <ul className="space-y-2">
                        {plan.notIncluded.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-white/50"
                          >
                            <span className="pl-6">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 mb-16 overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm"
        >
          <div className="px-6 py-4 bg-white/5 border-b border-white/10">
            <h3 className="text-xl font-bold text-white font-space">
              Compare Plans
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-left">
                  <th className="px-6 py-4 text-white font-medium">Features</th>
                  <th className="px-6 py-4 text-white font-medium">Basic</th>
                  <th className="px-6 py-4 text-white font-medium">Pro</th>
                  <th className="px-6 py-4 text-white font-medium">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="border-t border-white/5 bg-white/3">
                      <td colSpan={4} className="px-6 py-3">
                        <div className="flex items-center gap-2 text-white/70 font-medium text-sm">
                          {category.icon}
                          <span>{category.name}</span>
                        </div>
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr
                        key={`${categoryIndex}-${featureIndex}`}
                        className="border-t border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-3 text-white/80 text-sm">
                          {feature.name}
                        </td>
                        <td className="px-6 py-3 text-white/80 text-sm">
                          {feature.basic === "✓" ? (
                            <Check className="h-5 w-5 text-emerald-400" />
                          ) : feature.basic === "—" ? (
                            <span className="text-white/30">—</span>
                          ) : (
                            feature.basic
                          )}
                        </td>
                        <td className="px-6 py-3 text-white/80 text-sm">
                          {feature.pro === "✓" ? (
                            <Check className="h-5 w-5 text-emerald-400" />
                          ) : feature.pro === "—" ? (
                            <span className="text-white/30">—</span>
                          ) : (
                            feature.pro
                          )}
                        </td>
                        <td className="px-6 py-3 text-white/80 text-sm">
                          {feature.enterprise === "✓" ? (
                            <Check className="h-5 w-5 text-emerald-400" />
                          ) : feature.enterprise === "—" ? (
                            <span className="text-white/30">—</span>
                          ) : (
                            feature.enterprise
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-white mb-6 font-space text-center">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                question: "Can I change plans later?",
                answer:
                  "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major cryptocurrencies including SOL, BTC, ETH, and USDC, as well as credit cards through our payment processor.",
              },
              {
                question: "Is there a setup fee?",
                answer:
                  "No, there are no setup fees for any of our plans. You only pay the advertised subscription cost.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="p-6 backdrop-blur-sm bg-white/5 rounded-xl border border-white/10"
                whileHover={{ y: -4, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="text-white font-medium mb-2">{faq.question}</h4>
                <p className="text-white/70 text-sm">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Custom solution CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 rounded-2xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-800/30 to-indigo-800/30 blur-sm"></div>
          <div className="absolute inset-0 backdrop-blur-sm bg-dark-400/30"></div>
          <div className="relative p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 font-space">
                  Need a custom solution?
                </h3>
                <p className="text-white/70 max-w-xl">
                  Our enterprise team will work with you to build a tailored
                  solution that meets your specific requirements and scale with
                  your business.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white md:w-auto w-full h-12 px-8 shadow-lg shadow-purple-900/30 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105">
                  <div className="flex items-center gap-2">
                    <span>Contact Sales</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.5 2C3.22386 2 3 2.22386 3 2.5C3 2.77614 3.22386 3 3.5 3H11.2929L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L12 3.70711V11.5C12 11.7761 12.2239 12 12.5 12C12.7761 12 13 11.7761 13 11.5V2.5C13 2.22386 12.7761 2 12.5 2H3.5Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 flex justify-center"
        >
          <div className="max-w-3xl px-8 py-6 backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 text-center relative">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
              </svg>
            </div>

            <div className="mt-5">
              <p className="text-white/80 italic text-lg">
                &quot;AutoSOL has transformed our payment infrastructure. We&apos;ve saved
                thousands in transaction fees and countless hours of development
                time.&quot;
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  DP
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">David Peterson</p>
                  <p className="text-white/60 text-sm">
                    CTO, BlockStack Finance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Money back guarantee */}
        <div className="text-center mt-16">
          <p className="text-white/60 text-sm flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <span>14-day money-back guarantee. No questions asked.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
