"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const reviews = [
  {
    name: "Eric",
    content:
      "Really enjoyed my convo with Jake. Sometimes you need to speak your thoughts out loud and get objective feedback. Jake is great at listening and synthesizing information and then providing thoughtful feedback and nuggets to help you navigate your situation.",
  },
  {
    name: "James Loesch",
    content:
      "Talking with Jake helped me flesh out some thoughts and get really good feedback on how I was thinking about my next career move. I came away with not only a clearer view of where I want to be headed, but also some concrete steps for how to get there.",
  },
  {
    name: "Cathal",
    content:
      "Jake is a gifted listener and coach. He challenged me to think about what was important to me and what I wanted to achieve.",
  },
  {
    name: "Alex",
    content:
      "Jake actively listens, which is one of the rarest skills in today's world where everyone is quick to judge or believes they have the solutions. Listening in itself is sometimes the solution and Jake applies it to extract the biggest insights you have, while also helping you sort out your thinking/reasoning process.",
  },
  {
    name: "NC",
    content:
      "Jake is an in-depth and thoughtful thinker that will help you solve problems ranging from business to health (wide range). He asks questions that force you to think outside the box and teaches you how to leverage your unique skillset.",
  },
  {
    name: "Anonymous",
    content:
      "Jake is wise beyond his years. He had an ability to see through my situation in ways I hadn't been able to before. He gave me an actionable framework for moving forward and making changes to my life. It was a truly meaningful and impactful call.",
  },
  {
    name: "Anonymous",
    content:
      "Riffing with @0FJAKE was a great conversation, but more importantly helped surface ideas and articulate a path forward in ways I couldn't have done flying solo.",
  },
  {
    name: "Anonymous",
    content:
      "My time spent with Jake was deeply insightful. Through his own personal experience and wisdom, he opened me up to fresh perspectives on my life, career, and personal relationships. Cannot recommend it enough.",
  },
  {
    name: "Anonymous",
    content:
      "Sometimes it's difficult to share your thoughts with those close to you as they directly impact them. So it's great to have a stranger to not just listen but to be able to give critical feedback on a problem you're facing. It was a refreshing convo which I think many people would benefit from.",
  },
  {
    name: "Anonymous",
    content:
      "Jake's openness, groundedness, and wide array of interests always lead to insightful conversations.",
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
          <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
            {/* Content */}
            <div className="relative">
              <h3 className="scroll-m-20 text-xl font-semibold tracking-tight text-gray-900 mb-3">
                {reviews[currentIndex].name}
              </h3>
              <p className="leading-7 text-muted-foreground">
                {reviews[currentIndex].content}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex justify-center space-x-2">
        {reviews.map((_, index) => (
          <button 
            key={index} 
            onClick={() => setCurrentIndex(index)} 
            className="group relative"
            aria-label={`View review ${index + 1} of ${reviews.length}`}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                index === currentIndex ? "bg-primary w-6" : "bg-muted group-hover:bg-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

