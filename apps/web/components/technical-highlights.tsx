"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function TechnicalHighlights() {
  return (
    <section id="technical" className="py-24 bg-dark-200">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-space gradient-text mb-4">
            Technical Excellence
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Built on Solana for unparalleled speed, security, and
            cost-efficiency.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-6">
              <div className="glass p-6 rounded-xl">
                <pre className="text-sm overflow-x-auto text-white/90">
                  <code className="language-typescript">
                    {`// AutoSOL Smart Contract (simplified)
import { Program } from '@project-serum/anchor';

// Create a recurring payment
async function createRecurringPayment(
  sender: PublicKey,
  recipient: PublicKey,
  amount: number,
  interval: number, // in seconds
  startTime: number, // unix timestamp
) {
  return await program.methods
    .createRecurringPayment(
      recipient,
      new BN(amount),
      new BN(interval),
      new BN(startTime)
    )
    .accounts({
      sender,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}`}
                  </code>
                </pre>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white font-space">
                  Built for Performance
                </h3>
                <p className="text-white/70">
                  AutoSOL leverages Solana's high-performance blockchain to
                  deliver lightning-fast, low-cost recurring payments. Our smart
                  contracts are optimized for efficiency and security.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-white/70">
                      Sub-second confirmation times
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-white/70">
                      Transaction costs under $0.001
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-white/70">
                      Audited smart contracts
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-white/70">
                      Carbon-neutral blockchain operations
                    </span>
                  </li>
                </ul>
              </div>

              <Button
                variant="outline"
                className="border-[#6E56CF] text-[#6E56CF] hover:bg-[#6E56CF]/20 hover:text-white group"
              >
                View Technical Documentation
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="space-y-8">
              <div className="glass p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6E56CF] to-[#10B981]"></div>
                <h3 className="text-xl font-bold text-white mb-4 font-space">
                  Performance Comparison
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Transaction Speed</span>
                      <span className="font-medium text-white">400ms</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#6E56CF] to-[#6E56CF]/70 h-2 rounded-full"
                        style={{ width: "95%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Solana (AutoSOL)</span>
                      <span>Ethereum</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Transaction Cost</span>
                      <span className="font-medium text-white">$0.0005</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#10B981] to-[#10B981]/70 h-2 rounded-full"
                        style={{ width: "98%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Solana (AutoSOL)</span>
                      <span>Ethereum</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Energy Efficiency</span>
                      <span className="font-medium text-white">99.9%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] h-2 rounded-full"
                        style={{ width: "90%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Solana (AutoSOL)</span>
                      <span>Bitcoin</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 shadow-md">
                  <div className="text-[#6E56CF] mb-2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 6V12L16 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white font-space">400ms</h4>
                  <p className="text-sm text-white/70">
                    Average Transaction Time
                  </p>
                </div>

                <div className="glass p-5 shadow-md">
                  <div className="text-[#10B981] mb-2">
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
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white font-space">$0.0005</h4>
                  <p className="text-sm text-white/70">
                    Average Transaction Cost
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
