"use client";

//landing page life advice

import { Reviews } from "@/components/reviews"

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gray-50">
      <main className="container relative mx-auto px-4">
        <section className="flex min-h-[70vh] flex-col items-center justify-center py-12">
          {/* Logo */}
          <div className="relative mb-8">
            <div className="h-24 w-24 rounded-full bg-blue-500 sm:h-32 sm:w-32" />
          </div>

          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">Jake</h1>
            <div className="inline-flex items-center justify-center">
              <h2 className="text-xl font-medium text-gray-600 sm:text-2xl md:text-3xl">Life Advice</h2>
            </div>
          </div>
        </section>

        <section className="py-12">
          <Reviews />
        </section>

        <footer className="py-8 text-center">
          <a href="https://0FJAKE.com/" className="text-sm text-gray-500 transition-colors hover:text-gray-700">
            0FJAKE.com
          </a>
        </footer>
      </main>
    </div>
  )
}

