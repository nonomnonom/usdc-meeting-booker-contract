import type { Metadata } from "next";
import { Sora } from "next/font/google";

import "@/app/globals.css";
import { Providers } from "@/app/providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Life Advice",
  description: "The official Farcaster Frame for life advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} font-sans overflow-y-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}