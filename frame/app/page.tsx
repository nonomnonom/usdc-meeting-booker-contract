import type { Metadata } from "next"
import App from "@/app/app"

const appUrl = "https://frame.life-advice.xyz"

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Book a call ",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
}

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "life advice",
    openGraph: {
      title: "Life Advice",
      description: "A life advice app",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}

