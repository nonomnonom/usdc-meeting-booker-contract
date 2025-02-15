/**
 * Supabase Client Configuration
 * Handles database operations for notifications and announcements.
 * Provides persistent storage for notification tokens and announcement data.
 */
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Initialize Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Type definition for announcement data
 */
export type Announcement = {
  id: number
  title: string
  text: string
  created_at: string
  cast_url?: string  // Optional cast URL
}

/**
 * Type definition for notification token data
 */
export type NotificationToken = {
  fid: number
  token: string
  url: string
  created_at: string
  last_used?: string
  is_valid: boolean
}

/**
 * Retrieves all announcements from the database
 * Used for displaying announcements in the UI
 * @returns {Promise<Announcement[]>} Array of announcements
 */
export async function getAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Announcement[]
}

/**
 * Gets the most recent announcement from the database
 * Used for checking if there are new announcements to notify about
 * @returns {Promise<Announcement>} Latest announcement
 */
export async function getLatestAnnouncement() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) throw error
  return data as Announcement
}

/**
 * Gets the latest announcements from the database
 * @param {number} limit - Number of announcements to fetch (default: 5)
 * @returns {Promise<Announcement[]>} Array of latest announcements
 */
export async function getLatestAnnouncements(limit: number = 5) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data as Announcement[]
}

/**
 * Saves a notification token to the database
 * @param {NotificationToken} token - Token details without created_at
 * @returns {Promise<void>}
 */
export async function saveNotificationToken({ fid, token, url }: { 
  fid: number
  token: string
  url: string
}) {
  const { error } = await supabase
    .from('notification_tokens')
    .upsert({
      fid,
      token,
      url,
      created_at: new Date().toISOString(),
      is_valid: true,
      last_used: null
    })

  if (error) throw error
}

/**
 * Removes a notification token from the database
 * Used when notifications are disabled or tokens become invalid
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<void>}
 */
export async function removeNotificationToken(fid: number) {
  const { error } = await supabase
    .from('notification_tokens')
    .update({ is_valid: false })
    .eq('fid', fid)

  if (error) throw error
}

/**
 * Retrieves all valid notification tokens for a user
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<NotificationToken[]>} Array of token details
 */
export async function getNotificationTokens(fid: number) {
  const { data, error } = await supabase
    .from('notification_tokens')
    .select('token, url')
    .eq('fid', fid)
    .eq('is_valid', true)
  
  if (error) throw error
  return data || []
}

/**
 * Updates the last used timestamp for a notification token
 * @param {number} fid - Farcaster user ID
 * @param {string} token - The token that was used
 * @returns {Promise<void>}
 */
export async function updateTokenLastUsed(fid: number, token: string) {
  const { error } = await supabase
    .from('notification_tokens')
    .update({ last_used: new Date().toISOString() })
    .eq('fid', fid)
    .eq('token', token)

  if (error) throw error
}

/**
 * Marks a token as invalid
 * @param {number} fid - Farcaster user ID
 * @param {string} token - The invalid token
 * @returns {Promise<void>}
 */
export async function invalidateToken(fid: number, token: string) {
  const { error } = await supabase
    .from('notification_tokens')
    .update({ is_valid: false })
    .eq('fid', fid)
    .eq('token', token)

  if (error) throw error
}

// Booking management
export async function getBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('cal_bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .single()

  if (error) throw error
  return data
}

export async function updateBookingStatus(bookingId: string, status: string, txHash?: string) {
  const { error } = await supabase
    .from('cal_bookings')
    .update({ 
      status,
      ...(txHash ? { tx_hash: txHash } : {})
    })
    .eq('booking_id', bookingId)

  if (error) throw error
}