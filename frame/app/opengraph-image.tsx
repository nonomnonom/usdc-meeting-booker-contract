import { ImageResponse } from "next/og" // Import from next/og instead of next/server [^1]

export const alt = "Life Advice"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "40px",
      }}
    >
      <div
        style={{
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          background: "blue",
        }}
      />
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: "#14171F",
          letterSpacing: "-0.025em",
        }}
      >
        <strong>LIFE ADVICE</strong>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
