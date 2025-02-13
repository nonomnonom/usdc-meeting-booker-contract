"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { CalBooking } from "@/types/cal.com";
import sdk from "@farcaster/frame-sdk";

interface SchedulerProps {
  onBookingCreated: (bookingId: string) => void;
}

export function Scheduler({ onBookingCreated }: SchedulerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initCalendar = async () => {
      try {
        // Initialize Cal.com inline embed
        const Cal = (window as any).Cal;
        if (!Cal) {
          throw new Error("Cal.com SDK not loaded");
        }

        Cal("init", {
          origin: "https://cal.com",
        });

        Cal("inline", {
          elementOrSelector: "#cal-booking-place",
          calLink: "0fjake/life-advice",
          config: {
            layout: "month_view",
          },
        });

        // Listen for booking success
        Cal("on", {
          action: "bookingSuccessful",
          callback: (e: { data: { booking: CalBooking } }) => {
            if (e.data.booking) {
              onBookingCreated(e.data.booking.id);
            }
          },
        });

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load calendar");
        setIsLoading(false);
      }
    };

    // Load Cal.com SDK script
    const script = document.createElement("script");
    script.src = "https://cal.com/embed.js";
    script.async = true;
    script.onload = () => initCalendar();
    script.onerror = () => {
      setError("Failed to load Cal.com SDK");
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [onBookingCreated]);

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
    <div className="w-full h-[calc(100vh-120px)]">
      <div id="cal-booking-place" className="w-full h-full" />
    </div>
  );
}
