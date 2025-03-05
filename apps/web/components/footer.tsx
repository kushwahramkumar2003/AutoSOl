"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Twitter, Github, Linkedin, Send } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-dark-300 text-white border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center shadow-neon">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-xl font-space">AutoSOL</span>
            </div>
            <p className="text-white/70 text-sm">
              Automate recurring payments on Solana with ease. Schedule, manage, and track your payments in one place.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-white/70 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-white/70 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-white/70 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-lg font-space">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  Documentation
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  API Reference
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-lg font-space">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  About Us
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  Blog
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  Careers
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-lg font-space">Stay Updated</h3>
            <p className="text-white/70 text-sm">Subscribe to our newsletter for the latest updates and features.</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
              <Button className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-white/70 text-sm">© {new Date().getFullYear()} AutoSOL. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
              Privacy Policy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
              Terms of Service
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm relative group">
              Legal
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6E56CF] to-[#10B981] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

