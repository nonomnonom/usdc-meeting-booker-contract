import { NextRequest } from "next/server";
import { validateBookingForPayment, updateBookingStatus } from "@/utils/cal.com/booking";
import type { CalBooking } from "@/types/cal.com";

const CAL_API_URL = "https://api.cal.com/v2";
const CAL_API_KEY = process.env.CAL_API_KEY;

/**
 * GET /api/bookings/[id]
 * Fetches booking details and validates payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return Response.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const result = await validateBookingForPayment(bookingId);
    
    if (!result.valid) {
      return Response.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return Response.json(result.booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 * Updates booking status after payment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const { status } = await request.json();

    if (!bookingId || !status) {
      return Response.json(
        { error: "Booking ID and status are required" },
        { status: 400 }
      );
    }

    const booking = await updateBookingStatus(bookingId, status);
    return Response.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 