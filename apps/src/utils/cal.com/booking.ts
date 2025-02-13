import type { CalBooking } from "@/types/cal.com";

const CAL_API_URL = "https://api.cal.com/v2";
const CAL_API_KEY = process.env.CAL_API_KEY;

/**
 * Fetches a booking from Cal.com API
 */
export async function getBooking(bookingId: string): Promise<CalBooking> {
  const response = await fetch(`${CAL_API_URL}/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${CAL_API_KEY!}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch booking");
  }

  return response.json();
}

/**
 * Updates a booking's status in Cal.com
 */
export async function updateBookingStatus(
  bookingId: string,
  status: CalBooking["status"]
): Promise<CalBooking> {
  const response = await fetch(`${CAL_API_URL}/bookings/${bookingId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${CAL_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update booking status");
  }

  return response.json();
}

/**
 * Checks if a booking exists and is in a valid state for payment
 */
export async function validateBookingForPayment(bookingId: string): Promise<{
  valid: boolean;
  booking?: CalBooking;
  error?: string;
}> {
  try {
    const booking = await getBooking(bookingId);

    // Check if booking exists and is in valid state
    if (!booking) {
      return { valid: false, error: "Booking not found" };
    }

    if (booking.status === "CANCELED") {
      return { valid: false, error: "Booking has been canceled" };
    }

    if (booking.status === "REJECTED") {
      return { valid: false, error: "Booking has been rejected" };
    }

    return { valid: true, booking };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Failed to validate booking" 
    };
  }
} 