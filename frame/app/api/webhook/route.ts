import { NextRequest } from "next/server";
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";
import {
  saveNotificationToken,
  removeNotificationToken,
} from "@/lib/db/supbase";
import { cacheNotificationToken } from "@/lib/db/kv";

// Neynar API for validating app keys
async function validateAppKey(
  fid: number,
  appKey: string,
): Promise<number | null> {
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/signer/app_key?fid=${fid}&app_key=${appKey}`,
    {
      headers: {
        api_key: process.env.NEYNAR_API_KEY!,
      },
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.clientFid;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    try {
      // Parse and validate the webhook event
      const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);

      switch (data.event.event) {
        case "frame_added":
          if (data.event.notificationDetails) {
            const { token, url } = data.event.notificationDetails;
            try {
              // Store token in both Supabase and Redis
              await Promise.all([
                saveNotificationToken({ fid: data.fid, token, url }),
                cacheNotificationToken(data.fid, token, url),
              ]);

              // Send welcome notification
              await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  notificationId: `welcome:${data.fid}:${Date.now()}`,
                  title: "Welcome to Life Advice! 👋",
                  body: "You'll receive notifications for your bookings and updates. Thanks for joining!",
                  targetUrl: process.env.NEXT_PUBLIC_URL!,
                  tokens: [token],
                }),
              });
            } catch (tokenError) {
              console.error('Error saving notification token:', tokenError);
              // Continue execution even if token save fails
            }
          }
          break;

        case "frame_removed":
          await removeNotificationToken(data.fid);
          break;

        case "notifications_enabled":
          if (data.event.notificationDetails) {
            const { token, url } = data.event.notificationDetails;
            try {
              await Promise.all([
                saveNotificationToken({ fid: data.fid, token, url }),
                cacheNotificationToken(data.fid, token, url),
              ]);
            } catch (tokenError) {
              console.error('Error saving notification token:', tokenError);
            }
          }
          break;

        case "notifications_disabled":
          await removeNotificationToken(data.fid);
          break;
      }

      return Response.json({ success: true });
    } catch (e: any) {
      if (e.name?.startsWith("VerifyJsonFarcasterSignature.")) {
        switch (e.name) {
          case "VerifyJsonFarcasterSignature.InvalidDataError":
          case "VerifyJsonFarcasterSignature.InvalidEventDataError":
            return Response.json(
              { success: false, error: e.message },
              { status: 400 },
            );
          case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
            return Response.json(
              { success: false, error: e.message },
              { status: 401 },
            );
          case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
            return Response.json(
              { success: false, error: e.message },
              { status: 500 },
            );
        }
      }
      throw e;
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}