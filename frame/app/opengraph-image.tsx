import { ImageResponse } from "next/og";

export const alt = "Life Advice";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center bg-white">
        <div tw="w-[180px] h-[180px] rounded-full bg-blue-500" />
        <h1 tw="text-[72px] font-black text-[#14171F] tracking-tight mt-10">
          LIFE ADVICE
        </h1>
      </div>
    ),
    {
      ...size,
    }
  );
}
