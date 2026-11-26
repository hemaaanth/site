import { createHmac } from "node:crypto";

// Server only: signs api.hem.so screenshot URLs with SCREENSHOT_SIGNING_KEY.
// Import it from getStaticProps and pass the result down as props.

export interface ProjectShot {
  // Static image in /public. Always set, used whenever the live image is unavailable.
  fallback: string;
  // Signed api.hem.so URLs, pre-sized as WebP. Unset when the key is missing or the API failed.
  card?: string; // /studio, shown up to 480 CSS px wide
  preview?: string; // hover preview on the home page, shown up to 260 CSS px wide
}

interface ProjectConfig {
  url: string;
  fallback: string;
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
  },
  slant: {
    url: "https://slant.page",
    fallback: "/images/studio/slant_header.png",
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
    params: { bg: "2e2c3a", dark_mode: true, delay_ms: 2000 },
    preview: true,
  },
  statcan: {
    url: "https://statcan2.ca",
    fallback: "/images/studio/statcan_header.png",
    params: { bg: "3d2c2e", delay_ms: 2000 },
    preview: true,
  },
  hypee: {
    url: "https://hyp.ee",
    fallback: "/images/studio/hypee_header.png",
    params: { bg: "2d343a", delay_ms: 2000 },
  },
  bridgebot: {
    url: "https://bridgebot.cloud",
    fallback: "/images/studio/bridgebot_header.png",
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
// 2x the displayed width, so retina screens stay sharp: 480px on /studio, 260px in the hover card
const CARD_WIDTH = 960;
const PREVIEW_WIDTH = 520;
const QUALITY = 80;
// Every URL is signed to expire at the end of the next fixed window, never "now + n". The signature
// only changes when the window rolls over, so a project keeps the same URL for a week and browsers,
// Vercel and Cloudflare keep caching it. A page built at any point in a window gets a URL that is
// valid for at least one more week, which is longer than any ISR page stays in use.
const EXPIRY_WINDOW_SECONDS = 7 * 24 * 60 * 60;
// A cold capture takes 3 to 10 seconds
const WARM_TIMEOUT_MS = 25000;
// The API runs two captures at a time and queues eight; more than that gets 503
const WARM_CONCURRENCY = 2;

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
async function isServed(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
    });
    await response.arrayBuffer();
    return (
      response.ok &&
      (response.headers.get("content-type") ?? "").startsWith("image/")
    );
  } catch {
    return false;
  }
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index]);
      }
    }),
  );
  return results;
}

/**
 * Image URLs for every project. Without SCREENSHOT_SIGNING_KEY (local dev, preview deploys) or when
 * the API cannot serve a project right now, that project only gets its static fallback.
 */
export async function getProjectShots(): Promise<Record<string, ProjectShot>> {
  const key = process.env.SCREENSHOT_SIGNING_KEY;
  const baseUrl = (
    process.env.SCREENSHOT_API_BASE_URL || DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
  const shots: Record<string, ProjectShot> = {};
  for (const [id, project] of Object.entries(PROJECTS)) {
    shots[id] = { fallback: project.fallback };
  }
  if (!key) return shots;

  const expires = expiresAt(Date.now());
  const sign = (project: ProjectConfig, outWidth: number) =>
    signScreenshotUrl(
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

  const live = Object.entries(PROJECTS).filter(
    ([, project]) => project.live !== false,
  );
  await mapWithLimit(live, WARM_CONCURRENCY, async ([id, project]) => {
    const card = sign(project, CARD_WIDTH);
    const preview = project.preview ? sign(project, PREVIEW_WIDTH) : undefined;
    shots[id] = {
      fallback: project.fallback,
      ...((await isServed(card)) && { card }),
      ...(preview && (await isServed(preview)) && { preview }),
    };
  });
  return shots;
}
