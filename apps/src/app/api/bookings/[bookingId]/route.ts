import { NextRequest } from "next/server";
import type { CalBooking } from "@/types/cal.com";

const CAL_API_URL = "https://api.cal.com/v2";
const CAL_API_KEY = process.env.CAL_API_KEY;

/**
 * GET /api/bookings/[bookingId]
 * Fetches a booking from Cal.com API
 */
export async function GET(
  request: NextRequest,
  context: { params: { bookingId: string } }
) {
  const bookingId = context.params.bookingId;
  
  try {
    const response = await fetch(
      `${CAL_API_URL}/bookings/${bookingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CAL_API_KEY!}`,
          "Content-Type": "application/json",
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch booking" }));
      return Response.json(
        { error: error.message || "Failed to fetch booking" },
        { status: response.status }
      );
    }

    const booking = await response.json();
    return Response.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return Response.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[bookingId]
 * Updates a booking's status in Cal.com
 */
export async function PATCH(
  request: NextRequest,
  context: { params: { bookingId: string } }
) {
  const bookingId = context.params.bookingId;

  try {
    const body = await request.json();
    const { status } = body as { status: CalBooking["status"] };

    const response = await fetch(
      `${CAL_API_URL}/bookings/${bookingId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${CAL_API_KEY!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update booking" }));
      return Response.json(
        { error: error.message || "Failed to update booking" },
        { status: response.status }
      );
    }

    const booking = await response.json();
    return Response.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return Response.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
} 