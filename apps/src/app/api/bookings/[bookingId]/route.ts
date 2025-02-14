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
  try {
    const response = await fetch(
      `${CAL_API_URL}/bookings/${context.params.bookingId}`,
      {
        headers: {
          Authorization: `Bearer ${CAL_API_KEY!}`,
          "cal-api-version": "2024-08-13"
        }
      }
    );

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return Response.json(
      { 
        status: "error",
        message: "Failed to fetch booking"
      },
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
  try {
    const body = await request.json();
    const { status } = body as { status: CalBooking["status"] };

    const response = await fetch(
      `${CAL_API_URL}/bookings/${context.params.bookingId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${CAL_API_KEY!}`,
          "cal-api-version": "2024-08-13",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      }
    );

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error updating booking:", error);
    return Response.json(
      { 
        status: "error",
        message: "Failed to update booking"
      },
      { status: 500 }
    );
  }
}