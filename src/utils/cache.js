const cache = new Map();

/**
 * Guarda datos en cache con TTL
 */
export function setCache(key, data, ttlMs = 5 * 60 * 1000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

/**
 * Obtiene datos del cache si no han expirado
 */
export function getCache(key) {
  const cached = cache.get(key);

  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}
