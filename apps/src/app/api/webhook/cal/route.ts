import { NextRequest } from "next/server";
import { supabase } from "@/lib/supbase/client";
import crypto from "crypto";

const CAL_WEBHOOK_SECRET = process.env.CAL_WEBHOOK_SECRET;

// Verify Cal.com webhook signature
function verifySignature(body: string, signature: string | null) {
  if (!CAL_WEBHOOK_SECRET || !signature) return false;
  
  const hmac = crypto
    .createHmac("sha256", CAL_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  
  return `sha256=${hmac}` === signature;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("X-Cal-Signature-256");
    const body = await request.text();
    
    if (!verifySignature(body, signature)) {
      return Response.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const { triggerEvent, payload: bookingData } = payload;

    // Handle different webhook events
    switch (triggerEvent) {
      case "BOOKING_CREATED":
        // Save booking to Supabase
        const { error: bookingError } = await supabase
          .from("bookings")
          .insert([
            {
              id: bookingData.uid,
              fid: "", // Will be filled when user connects with Farcaster
              status: bookingData.status,
              payment_status: "PENDING",
              amount: "250", // Fixed amount for now
            },
          ]);

        if (bookingError) {
          console.error("Error saving booking:", bookingError);
          return Response.json(
            { error: "Failed to save booking" },
            { status: 500 }
          );
        }

        // Create initial payment record
        const { error: paymentError } = await supabase
          .from("payment_history")
          .insert([
            {
              fid: "", // Will be filled when user connects
              booking_id: bookingData.uid,
              amount: "250",
              status: "PENDING",
            },
          ]);

        if (paymentError) {
          console.error("Error creating payment record:", paymentError);
        }
        break;

      case "BOOKING_CANCELLED":
        // Update booking status
        await supabase
          .from("bookings")
          .update({ status: "CANCELED" })
          .eq("id", bookingData.uid);
        break;

      case "BOOKING_REJECTED":
        // Update booking status
        await supabase
          .from("bookings")
          .update({ status: "REJECTED" })
          .eq("id", bookingData.uid);
        break;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 