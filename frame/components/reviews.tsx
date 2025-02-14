"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const reviews = [
  {
    name: "Eric",
    content:
      "Really enjoyed my convo with Jake. Sometimes you need to speak your thoughts out loud and get objective feedback. Jake is great at listening and synthesizing information and then providing thoughtful feedback and nuggets to help you navigate your situation.",
    castLink: "https://cast.example.com/eric",
  },
  {
    name: "James Loesch",
    content:
      "Talking with Jake helped me flesh out some thoughts and get really good feedback on how I was thinking about my next career move. I came away with not only a clearer view of where I want to be headed, but also some concrete steps for how to get there.",
    castLink: "https://cast.example.com/james",
  },
  {
    name: "Cathal",
    content:
      "Jake is a gifted listener and coach. He challenged me to think about what was important to me and what I wanted to achieve.",
    castLink: "https://cast.example.com/cathal",
  },
  {
    name: "Alex",
    content:
      "Jake actively listens, which is one of the rarest skills in today's world where everyone is quick to judge or believes they have the solutions. Listening in itself is sometimes the solution and Jake applies it to extract the biggest insights you have.",
    castLink: "https://cast.example.com/alex",
  },
  {
    name: "NC",
    content:
      "Jake is an in-depth and thoughtful thinker that will help you solve problems ranging from business to health. He asks questions that force you to think outside the box and teaches you how to leverage your unique skillset.",
    castLink: "https://cast.example.com/nc",
  },
]

export function Reviews() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative"
        >
          <div className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            {/* Content */}
            <div className="relative">
              <h3 className="mb-2 text-lg font-medium text-gray-900 sm:text-xl">{reviews[currentIndex].name}</h3>
              <p className="mb-4 text-sm text-gray-600 sm:text-base">{reviews[currentIndex].content}</p>
              <div className="flex justify-between">
                <a
                  href={reviews[currentIndex].castLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 transition-colors hover:text-blue-800 sm:text-sm"
                >
                  Cast →
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex justify-center space-x-2">
        {reviews.map((_, index) => (
          <button key={index} onClick={() => setCurrentIndex(index)} className="group relative">
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                index === currentIndex ? "bg-blue-500 w-6" : "bg-gray-300 group-hover:bg-gray-400",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

