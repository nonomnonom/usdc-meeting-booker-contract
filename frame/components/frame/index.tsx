"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home as HomeIcon, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import HomePage from "./home";
import Schedule from "./schedule";
import Payment from "./payment";

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const load = async () => {
      await sdk.actions.ready();
      const context = await sdk.context;
      setIsSDKLoaded(true);
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[100vh] flex flex-col">
        {/* Main Content Area */}
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <TabsContent value="home" className="m-0">
            <HomePage />
          </TabsContent>
          <TabsContent value="schedule" className="m-0">
            <Schedule />
          </TabsContent>
          <TabsContent value="payment" className="m-0">
            <Payment />
          </TabsContent>
        </ScrollArea>

        {/* Fixed Bottom Navigation */}
        <TabsList className="fixed bottom-0 left-0 right-0 h-16 grid w-full grid-cols-3 bg-white border-t shadow-lg">
          <TabsTrigger value="home" className="flex flex-col items-center gap-1 data-[state=active]:bg-gray-100">
            <HomeIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex flex-col items-center gap-1 data-[state=active]:bg-gray-100">
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex flex-col items-center gap-1 data-[state=active]:bg-gray-100">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs font-medium">Payment</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
} 