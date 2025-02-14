/**
 * Supabase Client Configuration
 * Handles database operations for notifications and announcements.
 * Provides persistent storage for notification tokens and announcement data.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
  fid: number;
  token: string;
  url: string;
}) {
  const { error } = await supabase
    .from('notification_tokens')
    .upsert({ 
      fid,
      token,
      url,
      created_at: new Date().toISOString()
    });

  if (error) throw error;
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
    .delete()
    .eq('fid', fid);

  if (error) throw error;
}

/**
 * Retrieves all notification tokens for a user
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<NotificationToken[]>} Array of token details
 */
export async function getNotificationTokens(fid: number) {
  const { data, error } = await supabase
    .from('notification_tokens')
    .select('token, url')
    .eq('fid', fid);

  if (error) throw error;
  return data || [];
}

// Booking management
export async function getBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('cal_bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBookingStatus(bookingId: string, status: string, txHash?: string) {
  const { error } = await supabase
    .from('cal_bookings')
    .update({ 
      status,
      ...(txHash ? { tx_hash: txHash } : {})
    })
    .eq('booking_id', bookingId);

  if (error) throw error;
}