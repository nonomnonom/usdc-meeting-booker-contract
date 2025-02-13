import { NextRequest } from "next/server";
import { supabase } from "@/lib/supbase/client";
import sdk from "@farcaster/frame-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status, paymentStatus } = body;

    // Get user context
    const context = await sdk.context;
    if (!context.user?.fid) {
      return Response.json(
        { error: "User FID not found" },
        { status: 401 }
      );
    }

    // Insert into bookings table
    const { error } = await supabase
      .from("bookings")
      .insert([
        {
          id: bookingId,
          fid: context.user.fid.toString(),
          status,
          payment_status: paymentStatus,
          amount: "250", // Fixed amount for now
        },
      ]);

    if (error) {
      console.error("Error saving booking:", error);
      return Response.json(
        { error: "Failed to save booking" },
        { status: 500 }
      );
    }

    // If payment status is PENDING, create a payment history record
    if (paymentStatus === "PENDING") {
      const { error: paymentError } = await supabase
        .from("payment_history")
        .insert([
          {
            fid: context.user.fid.toString(),
            booking_id: bookingId,
            amount: "250",
            status: "PENDING",
          },
        ]);

      if (paymentError) {
        console.error("Error saving payment history:", paymentError);
        // Don't return error here as the booking was saved successfully
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing request:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 