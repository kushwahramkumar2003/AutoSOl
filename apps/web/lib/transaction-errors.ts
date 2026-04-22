export function isDuplicateTransactionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("duplicate_transaction") ||
    normalized.includes("already been processed") ||
    normalized.includes("already submitted") ||
    normalized.includes("this transaction has already been processed") ||
    normalized.includes("transaction was already submitted")
  );
}

export function getTransactionErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error ? error.message : fallback;
}
