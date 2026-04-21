"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ExternalLink,
  Lock,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { WalletConnect } from "@/components/wallet-connect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-background to-background/80" />
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/20 blur-3xl"
          initial={{
            width: `${Math.random() * 30 + 15}%`,
            height: `${Math.random() * 30 + 15}%`,
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0.3,
          }}
          animate={{
            x: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
            ],
            y: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
            ],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const StatsAnimation = () => {
  const stats = [
    { label: "Automated Payments", value: "10M+" },
    { label: "Wallet Sessions", value: "500K+" },
    { label: "Execution Speed", value: "400ms" },
    { label: "Reliability", value: "99.99%" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-background/50 p-3 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index, duration: 0.5 }}
        >
          <motion.div
            className="text-lg font-bold text-primary"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.5 + 0.1 * index,
              duration: 0.5,
              type: "spring",
            }}
          >
            {stat.value}
          </motion.div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

const Features = () => {
  const features = [
    "Wallet-native access without server-side sign-in",
    "Direct on-chain interaction from the connected wallet",
    "Network switching for devnet, mainnet, testnet, and localnet",
    "No nonce, signature challenge, or session dependency",
  ];

  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-medium">What changed</h3>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            className="flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 * index, duration: 0.4 }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            {feature}
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default function AuthPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [viewState, setViewState] = useState<"welcome" | "wallet">("welcome");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      return;
    }

    setRedirecting(true);
    toast.success("Wallet connected", {
      description: "Opening dashboard for the connected wallet.",
    });
    router.replace("/dashboard");
  }, [connected, publicKey, router]);

  const handleWalletConnect = (pubKey: PublicKey) => {
    toast.success("Wallet connected successfully", {
      description: `Connected to ${pubKey.toBase58().slice(0, 8)}...`,
    });
    setRedirecting(true);
    router.replace("/dashboard");
  };

  const handleWalletDisconnect = () => {
    setRedirecting(false);
    setViewState("welcome");
    toast.info("Wallet disconnected", {
      description: "Your wallet has been disconnected.",
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 mx-auto w-full max-w-md"
      >
        <Card className="border border-primary/20 bg-background/95 shadow-xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold tracking-tight">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent"
                >
                  AutoSOL
                </motion.span>
              </CardTitle>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
              >
                <Lock className="h-6 w-6 text-primary/70" />
              </motion.div>
            </div>

            <CardDescription className="text-sm text-muted-foreground">
              Connect a wallet and interact directly with the app. No server session required.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {viewState === "welcome" && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-semibold">Wallet-first access</h2>
                    <p className="text-sm text-muted-foreground">
                      Connect your Solana wallet to open the dashboard and sign on-chain actions only when needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="default"
                      className="group relative w-full overflow-hidden"
                      onClick={() => setViewState("wallet")}
                    >
                      <motion.div
                        className="absolute inset-0 -translate-x-full bg-primary/10"
                        animate={{ x: ["100%", "0%", "0%", "-100%"] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      />
                      <span className="flex items-center justify-center gap-2">
                        <WalletIcon className="h-4 w-4" />
                        Connect Wallet
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </span>
                    </Button>
                  </div>

                  <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                    <div className="flex flex-row gap-3">
                      <ShieldCheck className="mt-0.5 text-primary" size={100} />
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Direct wallet flow</h3>
                        <p className="text-xs text-muted-foreground">
                          The app now uses your connected wallet directly. There is no separate nonce or signature-based login session to maintain.
                        </p>
                      </div>
                    </div>
                  </div>

                  <StatsAnimation />
                </motion.div>
              )}

              {viewState === "wallet" && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Connect your wallet</h2>
                    <p className="text-sm text-muted-foreground">
                      Connect on the network you want to use. Once connected, you go straight to the dashboard.
                    </p>
                  </div>

                  <div className="flex justify-center py-4">
                    <WalletConnect
                      buttonSize="lg"
                      buttonVariant="default"
                      className="w-full"
                      showBalance={true}
                      onConnect={handleWalletConnect}
                      onDisconnect={handleWalletDisconnect}
                      customLabel={redirecting ? "Opening Dashboard..." : "Connect Wallet"}
                    />
                  </div>

                  {publicKey && (
                    <div className="rounded-lg border border-border bg-background/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Connected wallet</span>
                        <a
                          href={`https://explorer.solana.com/address/${publicKey.toBase58()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="mt-1 truncate font-mono text-sm">
                        {publicKey.toBase58()}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                    <div className="flex items-start space-x-2">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">No extra auth step</h3>
                        <p className="text-xs text-muted-foreground">
                          Wallet connection is enough to use the app. Transaction signatures still happen in your wallet when an on-chain action is submitted.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full text-sm text-muted-foreground"
                    onClick={() => setViewState("welcome")}
                  >
                    ← Back
                  </Button>

                  <Features />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 border-t border-primary/10 pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Wallet connection only identifies the active signer in the browser. Sensitive actions still require explicit approval in the wallet.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
