"use client";

//landing page life advice

import { Reviews } from "@/components/reviews"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <main className="container mx-auto px-4 pb-24">
        <section className="flex min-h-[60vh] flex-col items-center justify-center py-8">
          {/* Logo */}
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-full bg-custom-blue sm:h-28 sm:w-28" />
          </div>

          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-4xl">Jake</h1>
            <div className="inline-flex items-center justify-center">
              <h2 className="text-lg font-medium text-gray-600 sm:text-2xl">Life Advice</h2>
            </div>
          </div>
        </section>

        <section className="py-8">
          <Reviews />
        </section>

        <footer className="py-6 text-center">
          <a href="https://0FJAKE.com/" className="text-sm text-gray-500 transition-colors hover:text-gray-700">
            0FJAKE.com
          </a>
        </footer>
      </main>
    </div>
  )
}