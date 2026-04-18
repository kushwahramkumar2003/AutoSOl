"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getTokenLogo, getTokenLogoBySymbol } from "@/lib/token-registry";

interface TokenAvatarProps {
  symbol: string;
  mint?: string | null;
  isSol?: boolean;
  iconUrl?: string | null;
  size?: number;
  className?: string;
}

function buildFallbackLabel(symbol: string): string {
  const cleaned = symbol.replace(/^SPL:/i, "").trim().toUpperCase();
  if (!cleaned) {
    return "?";
  }

  return cleaned.slice(0, Math.min(cleaned.length, 2));
}

function buildFallbackColor(symbol: string): string {
  let hash = 0;
  for (let index = 0; index < symbol.length; index += 1) {
    hash = symbol.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 45%)`;
}

export function TokenAvatar({
  symbol,
  mint,
  isSol = false,
  iconUrl,
  size = 20,
  className,
}: TokenAvatarProps) {
  const resolvedIcon =
    iconUrl ||
    (mint ? getTokenLogo(mint, isSol) : null) ||
    getTokenLogoBySymbol(symbol);

  if (resolvedIcon) {
    return (
      <Image
        src={resolvedIcon}
        alt={symbol}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: buildFallbackColor(symbol),
        fontSize: Math.max(10, Math.floor(size * 0.42)),
        lineHeight: 1,
      }}
    >
      {buildFallbackLabel(symbol)}
    </span>
  );
}
