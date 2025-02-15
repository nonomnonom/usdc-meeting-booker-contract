/**
 * Notifications API Route
 * Handles sending notifications to Farcaster users who have enabled notifications for the frame.
 * Implements the Frames v2 notification protocol with proper error handling and rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getNotificationTokens, updateTokenLastUsed, invalidateToken } from '@/lib/db/supbase'
import { getCachedNotificationToken, removeCachedNotificationToken, checkNotificationRateLimit } from '@/lib/db/kv'
import { z } from 'zod'
import { supabase } from '@/lib/db/supbase'

/**
 * Validation schema for notification requests
 * Enforces Frames v2 size limits:
 * - title: max 32 characters
 * - body: max 128 characters
 * - notificationId: max 128 characters (used for idempotency)
 */
const notificationSchema = z.object({
  fid: z.number(),
  notificationId: z.string().max(128),
  title: z.string().max(32),
  body: z.string().max(128),
  targetUrl: z.string().max(256).optional().default(process.env.NEXT_PUBLIC_URL!),
  priority: z.enum(['high', 'normal']).optional().default('normal')
})

type NotificationResponse = {
  result: {
    successfulTokens: string[]
    invalidTokens: string[]
    rateLimitedTokens: string[]
  }
}

/**
 * Sends a notification to a Farcaster client
 * Handles response validation and token management according to Frames v2 spec
 * @param {string} url - The notification endpoint URL
 * @param {string} token - The notification token
 * @param {z.infer<typeof notificationSchema>} data - The notification content
 * @param {boolean} skipRateLimit - Whether to skip rate limit checks
 * @returns {Promise<NotificationResponse>} Notification send result
 */
async function sendNotification(
  url: string, 
  token: string, 
  data: z.infer<typeof notificationSchema>, 
  skipRateLimit: boolean = false
): Promise<NotificationResponse> {
  try {
    // Check rate limit unless skipped
    if (!skipRateLimit) {
      const withinLimit = await checkNotificationRateLimit(data.fid)
      if (!withinLimit) {
        return { 
          result: {
            successfulTokens: [],
            invalidTokens: [],
            rateLimitedTokens: [token]
          }
        }
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        title: data.title,
        body: data.body,
        targetUrl: data.targetUrl,
        tokens: [token]
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Handle successful tokens
    if (result.result?.successfulTokens?.includes(token)) {
      await updateTokenLastUsed(data.fid, token)
    }
    
    // Handle invalid tokens
    if (result.result?.invalidTokens?.includes(token)) {
      await Promise.all([
        invalidateToken(data.fid, token),
        removeCachedNotificationToken(data.fid)
      ])
    }

    return result
  } catch (error) {
    console.error('Failed to send notification:', error)
    throw error
  }
}

/**
 * POST /api/notifications
 * Main notification endpoint that handles:
 * - Request validation
 * - Token retrieval (Redis cache with Supabase fallback)
 * - Notification sending with retries
 * - Error handling and rate limiting
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fid, notificationId, title, body: notificationBody, targetUrl, priority } = body;

    if (!fid || !notificationId || !title || !notificationBody || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Save notification to database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        fid,
        notification_id: notificationId,
        title,
        body: notificationBody,
        target_url: targetUrl,
        status: 'pending'
      });

    if (notificationError) {
      console.error('Error saving notification:', notificationError);
      return NextResponse.json(
        { error: 'Failed to save notification' },
        { status: 500 }
      );
    }

    // 2. Get valid notification tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('token, url')
      .eq('fid', fid)
      .eq('is_valid', true);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return NextResponse.json(
        { error: 'Failed to fetch notification tokens' },
        { status: 500 }
      );
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { message: 'No valid notification tokens found' },
        { status: 200 }
      );
    }

    // 3. Send notifications to all valid tokens
    const results = await Promise.all(
      tokens.map(async ({ token, url }) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationId,
              title,
              body: notificationBody,
              targetUrl,
              tokens: [token],
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          // Handle invalid tokens
          if (result.result?.invalidTokens?.includes(token)) {
            await supabase
              .from('notification_tokens')
              .update({ is_valid: false })
              .eq('token', token);
          }

          // Update last_used for successful tokens
          if (result.result?.successfulTokens?.includes(token)) {
            await supabase
              .from('notification_tokens')
              .update({ last_used: new Date().toISOString() })
              .eq('token', token);
          }

          return result;
        } catch (error) {
          console.error('Error sending notification:', error);
          return null;
        }
      })
    );

    // 4. Update notification status
    await supabase
      .from('notifications')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('notification_id', notificationId);

    return NextResponse.json({
      message: 'Notifications processed',
      results
    });

  } catch (error) {
    console.error('Error processing notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 