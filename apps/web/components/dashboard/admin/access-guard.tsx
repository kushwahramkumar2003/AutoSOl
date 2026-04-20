"use client";

import type React from "react";
import { ShieldAlert, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AccessGuardProps {
  connected: boolean;
  allowed: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AccessGuard({
  connected,
  allowed,
  title,
  description,
  children,
}: AccessGuardProps) {
  if (!connected) {
    return (
      <Alert className="border-white/[0.08] bg-white/[0.02] text-slate-200 [&>svg]:text-slate-300">
        <Wallet className="h-4 w-4" />
        <AlertTitle>Wallet required</AlertTitle>
        <AlertDescription>
          Connect an authorized wallet before opening this sensitive route.
        </AlertDescription>
      </Alert>
    );
  }

  if (!allowed) {
    return (
      <Alert className="border-red-500/30 bg-red-500/10 text-red-50 [&>svg]:text-red-200">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
