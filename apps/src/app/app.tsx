"use client";

import dynamic from "next/dynamic";

const Frame = dynamic(() => import("@/components/frame"), {
  ssr: false,
});

export default function App() {
  return <Frame />;
}