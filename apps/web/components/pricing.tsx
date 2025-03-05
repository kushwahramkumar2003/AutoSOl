"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Basic",
      description: "Perfect for individuals and small projects",
      price: isAnnual ? 9 : 12,
      features: [
        "Up to 10 recurring payments",
        "Daily, weekly, monthly schedules",
        "Email notifications",
        "Basic analytics",
        "Community support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      description: "Ideal for businesses and growing projects",
      price: isAnnual ? 29 : 39,
      features: [
        "Unlimited recurring payments",
        "Custom payment schedules",
        "Advanced analytics dashboard",
        "Webhook integrations",
        "Priority support",
        "Multi-wallet support",
        "Payment retry logic",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      price: "Custom",
      features: [
        "Everything in Pro plan",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantees",
        "Custom reporting",
        "White-label solution",
        "API rate limits increase",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-dark-200">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-space gradient-text mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Choose the plan that fits your needs. All plans include access to
            our core platform features.
          </p>

          <div className="flex items-center justify-center mt-8">
            <span
              className={`mr-3 ${isAnnual ? "text-white/70" : "text-white font-medium"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? "bg-[#6E56CF]" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`ml-3 flex items-center gap-1 ${isAnnual ? "text-white font-medium" : "text-white/70"}`}
            >
              Annual
              <span className="bg-[#10B981]/20 text-[#10B981] text-xs px-2 py-0.5 rounded-full font-medium">
                Save 25%
              </span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`glass overflow-hidden relative ${plan.popular ? "border-[#6E56CF]" : "border-white/10"}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-[#6E56CF] text-white text-center text-sm py-1 font-medium">
                  Most Popular
                </div>
              )}

              <div className={`p-6 ${plan.popular ? "pt-9" : ""}`}>
                <h3 className="text-xl font-bold text-white mb-2 font-space">
                  {plan.name}
                </h3>
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
                    <p className="text-sm text-[#10B981] mt-1">
                      Billed annually (${plan.price * 12}/year)
                    </p>
                  )}
                </div>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon"
                      : "bg-transparent border-[#6E56CF] text-[#6E56CF] hover:bg-[#6E56CF]/20 hover:text-white"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>

                <div className="border-t border-white/10 mt-6 pt-6">
                  <p className="text-sm font-medium text-white mb-4">
                    What's included:
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-[#10B981] shrink-0 mt-0.5" />
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 glass p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 font-space">
                Need a custom solution?
              </h3>
              <p className="text-white/70">
                Contact our sales team to discuss your specific requirements and
                get a tailored quote.
              </p>
            </div>
            <Button className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white md:w-auto w-full shadow-neon">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
