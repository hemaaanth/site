import { createHmac } from "node:crypto";

// Server only: signs api.hem.so screenshot URLs with SCREENSHOT_SIGNING_KEY.
// Import it from getStaticProps and pass the result down as props.

export interface ProjectShot {
  // Static image in /public. Always set, used whenever the live image is unavailable.
  fallback: string;
  // Small WebP copy of the fallback, served as a plain file (no optimizer), for the instant swap when a
  // live image stalls. Set for projects that can be live.
  still?: string;
  // Signed api.hem.so URLs, pre-sized as WebP. Unset when the key is missing or the API failed.
  card?: string; // /studio, shown up to 578 CSS px wide
  preview?: string; // hover preview on the home page, shown up to 260 CSS px wide
}

interface ProjectConfig {
  url: string;
  fallback: string;
  still?: string;
  // Extra API options that make the framed shot match the hand-made one
  params?: Record<string, string | number | boolean>;
  // false keeps the static image on purpose
  live?: boolean;
  // true when the home page hover preview uses it; each size is a separate capture on the API
  preview?: boolean;
}

const PROJECTS: Record<string, ProjectConfig> = {
  caniworknow: {
    url: "https://caniworknow.com",
    fallback: "/images/studio/caniworknow_header.png",
    params: { bg: "2c3530", delay_ms: 2000 },
    // The capture keeps cropping the key status text; the static image shows it whole
    live: false,
  },
  slant: {
    url: "https://slant.page",
    fallback: "/images/studio/slant_header.png",
    still: "/images/studio/slant_header.webp",
    params: {
      bg: "3a342d",
      dark_mode: true,
      width: 800,
      height: 500,
      delay_ms: 2500,
    },
    preview: true,
  },
  sher: {
    url: "https://sher.ing",
    fallback: "/images/studio/sher_header.png",
    still: "/images/studio/sher_header.webp",
    params: { bg: "2e2c3a", dark_mode: true, delay_ms: 2000 },
    preview: true,
  },
  statcan: {
    url: "https://statcan2.ca",
    fallback: "/images/studio/statcan_header.png",
    still: "/images/studio/statcan_header.webp",
    params: { bg: "3d2c2e", delay_ms: 2000 },
    preview: true,
  },
  hypee: {
    url: "https://hyp.ee",
    fallback: "/images/studio/hypee_header.png",
    still: "/images/studio/hypee_header.webp",
    params: { bg: "2d343a", delay_ms: 2000 },
    // The cached capture had empty tiles; flip to true once the thumbnail API is fixed
    live: false,
  },
  bridgebot: {
    url: "https://bridgebot.cloud",
    fallback: "/images/studio/bridgebot_header.png",
    still: "/images/studio/bridgebot_header.webp",
    params: { bg: "313b35", delay_ms: 2000 },
  },
  tagtunes: {
    url: "https://tagtun.es",
    fallback: "/images/studio/tagtunes_header.png",
    // The live page is a mostly black landing screen; the static image shows the app itself
    live: false,
  },
};

const DEFAULT_API_BASE_URL = "https://api.hem.so";
// 2x the widest displayed size, so retina screens stay sharp: /studio cards are widest (578 CSS px)
// at a 639px viewport, where they fill the page; hover cards are 260 CSS px
const CARD_WIDTH = 1200;
const PREVIEW_WIDTH = 520;
const QUALITY = 80;
// Every URL is signed to expire at the end of the next fixed window, never "now + n". The signature
// only changes when the window rolls over, so a project keeps the same URL for a week and browsers,
// Vercel and Cloudflare keep caching it. A page built at any point in a window gets a URL that is
// valid for at least one more week, which is longer than any ISR page stays in use.
const EXPIRY_WINDOW_SECONDS = 7 * 24 * 60 * 60;
// One deadline for all of a page's warm-up requests, which run in parallel. A shot the API has not
// served by then uses its static image until the next ISR window, so a stalled or down API adds at
// most this long to a page's data step. A cold capture takes 3 to 10 seconds.
const WARM_DEADLINE_MS = 8000;

function expiresAt(nowMs: number): number {
  return (
    (Math.floor(nowMs / 1000 / EXPIRY_WINDOW_SECONDS) + 2) *
    EXPIRY_WINDOW_SECONDS
  );
}

export function signScreenshotUrl(
  baseUrl: string,
  key: string,
  params: Record<string, string | number | boolean>,
  expires: number,
): string {
  const pairs: [string, string][] = Object.entries({ ...params, expires }).map(
    ([name, value]) => [name, String(value)],
  );
  const canonical = [...pairs]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join("\n");
  const sig = createHmac("sha256", key).update(canonical).digest("hex");
  return `${baseUrl}/screenshot?${new URLSearchParams([...pairs, ["sig", sig]]).toString()}`;
}

// Request the image so the API captures and caches it now, not when the first visitor loads the page
async function isServed(url: string, signal: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(url, { signal });
    await response.arrayBuffer();
    return (
      response.ok &&
      (response.headers.get("content-type") ?? "").startsWith("image/")
    );
  } catch {
    return false;
  }
}

/**
 * Image URLs for the shots a page uses: "card" for every project (/studio), "preview" for the
 * projects with a hover preview (home page). Without SCREENSHOT_SIGNING_KEY (local dev, preview
 * deploys) or when the API cannot serve a shot in time, that project only gets its static fallback.
 */
export async function getProjectShots(
  kind: "card" | "preview",
): Promise<Record<string, ProjectShot>> {
  const key = process.env.SCREENSHOT_SIGNING_KEY;
  const baseUrl = (
    process.env.SCREENSHOT_API_BASE_URL || DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
  const used = Object.entries(PROJECTS).filter(
    ([, project]) => kind === "card" || project.preview,
  );
  const shots: Record<string, ProjectShot> = {};
  for (const [id, project] of used) {
    shots[id] = {
      fallback: project.fallback,
      ...(project.still && { still: project.still }),
    };
  }
  if (!key) return shots;

  const expires = expiresAt(Date.now());
  const outWidth = kind === "card" ? CARD_WIDTH : PREVIEW_WIDTH;
  const signal = AbortSignal.timeout(WARM_DEADLINE_MS);
  await Promise.all(
    used
      .filter(([, project]) => project.live !== false)
      .map(async ([id, project]) => {
        const url = signScreenshotUrl(
          baseUrl,
          key,
          {
            ...project.params,
            url: project.url,
            style: "framed",
            format: "webp",
            quality: QUALITY,
            out_width: outWidth,
          },
          expires,
        );
        if (await isServed(url, signal)) shots[id][kind] = url;
      }),
  );
  return shots;
}
