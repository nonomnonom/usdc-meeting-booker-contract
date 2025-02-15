/**
 * Webhook API Route
 * Handles Farcaster webhook events for frame interactions and notification management.
 */
import { NextResponse } from "next/server";
import { parseWebhookEvent, verifyAppKeyWithNeynar } from "@farcaster/frame-node";
import { supabase } from '@/lib/db/supbase';

type WebhookEvent = {
  event: "frame_added" | "frame_removed" | "notifications_enabled" | "notifications_disabled";
  notificationDetails?: {
    url: string;
    token: string;
  };
};

// Neynar API for validating app keys
async function validateAppKey(
  fid: number,
  appKey: string,
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/signer/app_key?fid=${fid}&app_key=${appKey}`,
      {
        headers: {
          api_key: process.env.NEYNAR_API_KEY!,
        },
      },
    );
    
    if (!res.ok) {
      console.error('Neynar API error:', await res.text());
      return null;
    }
    
    const data = await res.json();
    return data.clientFid;
  } catch (error) {
    console.error('Failed to validate app key:', error);
    return null;
  }
}

/**
 * Sends a welcome notification to a new user
 */
async function sendWelcomeNotification(fid: number, token: string, url: string) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId: `welcome:${fid}:${Date.now()}`,
        title: "Welcome to Life Advice! 👋",
        body: "You'll receive notifications for your bookings and updates.",
        targetUrl: process.env.NEXT_PUBLIC_URL!,
        tokens: [token],
        priority: "high"
      })
    });
  } catch (error) {
    console.error('Failed to send welcome notification:', error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate the webhook event
    const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid webhook event' },
        { status: 400 }
      );
    }

    const { fid } = data;
    const payload = JSON.parse(atob(body.payload));
    const { event } = payload;

    switch (event) {
      case 'frame_added': {
        if (payload.notificationDetails) {
          const { token, url } = payload.notificationDetails;
          
          // Save new token
          const { error } = await supabase
            .from('notification_tokens')
            .insert({
              fid,
              token,
              url,
              is_valid: true
            });

          if (error) {
            console.error('Error saving notification token:', error);
            return NextResponse.json(
              { error: 'Failed to save notification token' },
              { status: 500 }
            );
          }

          // Send welcome notification
          await sendWelcomeNotification(fid, token, url);
        }
        break;
      }

      case 'frame_removed': {
        // Invalidate all tokens for this FID
        const { error } = await supabase
          .from('notification_tokens')
          .update({ is_valid: false })
          .eq('fid', fid);

        if (error) {
          console.error('Error invalidating tokens:', error);
          return NextResponse.json(
            { error: 'Failed to invalidate tokens' },
            { status: 500 }
          );
        }
        break;
      }

      case 'notifications_enabled': {
        if (payload.notificationDetails) {
          const { token, url } = payload.notificationDetails;
          
          // Save new token
          const { error } = await supabase
            .from('notification_tokens')
            .insert({
              fid,
              token,
              url,
              is_valid: true
            });

          if (error) {
            console.error('Error saving notification token:', error);
            return NextResponse.json(
              { error: 'Failed to save notification token' },
              { status: 500 }
            );
          }
        }
        break;
      }

      case 'notifications_disabled': {
        // Invalidate all tokens for this FID
        const { error } = await supabase
          .from('notification_tokens')
          .update({ is_valid: false })
          .eq('fid', fid);

        if (error) {
          console.error('Error invalidating tokens:', error);
          return NextResponse.json(
            { error: 'Failed to invalidate tokens' },
            { status: 500 }
          );
        }
        break;
      }

      default: {
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}