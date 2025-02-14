"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Home as HomeIcon, Calendar, CreditCard } from "lucide-react";
import HomePage from "./home";
import Schedule from "./schedule";
import Payment from "./payment";

const dockItems = [
  {
    title: "Home",
    icon: <HomeIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    href: "#home",
  },
  {
    title: "Schedule",
    icon: <Calendar className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    href: "#schedule",
  },
  {
    title: "Payment",
    icon: <CreditCard className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    href: "#payment",
  },
];

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

    // Handle hash changes for navigation
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "home";
      setActiveTab(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
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
      <main className="container mx-auto px-4 pb-20">
        {activeTab === "home" && <HomePage />}
        {activeTab === "schedule" && <Schedule />}
        {activeTab === "payment" && <Payment />}
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <FloatingDock items={dockItems} />
      </div>
    </div>
  );
} 