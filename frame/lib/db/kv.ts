/**
 * Redis client configuration for caching notification tokens and announcement states.
 * Uses Upstash Redis for serverless-friendly operations.
 */
import { Redis } from '@upstash/redis'

// Initialize Redis client with environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Test the Redis connection to ensure the service is available.
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
export async function testConnection() {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis connection error:', error)
    return false
  }
}

/**
 * Generate a consistent key for storing the last seen announcement ID for a user
 * @param {number} fid - Farcaster user ID
 * @returns {string} Redis key for last seen announcement
 */
const LAST_SEEN_KEY = (fid: number) => `last_seen_announcement:${fid}`

/**
 * Retrieve the ID of the last announcement seen by a user
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<number | null>} Last seen announcement ID or null if not found
 */
export async function getLastSeenAnnouncementId(fid: number): Promise<number | null> {
  const id = await redis.get<number>(LAST_SEEN_KEY(fid))
  return id
}

/**
 * Update the last seen announcement ID for a user
 * @param {number} fid - Farcaster user ID
 * @param {number} announcementId - ID of the last seen announcement
 */
export async function setLastSeenAnnouncementId(fid: number, announcementId: number) {
  await redis.set(LAST_SEEN_KEY(fid), announcementId)
}

// Notification token caching
const NOTIFICATION_TOKEN_PREFIX = "notification_token:";
const NOTIFICATION_TOKEN_TTL = 60 * 60 * 24; // 24 hours

/**
 * Cache a user's notification token and URL for faster access
 * Tokens are cached for 24 hours to balance performance and freshness
 * @param {number} fid - Farcaster user ID
 * @param {string} token - Notification token
 * @param {string} url - Notification endpoint URL
 */
export async function cacheNotificationToken(fid: number, token: string, url: string) {
  await redis.set(
    `${NOTIFICATION_TOKEN_PREFIX}${fid}`,
    JSON.stringify({ token, url }),
    { ex: NOTIFICATION_TOKEN_TTL }
  );
}

/**
 * Retrieve a cached notification token and URL for a user
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<{ token: string; url: string } | null>} Cached token details or null if not found
 */
export async function getCachedNotificationToken(fid: number) {
  const data = await redis.get<string>(`${NOTIFICATION_TOKEN_PREFIX}${fid}`);
  if (!data) return null;
  return JSON.parse(data) as { token: string; url: string };
}

/**
 * Remove a cached notification token for a user
 * Used when tokens become invalid or notifications are disabled
 * @param {number} fid - Farcaster user ID
 */
export async function removeCachedNotificationToken(fid: number) {
  await redis.del(`${NOTIFICATION_TOKEN_PREFIX}${fid}`);
}

// Rate limiting for notifications
const RATE_LIMIT_PREFIX = "rate_limit:notification:";
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 notifications per minute

/**
 * Check notification rate limit for a user
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<boolean>} True if within rate limit, false otherwise
 */
export async function checkNotificationRateLimit(fid: number): Promise<boolean> {
  const key = `${RATE_LIMIT_PREFIX}${fid}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  
  return count <= RATE_LIMIT_MAX;
} 