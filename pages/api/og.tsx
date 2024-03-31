import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const fontData = await fetch(
        new URL("../../public/inter.roman.var.ttf", import.meta.url),
      ).then((res) => res.arrayBuffer());
      const hasTitle = searchParams.has("title");
      const title = hasTitle ? searchParams.get("title") : null;
      const hasValidTitle = title !== null && title.trim() !== "";

      if (hasValidTitle) {
        return new ImageResponse(
          (
            <div
              style={{
                backgroundColor: "black",
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                fontFamily: '"Inter"',
                padding: "80px 80px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontStyle: "normal",
                  color: "#9b9b9b",
                  whiteSpace: "pre-wrap",
                }}
              >
                Hemanth Soni
              </div>
              <div
                style={{
                  fontSize: 76,
                  fontStyle: "normal",
                  letterSpacing: "-0.01em",
                  color: "white",
                  lineHeight: 1.1,
                  whiteSpace: "pre-wrap",
                }}
              >
                {decodeURIComponent(title)}
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
            fonts: [
              {
                name: "Inter",
                data: fontData,
                style: "normal",
              },
            ],
          },
        );
      } else {
        return new ImageResponse(
          (
            <div
              style={{
                backgroundColor: "black",
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                fontFamily: '"Inter"',
                padding: "80px 80px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontStyle: "normal",
                  color: "#9b9b9b",
                  whiteSpace: "pre-wrap",
                }}
              >
              </div>
              <div
                style={{
                  fontSize: 76,
                  fontStyle: "normal",
                  letterSpacing: "-0.01em",
                  color: "white",
                  lineHeight: 1.1,
                  whiteSpace: "pre-wrap",
                }}
              >
                Hemanth Soni
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
            fonts: [
              {
                name: "Inter",
                data: fontData,
                style: "normal",
              },
            ],
          },
        );
      }
    } catch (e: any) {
      console.log(`${e.message}`);
      return new Response(`Failed to generate the image`, {
        status: 500,
      });
    }
  }