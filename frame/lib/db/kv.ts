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

// Rate limiting constants
const RATE_LIMIT_PREFIX = "rate_limit:notification:"
const RATE_LIMIT_WINDOW = 30 // 30 seconds per token
const RATE_LIMIT_MAX_PER_WINDOW = 1 // 1 notification per 30 seconds
const RATE_LIMIT_MAX_PER_DAY = 100 // 100 notifications per day

// Token caching constants
const NOTIFICATION_TOKEN_PREFIX = "notification_token:"
const NOTIFICATION_TOKEN_TTL = 60 * 60 * 24 // 24 hours

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
 * Cache a user's notification token with improved validation
 * @param {number} fid - Farcaster user ID
 * @param {string} token - Notification token
 * @param {string} url - Notification endpoint URL
 */
export async function cacheNotificationToken(fid: number, token: string, url: string) {
  if (!token || !url) {
    throw new Error('Invalid token or URL')
  }

  const key = `${NOTIFICATION_TOKEN_PREFIX}${fid}`
  const data = {
    token,
    url,
    cached_at: new Date().toISOString()
  }
  
  await redis.set(key, JSON.stringify(data), { ex: NOTIFICATION_TOKEN_TTL })
}

/**
 * Retrieve a cached notification token and URL for a user
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<{ token: string; url: string } | null>} Cached token details or null if not found
 */
export async function getCachedNotificationToken(fid: number) {
  const data = await redis.get<string>(`${NOTIFICATION_TOKEN_PREFIX}${fid}`)
  if (!data) return null
  return JSON.parse(data) as { token: string; url: string; cached_at: string }
}

/**
 * Remove a cached notification token for a user
 * Used when tokens become invalid or notifications are disabled
 * @param {number} fid - Farcaster user ID
 */
export async function removeCachedNotificationToken(fid: number) {
  await redis.del(`${NOTIFICATION_TOKEN_PREFIX}${fid}`)
}

/**
 * Check if a notification is within rate limits
 * Implements Farcaster's rate limiting rules:
 * - 1 notification per 30 seconds per token
 * - 100 notifications per day per token
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<boolean>} True if within rate limits
 */
export async function checkNotificationRateLimit(fid: number): Promise<boolean> {
  const windowKey = `${RATE_LIMIT_PREFIX}${fid}:window`
  const dailyKey = `${RATE_LIMIT_PREFIX}${fid}:daily`
  
  // Check window rate limit
  const windowCount = await redis.incr(windowKey)
  if (windowCount === 1) {
    await redis.expire(windowKey, RATE_LIMIT_WINDOW)
  }
  
  // Check daily rate limit
  const dailyCount = await redis.incr(dailyKey)
  if (dailyCount === 1) {
    await redis.expire(dailyKey, 24 * 60 * 60) // 24 hours
  }
  
  return windowCount <= RATE_LIMIT_MAX_PER_WINDOW && dailyCount <= RATE_LIMIT_MAX_PER_DAY
}

// Announcement tracking
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