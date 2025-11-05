// Redis client for caching and real-time data
const redis = require('redis');

let redisClient = null;

/**
 * Initialize Redis connection
 * Used for caching driver locations, ride requests, and surge pricing
 */
async function connectRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('Redis: Connected'));
    redisClient.on('ready', () => console.log('Redis: Ready'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    // Continue without Redis in development (optional)
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return null;
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Cache driver location with TTL (1 minute)
 * Key format: driver:location:{driverId}
 */
async function cacheDriverLocation(driverId, latitude, longitude) {
  if (!redisClient) return;
  try {
    const key = `driver:location:${driverId}`;
    await redisClient.setEx(key, 60, JSON.stringify({ latitude, longitude, timestamp: Date.now() }));
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

/**
 * Get cached driver location
 */
async function getCachedDriverLocation(driverId) {
  if (!redisClient) return null;
  try {
    const key = `driver:location:${driverId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Cache nearby drivers for a location
 * Key format: nearby:drivers:{lat}:{lng}:{radius}
 */
async function cacheNearbyDrivers(lat, lng, radius, drivers) {
  if (!redisClient) return;
  try {
    const key = `nearby:drivers:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
    await redisClient.setEx(key, 30, JSON.stringify(drivers)); // 30 second cache
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

/**
 * Get cached nearby drivers
 */
async function getCachedNearbyDrivers(lat, lng, radius) {
  if (!redisClient) return null;
  try {
    const key = `nearby:drivers:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Invalidate driver location cache
 */
async function invalidateDriverLocation(driverId) {
  if (!redisClient) return;
  try {
    const key = `driver:location:${driverId}`;
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

/**
 * Set idempotency key with TTL (24 hours)
 */
async function setIdempotencyKey(key, value, ttl = 86400) {
  if (!redisClient) return;
  try {
    await redisClient.setEx(`idempotency:${key}`, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis idempotency error:', error);
  }
}

/**
 * Get idempotency key
 */
async function getIdempotencyKey(key) {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(`idempotency:${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis idempotency get error:', error);
    return null;
  }
}

/**
 * Cache surge multiplier for a location
 */
async function cacheSurgeMultiplier(lat, lng, vehicleType, multiplier, ttl = 300) {
  if (!redisClient) return;
  try {
    const key = `surge:${lat.toFixed(4)}:${lng.toFixed(4)}:${vehicleType}`;
    await redisClient.setEx(key, ttl, multiplier.toString());
  } catch (error) {
    console.error('Redis surge cache error:', error);
  }
}

/**
 * Get cached surge multiplier
 */
async function getCachedSurgeMultiplier(lat, lng, vehicleType) {
  if (!redisClient) return null;
  try {
    const key = `surge:${lat.toFixed(4)}:${lng.toFixed(4)}:${vehicleType}`;
    const data = await redisClient.get(key);
    return data ? parseFloat(data) : null;
  } catch (error) {
    console.error('Redis surge get error:', error);
    return null;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  cacheDriverLocation,
  getCachedDriverLocation,
  cacheNearbyDrivers,
  getCachedNearbyDrivers,
  invalidateDriverLocation,
  setIdempotencyKey,
  getIdempotencyKey,
  cacheSurgeMultiplier,
  getCachedSurgeMultiplier,
};

