"use client";

//landing page life advice

import { Reviews } from "@/components/reviews"
import Image from "next/image"

export default function Home() {
  return (
    <div className="h-full overflow-y-auto">
      <main className="container mx-auto px-4">
        <section className="flex min-h-[40vh] flex-col items-center justify-center py-8">
          {/* Logo */}
          <div className="relative mb-8 w-24 h-24 sm:w-32 sm:h-32">
            <Image
              src="/icon.jpg"
              alt="Logo"
              fill
              className="rounded-full object-cover"
              priority
            />
          </div>

          <div className="text-center space-y-4">
            <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Jake
            </h1>
            <div className="inline-flex flex-col items-center justify-center space-y-2">
              <h2 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-gray-700 sm:text-3xl">
                LIFE ADVICE
              </h2>
              <p className="text-lg text-muted-foreground">
                $250 / hour session
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 mb-16">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-6 text-center">
            What People Say
          </h3>
          <Reviews />
        </section>
      </main>
    </div>
  )
}