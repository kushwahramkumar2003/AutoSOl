"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Twitter,
  Github,
  Linkedin,
  Send,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";

// Define types for social media links
type SocialLink = {
  icon: React.ElementType;
  href: string;
  label: string;
};

// Define types for navigation sections
type NavigationSection = {
  title: string;
  links: string[];
};

export default function Footer(): React.ReactElement {
  const [email, setEmail] = useState<string>("");
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const currentYear: number = new Date().getFullYear();

  // Social media links data
  const socialLinks: SocialLink[] = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  // Navigation sections data
  const navigationSections: NavigationSection[] = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Documentation", "API Reference"],
    },
    {
      title: "Company",
      links: ["About Us", "Blog", "Careers", "Contact"],
    },
  ];

  // Footer links data
  const footerLinks: string[] = ["Privacy Policy", "Terms of Service", "Legal"];

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    // Here you would typically call your API to handle the subscription
    // For demo purposes, we're just simulating success
    setSubscribed(true);
    setError("");

    // Reset subscription state after 3 seconds
    setTimeout(() => {
      setSubscribed(false);
      setEmail("");
    }, 3000);
  };

  return (
    <footer className="bg-gradient-to-b from-dark-300 to-black text-white border-t border-white/10 relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-purple-600/20 blur-3xl"></div>
        <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl"></div>
        <div className="absolute bottom-10 left-1/3 w-60 h-60 rounded-full bg-blue-600/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              {/* <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-lg">A</span>
              </div> */}
              <Image src={"/favicon.ico"} alt="logo" height={30} width={30} />
              <span className="font-bold text-2xl font-space tracking-tight">
                AutoSOL
              </span>
            </div>
            <p className="text-white/80 text-base leading-relaxed">
              Automate recurring payments on Solana with unparalleled security
              and simplicity. The future of crypto payments is here.
            </p>
            <div className="flex gap-5">
              {socialLinks.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  aria-label={item.label}
                  className="group"
                >
                  <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                    <item.icon className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {navigationSections.map((section, sectionIndex) => (
            <motion.div
              key={sectionIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * (sectionIndex + 1) }}
              className="space-y-5"
            >
              <h3 className="font-bold text-xl font-space tracking-tight">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href="#"
                      className="group flex items-center gap-1 text-white/70 hover:text-white transition-colors text-base"
                    >
                      <span className="relative">
                        {link}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-5"
          >
            <h3 className="font-bold text-xl font-space tracking-tight">
              Stay Updated
            </h3>
            <p className="text-white/80 text-base">
              Get early access to new features and updates.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 py-6 pr-16 focus:border-purple-500 focus:ring-purple-500/50"
                />
                <AnimatePresence mode="wait">
                  {!subscribed ? (
                    <motion.div
                      key="subscribe"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Button
                        type="submit"
                        className="absolute right-1 top-2 bottom-1 px-3 bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-lg shadow-purple-500/20"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-3 top-0 h-full flex items-center"
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}

              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-400 text-sm"
                >
                  Thanks for subscribing!
                </motion.p>
              )}
            </form>

            <div className="pt-2">
              <p className="text-white/60 text-sm">
                By subscribing, you agree to our Privacy Policy and Terms of
                Service.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <p className="text-white/70 text-sm">
            © {currentYear} AutoSOL. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-8">
            {footerLinks.map((item, index) => (
              <Link
                key={index}
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm relative group"
              >
                <span className="relative">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
