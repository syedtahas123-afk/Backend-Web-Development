'use strict';

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  lazyConnect: true,
});

// Keep Redis connection errors observable without allowing them to crash the app.
redis.on('error', (err) => {
  console.error('[cache] Redis error:', err.message);
});

// Return null for a miss or an unavailable/invalid cache entry so callers
// can safely fall back to the database.
async function cacheGet(key) {
  try {
    const value = await redis.get(key);
    return value === null ? null : JSON.parse(value);
  } catch (err) {
    console.error('[cache] GET failed:', err.message);
    return null;
  }
}

// Cache writes are best-effort. Always pass an expiry to avoid stale keys
// living forever.
async function cacheSet(key, data, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.error('[cache] SET failed:', err.message);
  }
}

// Invalidation is also best-effort; the TTL remains the safety net.
async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[cache] DEL failed:', err.message);
  }
}

module.exports = { cacheGet, cacheSet, cacheDel };
