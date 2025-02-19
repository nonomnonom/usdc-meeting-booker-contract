import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Life Advice";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const poppinsBlack = readFileSync(
    join(process.cwd(), "public/Poppins-Black.ttf")
  );

  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center bg-white">
        <img 
          src="icon.png"
          width="180"
          height="180"
          tw="mb-10"
        />
        <h1 tw="text-[120px] font-black text-[#14171F] tracking-tight mt-10">
          LIFE ADVICE 
        </h1>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Poppins",
          data: poppinsBlack,
          weight: 900,
          style: "normal",
        },
      ],
    }
  );
}
