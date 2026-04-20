export const DEFAULT_HTTP_BACKEND_WALLET = "87VLrSJaRt2i4abjU9dmcNhZHA5PYoVu13iaoDfak6ye";

export function getConfiguredBackendWallet(): string {
  return (
    process.env.NEXT_PUBLIC_AUTOSOL_HTTP_BACKEND_WALLET ||
    DEFAULT_HTTP_BACKEND_WALLET
  );
}

function parseWalletList(value?: string): string[] {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      // Fall through to tolerant CSV parsing below.
    }
  }

  return trimmed
    .split(",")
    .map((item) => item.replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, "").trim())
    .filter(Boolean);
}

export function getConfiguredAdminWallet(): string | null {
  const wallet = process.env.NEXT_PUBLIC_AUTOSOL_ADMIN_WALLET?.trim();
  return wallet || null;
}

export function getConfiguredFeeCollectorWallets(): string[] {
  return parseWalletList(process.env.NEXT_PUBLIC_AUTOSOL_FEE_COLLECTOR_WALLETS);
}
