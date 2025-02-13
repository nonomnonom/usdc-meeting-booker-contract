"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CreditCard } from "lucide-react";
import sdk from "@farcaster/frame-sdk";
import { Scheduler } from "./scheduler";
import { Payment } from "./payment";
import { cn } from "@/lib/utils";

interface FrameContext {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  client?: {
    clientFid: number;
    added: boolean;
    notificationDetails?: {
      url: string;
      token: string;
    };
    safeAreaInsets?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
}

export default function Frame() {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [context, setContext] = useState<FrameContext | null>(null);
  const [activeTab, setActiveTab] = useState("schedule");
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      await sdk.actions.ready();
      const frameContext = await sdk.context;
      setContext(frameContext);
      setIsSDKReady(true);
    };
    initializeSDK();

    return () => {
      sdk.removeAllListeners();
    };
  }, []);

  const handleBookingCreated = useCallback((id: string) => {
    setBookingId(id);
    setActiveTab("payment");
  }, []);

  if (!isSDKReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const safeAreaStyles = {
    paddingTop: context?.client?.safeAreaInsets?.top ?? 16,
    paddingLeft: context?.client?.safeAreaInsets?.left ?? 16,
    paddingRight: context?.client?.safeAreaInsets?.right ?? 16,
    paddingBottom: context?.client?.safeAreaInsets?.bottom ?? 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-200 to-stone-300">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <div className={cn("flex-1", "p-4")} style={safeAreaStyles}>
          <TabsContent value="schedule" className="m-0 h-full">
            <Scheduler onBookingCreated={handleBookingCreated} />
          </TabsContent>

          <TabsContent value="payment" className="m-0 h-full">
            <Payment bookingId={bookingId} />
          </TabsContent>
        </div>

        <TabsList
          className={cn(
            "fixed bottom-0 left-0 right-0 grid grid-cols-2 gap-4 bg-white h-16 border-t shadow-lg max-w-2xl mx-auto z-50 rounded-none px-4",
            "mb-0"
          )}
          style={{ paddingBottom: context?.client?.safeAreaInsets?.bottom ?? 0 }}
        >
          <TabsTrigger
            value="schedule"
            className="flex p-2 gap-2 items-center justify-center data-[state=active]:bg-stone-100 rounded-lg transition-colors data-[state=active]:shadow-inner"
          >
            <Calendar className="w-6 h-6" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="flex p-2 gap-2 items-center justify-center data-[state=active]:bg-stone-100 rounded-lg transition-colors data-[state=active]:shadow-inner"
          >
            <CreditCard className="w-6 h-6" />
            Payment
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
