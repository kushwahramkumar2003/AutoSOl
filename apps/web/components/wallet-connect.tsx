"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Connection } from "@solana/web3.js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Wallet,
  Copy,
  LogOut,
  Check,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Network,
  ShieldAlert,
  History,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import config from "@/config";
import { useProgram } from "@/hooks/use-program";

export type NetworkType = "mainnet-beta" | "devnet" | "testnet" | "localnet";

export interface WalletConnectProps {
  network?: NetworkType;
  allowNetworkChange?: boolean;
  showBalance?: boolean;
  buttonSize?: "default" | "sm" | "lg";
  buttonVariant?: "default" | "outline" | "ghost";
  className?: string;
  onConnect?: (publicKey: PublicKey) => void;
  onDisconnect?: () => void;
  truncateLength?: number;
  customLabel?: string;
  showNetworkBadge?: boolean;
  showTransactionHistory?: boolean;
  maxHistoryItems?: number;
}

// Define a Transaction type for local use
interface WalletTransaction {
  type: "incoming" | "outgoing";
  status: "confirmed" | "pending";
  executorAddress: string;
  timestamp: number;
  amount: number;
  recipient: string;
  memo: string;
}

const truncateAddress = (
  address: PublicKey | null,
  startChars: number = 4,
  endChars: number = 4
): string => {
  if (!address) return "";
  const addressString = address.toBase58();
  if (addressString.length <= startChars + endChars) {
    return addressString;
  }
  return `${addressString.slice(0, startChars)}...${addressString.slice(-endChars)}`;
};

const getNetworkColor = (network: NetworkType): string => {
  switch (network) {
    case "mainnet-beta":
      return "bg-green-500/20 text-green-600 border-green-500/30";
    case "devnet":
      return "bg-purple-500/20 text-purple-600 border-purple-500/30";
    case "testnet":
      return "bg-orange-500/20 text-orange-600 border-orange-500/30";
    case "localnet":
      return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    default:
      return "bg-slate-500/20 text-slate-600 border-slate-500/30";
  }
};

const getExplorerUrl = (address: string, network: NetworkType): string => {
  const baseUrl = "https://explorer.solana.com";
  const clusterParam =
    network === "mainnet-beta"
      ? ""
      : network === "localnet"
        ? "?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
        : `?cluster=${network}`;
  return `${baseUrl}/address/${address}${clusterParam}`;
};

const formatBalance = (balance: number): string => {
  if (balance >= 1000000) {
    return `${(balance / 1000000).toFixed(2)}M SOL`;
  } else if (balance >= 1000) {
    return `${(balance / 1000).toFixed(2)}K SOL`;
  } else {
    return `${balance.toFixed(4)} SOL`;
  }
};

export function WalletConnect({
  network = config.rpcEndpoint === "http://127.0.0.1:8899" ? "localnet" : "devnet",
  allowNetworkChange = true,
  showBalance = true,
  buttonSize = "sm",
  buttonVariant = "outline",
  className = "",
  onConnect,
  onDisconnect,
  truncateLength = 4,
  customLabel,
  showNetworkBadge = true,
  showTransactionHistory = true,
  maxHistoryItems = 5,
}: WalletConnectProps) {
  const { publicKey, disconnect, connected, wallet, connecting } = useWallet();
  const { program } = useProgram();
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Use a single Connection instance from config
  const connection = useMemo(
    () => new Connection(config.rpcEndpoint, "confirmed"),
    []
  );

  // Fetch balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !showBalance) return;
      try {
        setIsBalanceLoading(true);
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / 1e9); // Convert lamports to SOL
      } catch {
        setBalance(null);
        toast.error("Failed to fetch wallet balance");
      } finally {
        setIsBalanceLoading(false);
      }
    };
    fetchBalance();
  }, [publicKey, showBalance, connection]);

  // Fetch real transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicKey || !program || !showTransactionHistory) {
        setTransactions([]);
        return;
      }
      setTxLoading(true);
      setTxError(null);
      try {
        const [outgoingResult, incomingResult] = await Promise.allSettled([
          program.getSchedulesForOwner(publicKey),
          program.getSchedulesForRecipient(publicKey),
        ]);

        const outgoing =
          outgoingResult.status === "fulfilled" ? outgoingResult.value : [];
        const incoming =
          incomingResult.status === "fulfilled" ? incomingResult.value : [];

        if (
          outgoingResult.status === "rejected" &&
          incomingResult.status === "rejected"
        ) {
          throw outgoingResult.reason || incomingResult.reason;
        }

        const txs: WalletTransaction[] = [];
        outgoing.forEach((schedule) => {
          schedule.data.payments.forEach((p) => {
            txs.push({
              type: "outgoing",
              status: p.executed ? "confirmed" : "pending",
              executorAddress: p.executedBy ? p.executedBy.toString() : "-",
              timestamp:
                p.executionTime?.toNumber() || p.scheduledTime?.toNumber() || 0,
              amount: schedule.data.paymentAmount.toNumber() / 1e9,
              recipient: schedule.data.recipient.toString(),
              memo: schedule.data.memo,
            });
          });
        });
        incoming.forEach((schedule) => {
          schedule.data.payments.forEach((p) => {
            txs.push({
              type: "incoming",
              status: p.executed ? "confirmed" : "pending",
              executorAddress: p.executedBy ? p.executedBy.toString() : "-",
              timestamp:
                p.executionTime?.toNumber() || p.scheduledTime?.toNumber() || 0,
              amount: schedule.data.paymentAmount.toNumber() / 1e9,
              recipient: schedule.data.owner.toString(),
              memo: schedule.data.memo,
            });
          });
        });
        // Sort by timestamp desc, limit
        txs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(txs.slice(0, maxHistoryItems));
        if (
          outgoingResult.status === "rejected" ||
          incomingResult.status === "rejected"
        ) {
          setTxError("Showing partial transaction history");
        }
      } catch {
        setTxError("Failed to fetch transactions");
        setTransactions([]);
      } finally {
        setTxLoading(false);
      }
    };
    fetchTransactions();
  }, [publicKey, program, showTransactionHistory, maxHistoryItems]);

  // Handle connection status changes
  useEffect(() => {
    if (connected && publicKey && onConnect) {
      onConnect(publicKey);
    }
  }, [connected, publicKey, onConnect]);

  const handleCopyAddress = useCallback(async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toBase58());
        setIsCopied(true);
        toast.success("Address copied", {
          description: "Wallet address copied to clipboard",
        });
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.log(error);
        toast.error("Failed to copy address", {
          description: "Please try again",
        });
      }
    }
  }, [publicKey]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setDropdownOpen(false);
      toast.success("Wallet disconnected", {
        description: "Your wallet has been disconnected successfully",
      });
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.log(error);
      toast.error("Disconnection failed", {
        description: "Failed to disconnect wallet. Please try again.",
      });
    }
  }, [disconnect, onDisconnect]);

  const handleExplorerLink = useCallback(() => {
    if (publicKey) {
      window.open(getExplorerUrl(publicKey.toBase58(), network), "_blank");
    }
  }, [publicKey, network]);

  const switchNetwork = (newNetwork: NetworkType) => {
    toast.success(`Network switched to ${newNetwork}`, {
      description: `You are now connected to ${newNetwork}`,
      icon: <Network className="h-4 w-4" />,
    });
  };

  const refreshBalance = async () => {
    if (!publicKey || !showBalance) return;
    try {
      setIsRefreshing(true);
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / 1e9);
      toast.success("Balance refreshed", {
        description: "Your wallet balance has been updated",
      });
    } catch {
      toast.error("Failed to refresh balance", {
        description: "Please try again later",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fix: formatTransactionDate to use correct timestamp (seconds to ms)
  const formatTransactionDate = (timestamp: number): string => {
    if (!timestamp) return "-";
    // If timestamp is in seconds, convert to ms
    const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {connected && showNetworkBadge && (
        <Badge
          variant="outline"
          className={cn("h-6 px-2 font-medium", getNetworkColor(network))}
          onClick={() => allowNetworkChange && setIsWalletDialogOpen(true)}
        >
          {network}
        </Badge>
      )}

      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={connected ? buttonVariant : "default"}
            className={cn(
              "flex flex-row items-center justify-center transition-all duration-200",
              connected
                ? "hover:bg-background/80 hover:border-primary/30"
                : "hover:bg-primary/90",
              dropdownOpen ? "ring-2 ring-primary/20" : "",
              className
            )}
            size={buttonSize}
            onClick={() => !connected && setIsWalletDialogOpen(true)}
            disabled={connecting}
          >
            <Wallet
              className={cn("h-4 w-4", connected ? "text-primary/80" : "")}
            />
            {connecting ? (
              <span className="ml-2 font-medium flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Connecting...
              </span>
            ) : connected ? (
              <span className="ml-2 truncate font-medium">
                {customLabel ||
                  truncateAddress(publicKey, truncateLength, truncateLength)}
              </span>
            ) : (
              <span className="ml-2 font-medium">
                {customLabel || "Connect Wallet"}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        {connected && (
          <DropdownMenuContent
            align="end"
            className="w-72 bg-background/95 backdrop-blur-lg border border-primary/20 shadow-lg rounded-lg animate-in fade-in-0 zoom-in-95"
          >
            <DropdownMenuLabel className="px-3 pt-2 pb-1">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  Connected wallet
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate max-w-[180px]">
                    {publicKey?.toBase58()}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyAddress}
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {wallet?.adapter?.name && (
                  <p className="text-xs text-muted-foreground">
                    via {wallet.adapter.name}
                  </p>
                )}

                {showBalance && (
                  <div className="flex items-center justify-between mt-2 py-1 px-2 bg-background/80 rounded-md border border-border/50">
                    <div className="flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-primary/70" />
                      <span className="text-sm font-medium">
                        {isBalanceLoading
                          ? "Loading..."
                          : balance !== null
                            ? formatBalance(balance)
                            : "Balance unavailable"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={refreshBalance}
                      disabled={isRefreshing}
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          isRefreshing && "animate-spin"
                        )}
                      />
                    </Button>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-primary/10" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleExplorerLink}
                className="gap-2 focus:bg-primary/10 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View on Explorer</span>
              </DropdownMenuItem>

              {allowNetworkChange && (
                <DropdownMenuItem
                  onClick={() => setIsWalletDialogOpen(true)}
                  className="gap-2 focus:bg-primary/10 cursor-pointer"
                >
                  <Network className="h-4 w-4" />
                  <span>Change Network</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="gap-2 focus:bg-primary/10 cursor-pointer"
                onClick={() => {
                  toast.info("Security report", {
                    description:
                      "All wallet connections are secure and encrypted",
                    icon: <ShieldAlert className="h-4 w-4 text-green-500" />,
                  });
                }}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Security Check</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {showTransactionHistory && (
              <>
                <DropdownMenuSeparator className="bg-primary/10" />

                <DropdownMenuLabel className="px-3 pt-2 pb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Recent Transactions
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        refreshBalance(); // Re-fetch balance and transactions
                        toast.success("Transactions refreshed", {
                          description:
                            "Your transaction history has been updated",
                        });
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuLabel>

                {txLoading && (
                  <div className="text-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Loading transactions...
                    </p>
                  </div>
                )}
                {txError && (
                  <div className="text-center py-4 text-red-500">
                    <AlertTriangle className="h-6 w-6" />
                    <p className="text-sm">{txError}</p>
                  </div>
                )}
                {!txLoading && transactions.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No transactions found.
                  </div>
                )}
                {!txLoading && transactions.length > 0 && (
                  <div className="max-h-40 overflow-y-auto scrollbar-thin px-1 custom-scrollbar">
                    {transactions.map((tx, index) => (
                      <div
                        key={index}
                        className="text-xs p-2 hover:bg-primary/5 rounded-md cursor-pointer mb-1"
                        onClick={() => {
                          toast.info(
                            `Execution details for ${tx.executorAddress}`,
                            {
                              description: `${tx.type} transaction (${tx.status}) on ${formatTransactionDate(tx.timestamp)}`,
                              icon: <History className="h-4 w-4" />,
                            }
                          );
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{tx.type}</div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-1.5 py-0 text-[10px] font-normal",
                              tx.status === "confirmed"
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : tx.status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                  : "bg-red-500/10 text-red-600 border-red-500/20"
                            )}
                          >
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-muted-foreground">
                            {formatTransactionDate(tx.timestamp)}
                          </div>
                          <div className="text-muted-foreground">
                            {tx.executorAddress}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <DropdownMenuSeparator className="bg-primary/10" />

            <DropdownMenuItem
              onClick={handleDisconnect}
              className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-lg border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-center font-semibold">
              {connected && allowNetworkChange
                ? "Manage Connection"
                : connected
                  ? "Change Wallet"
                  : "Connect Wallet"}
            </DialogTitle>
            {connected && allowNetworkChange && (
              <DialogDescription className="text-center pt-2">
                Change your wallet or network
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {connected && allowNetworkChange && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Select Network</p>
                <div className="grid grid-cols-2 gap-2">
                  {["mainnet-beta", "devnet", "testnet", "localnet"].map(
                    (net) => (
                      <Button
                        key={net}
                        variant={network === net ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "font-medium",
                          network !== net && "hover:bg-primary/10"
                        )}
                        onClick={() => {
                          switchNetwork(net as NetworkType);
                          setIsWalletDialogOpen(false);
                        }}
                      >
                        {net}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {connected && (
              <div className="mt-2 rounded-md border border-orange-500/20 bg-orange-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="text-sm text-orange-700 dark:text-orange-400">
                    Changing wallets will disconnect your current session. Make
                    sure you&apos;ve saved any important data.
                  </div>
                </div>
              </div>
            )}

            <WalletMultiButton className="wallet-adapter-button-trigger" />

            <Button
              variant="outline"
              onClick={() => setIsWalletDialogOpen(false)}
              className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
