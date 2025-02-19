import { ImageResponse } from "next/og"

export const alt = "Life Advice"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  const interBlack = await fetch(
    new URL('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
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
          fontFamily: '"Inter"',
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
            color: "#000000",
            letterSpacing: "-0.025em",
          }}
        >
          LIFE ADVICE
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interBlack,
          style: 'normal',
          weight: 900
        }
      ]
    }
  )
}
