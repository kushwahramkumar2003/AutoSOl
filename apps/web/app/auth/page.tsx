"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletConnect } from "@/components/wallet-connect";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import bs58 from "bs58";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  ShieldCheck,
  Wallet as WalletIcon,
  Fingerprint,
  Lock,
  ExternalLink,
} from "lucide-react";

// Animated background blob component
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

// Animated floating objects
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { icon: <WalletIcon size={18} />, delay: 0 },
        { icon: <ShieldCheck size={18} />, delay: 1 },
        { icon: <Fingerprint size={18} />, delay: 2 },
      ].map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/40"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            y: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
            ],
            x: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
            ],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 15,
            delay: item.delay * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {item.icon}
        </motion.div>
      ))}
    </div>
  );
};

// Stats animation component
const StatsAnimation = () => {
  const stats = [
    { label: "Secure Transactions", value: "10M+" },
    { label: "Wallet Connections", value: "500K+" },
    { label: "Transaction Speed", value: "400ms" },
    { label: "Blockchain Reliability", value: "99.99%" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="flex flex-col items-center justify-center p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20"
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

// Features list component
const Features = () => {
  const features = [
    "Secure wallet authentication",
    "Multi-chain support",
    "Fast transaction processing",
    "Enhanced security with signature verification",
  ];

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-2">Key Features</h3>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            className="flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 * index, duration: 0.4 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {feature}
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

const AuthPage = () => {
  const { publicKey, signMessage } = useWallet();
  const [viewState, setViewState] = useState<
    "welcome" | "wallet" | "signature"
  >("welcome");
  //eslint-disable-next-line
  const [signature, setSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nonce, setNonce] = useState<string>("");

  // Generate nonce for signature when component mounts
  useEffect(() => {
    const generateNonce = () => {
      const randomString = Math.random().toString(36).substring(2, 15);
      setNonce(`Sign this message to verify your wallet: ${randomString}`);
    };
    generateNonce();
  }, []);

  // Handle wallet connection
  const handleWalletConnect = (pubKey: PublicKey) => {
    toast.success("Wallet connected successfully", {
      description: `Connected to ${pubKey.toBase58().slice(0, 8)}...`,
    });
    setViewState("signature");
  };

  // Handle wallet disconnection
  const handleWalletDisconnect = () => {
    setViewState("welcome");
    setSignature(null);
    toast.info("Wallet disconnected", {
      description: "Your wallet has been disconnected",
    });
  };

  // Sign message with connected wallet
  const handleSignMessage = async () => {
    if (!publicKey || !signMessage) {
      toast.error("Wallet not connected properly");
      return;
    }

    try {
      setIsLoading(true);
      // Create a message encoder
      const encoder = new TextEncoder();
      // Encode the nonce
      const message = encoder.encode(nonce);
      // Sign the encoded message
      const signatureBytes = await signMessage(message);
      // Convert signature to base64 string
      const signatureBase58 = bs58.encode(signatureBytes);

      setSignature(signatureBase58);
      toast.success("Message signed successfully");

      // Attempt to sign in with next-auth
      await handleSignIn(signatureBase58);
    } catch (error) {
      console.error("Error signing message:", error);
      toast.error("Failed to sign message", {
        description: "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet-based sign in
  const handleSignIn = async (sig: string) => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("signin", {
        publicKey: publicKey.toBase58(),
        signature: sig,
        nonce,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Authentication failed", {
          description: result.error,
        });
        return;
      }

      if (result?.status === 200) {
        toast.success("Signed in successfully", {
          description: "Redirecting to dashboard...",
        });

        // Redirect to dashboard or home page after successful login
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Authentication failed", {
        description: "Please check your wallet connection and try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      <AnimatedBackground />
      <FloatingElements />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md mx-auto"
      >
        <Card className="border border-primary/20 shadow-xl bg-background/95 backdrop-blur-xl">
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
              Secure, automated recurring payments on Solana
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
                    <h2 className="text-xl font-semibold">
                      Welcome to AutoSOL
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Connect your Solana wallet to get started
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="default"
                      className="w-full relative overflow-hidden group"
                      onClick={() => setViewState("wallet")}
                    >
                      <motion.div
                        className="absolute inset-0 bg-primary/10 transform -translate-x-full"
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

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <div className="flex flex-row gap-3">
                      <ShieldCheck className="text-primary mt-0.5" size={100} />
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">
                          Secure Authentication
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Connect your wallet to sign in securely. We never
                          store your private keys and use signature verification
                          to protect your account.
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
                    <h2 className="text-xl font-semibold">
                      Connect your wallet
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Connect your Solana wallet to continue
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
                      customLabel="Connect Wallet"
                    />
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <div className="flex items-start space-x-2">
                      <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">
                          Secure Connection
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Your wallet connects securely, and we never store
                          private keys. You&apos;ll be asked to sign a message
                          to verify ownership.
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

              {viewState === "signature" && (
                <motion.div
                  key="signature"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">
                      Verify wallet ownership
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Please sign the message below to verify your wallet
                      ownership
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm font-mono break-all">{nonce}</p>
                  </div>

                  {publicKey && (
                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Connected wallet
                        </span>
                        <a
                          href={`https://explorer.solana.com/address/${publicKey.toBase58()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-primary hover:underline"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="mt-1 font-mono text-sm truncate">
                        {publicKey.toBase58()}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSignMessage}
                    className="w-full relative overflow-hidden"
                    disabled={isLoading || !publicKey}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-4 w-4 border-2 border-background border-r-transparent rounded-full"
                      />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        Sign Message to Continue
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-sm text-muted-foreground"
                    onClick={() => setViewState("wallet")}
                  >
                    ← Change wallet
                  </Button>

                  <Features />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 border-t border-primary/10 pt-4">
            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{" "}
              <Button variant="link" className="h-auto p-0 text-xs">
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="h-auto p-0 text-xs">
                Privacy Policy
              </Button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
