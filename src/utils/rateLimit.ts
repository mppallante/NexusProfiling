const lastRunByKey = new Map<string, number>();

export async function enforceConnectorRateLimit(key: string, minimumIntervalMs: number): Promise<void> {
  const now = Date.now();
  const lastRun = lastRunByKey.get(key) ?? 0;
  const waitMs = Math.max(0, lastRun + minimumIntervalMs - now);

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  lastRunByKey.set(key, Date.now());
}
