"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Cal, { getCalApi } from "@calcom/embed-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SchedulerProps {
  onBookingCreated: (bookingId: string) => void;
}

export function Scheduler({ onBookingCreated }: SchedulerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  useEffect(() => {
    (async function initCalendar() {
      try {
        const cal = await getCalApi({ namespace: "test" });
        
        // Initialize Cal.com UI
        cal("ui", {
          hideEventTypeDetails: false,
          layout: "month_view"
        });

        // Listen for booking events
        cal("on", {
          action: "bookingSuccessful",
          callback: (event) => {
            // Access booking data safely
            const bookingData = event.detail?.data?.booking;
            if (bookingData && 
                typeof bookingData === 'object' && 
                'uid' in bookingData && 
                typeof bookingData.uid === 'string') {
              // Instead of immediately redirecting, show the payment dialog
              setCurrentBookingId(bookingData.uid);
              setShowPaymentDialog(true);
            }
          },
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Cal.com initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to load calendar");
        setIsLoading(false);
      }
    })();
  }, []);

  const handlePayNow = useCallback(() => {
    if (currentBookingId) {
      onBookingCreated(currentBookingId);
      setShowPaymentDialog(false);
    }
  }, [currentBookingId, onBookingCreated]);

  const handlePayLater = useCallback(async () => {
    if (currentBookingId) {
      try {
        // Save the booking with PENDING payment status
        await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: currentBookingId,
            status: "PENDING",
            paymentStatus: "PENDING",
          }),
        });
        setShowPaymentDialog(false);
      } catch (error) {
        console.error("Failed to save booking:", error);
        setError("Failed to save booking status");
      }
    }
  }, [currentBookingId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">{error}</div>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="w-full h-[calc(100vh-120px)]">
        <Cal
          namespace="test"
          calLink="nouns-playground-b66zci/test"
          style={{ width: "100%", height: "100%", overflow: "scroll" }}
          config={{
            layout: "month_view"
          }}
        />
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
            <DialogDescription>
              Would you like to proceed with payment now or pay later?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handlePayLater}>
              Pay Later
            </Button>
            <Button onClick={handlePayNow}>
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
