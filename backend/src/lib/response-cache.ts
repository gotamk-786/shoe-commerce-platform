type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const responseCache = new Map<string, CacheEntry<unknown>>();

export const getCachedResponse = <T>(key: string): T | undefined => {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return undefined;
  }
  return entry.value as T;
};

export const setCachedResponse = <T>(key: string, value: T, ttlMs: number) => {
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

export const clearCachedResponse = (key: string) => {
  responseCache.delete(key);
};

export const clearCachedResponseByPrefix = (prefix: string) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
};
