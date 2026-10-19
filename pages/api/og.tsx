import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import MULTIPLEXERS from "../../data/multiplexers-og.json";

export const config = {
  runtime: "edge",
};

/**
 * The /multiplexers map as a faint backdrop: every logo at its spot in the
 * default view, shifted right and up so the title sits in open space.
 * Positions are baked into data/multiplexers-og.json (the full data is too
 * big for an edge function); logos are fetched from the site and recoloured.
 */
async function multiplexerField(origin: string) {
  const W = 1200;
  const H = 630;
  const SHIFT_X = 200;
  const SHIFT_Y = -80;
  const SIZE = 30;
  const LINE = "#1c1c1c";
  const marks = await Promise.all(
    MULTIPLEXERS.map(async (p) => {
      const color = p.x > 50 && p.y > 50 ? "#4f4f4f" : "#2e2e2e";
      try {
        const res = await fetch(new URL(`/images/multiplexers/${p.slug}.svg`, origin));
        if (!res.ok) return null;
        const svg = (await res.text()).replaceAll("currentColor", color);
        return { ...p, src: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}` };
      } catch {
        return null;
      }
    }),
  );
  const cx = SHIFT_X + W / 2;
  const cy = SHIFT_Y + H / 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex" }}>
      <div style={{ position: "absolute", left: cx - 1, top: 0, width: 2, height: H, backgroundColor: LINE }} />
      <div style={{ position: "absolute", left: 0, top: cy - 1, width: W, height: 2, backgroundColor: LINE }} />
      {marks.map((m) =>
        m ? (
          // Satori draws plain <img>; next/image does not apply here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.slug}
            alt=""
            src={m.src}
            width={SIZE}
            height={SIZE}
            style={{
              position: "absolute",
              left: SHIFT_X + (m.x / 100) * W - SIZE / 2,
              top: SHIFT_Y + (1 - m.y / 100) * H - SIZE / 2,
            }}
          />
        ) : null,
      )}
    </div>
  );
}

export default async function handler(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const fontData = await fetch(
        new URL("../../public/inter.roman.var.ttf", import.meta.url),
      ).then((res) => res.arrayBuffer());
      const hasTitle = searchParams.has("title");
      const title = hasTitle ? searchParams.get("title") : null;
      const hasValidTitle = title !== null && title.trim() !== "";
      const field = searchParams.get("field") === "multiplexers" ? await multiplexerField(request.url) : null;

      if (hasValidTitle) {
        return new ImageResponse(
          (
            <div
              style={{
                backgroundColor: "black",
                height: "100%",
                width: "100%",
                display: "flex",
                position: "relative",
                fontFamily: '"Inter"',
              }}
            >
              {field}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 1200,
                  height: 630,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexWrap: "nowrap",
                  padding: "100px 100px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontSize: 42,
                    fontStyle: "normal",
                    color: "#9b9b9b",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  hem.so
                </div>
                <div
                  style={{
                    fontSize: 84,
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
                  fontSize: 42,
                  fontStyle: "normal",
                  color: "#9b9b9b",
                  whiteSpace: "pre-wrap",
                }}
              >
              </div>
              <div
                style={{
                  fontSize: 84,
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
