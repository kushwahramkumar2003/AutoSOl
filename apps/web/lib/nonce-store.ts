const NONCE_TTL_MS = 5 * 60 * 1000;

interface NonceEntry {
  nonce: string;
  expiresAt: number;
}

export const nonceStore = new Map<string, NonceEntry>();

setInterval(() => {
  const now = Date.now();

  Array.from(nonceStore.entries()).forEach(([key, entry]) => {
    if (entry.expiresAt <= now) {
      nonceStore.delete(key);
    }
  });
}, 60_000);

export { NONCE_TTL_MS };
