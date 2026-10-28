import type { NextApiRequest, NextApiResponse } from "next";
import TurndownService from "turndown";

const contentSignal = "search=yes, ai-input=yes, ai-train=no, use=reference";

function getMetadata(html: string, turndown: TurndownService) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const descriptionTag = Array.from(html.matchAll(/<meta\b[^>]*>/gi)).find(
    ([tag]) => /\bname=["']description["']/i.test(tag),
  )?.[0];
  const description = descriptionTag?.match(
    /\bcontent=(["'])([\s\S]*?)\1/i,
  )?.[2];

  return [
    title && `title: ${JSON.stringify(turndown.turndown(title))}`,
    description &&
      `description: ${JSON.stringify(turndown.turndown(description))}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).send("Method Not Allowed");
  }

  const path = Array.isArray(request.query.path)
    ? request.query.path[0]
    : request.query.path;
  if (
    !path?.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\t\r\n]/.test(path)
  ) {
    return response.status(400).send("Invalid path");
  }

  const forwardedProtocol = request.headers["x-forwarded-proto"];
  const protocolHeader = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : forwardedProtocol || "https";
  const protocol = protocolHeader.split(",", 1)[0].trim();
  const host = request.headers.host;
  if (!host || !["http", "https"].includes(protocol)) {
    return response.status(400).send("Invalid origin");
  }

  try {
    const origin = new URL(`${protocol}://${host}`);
    const target = new URL(path, origin);
    if (target.origin !== origin.origin) {
      return response.status(400).send("Invalid path");
    }

    const htmlResponse = await fetch(target, {
      headers: { Accept: "text/html" },
      redirect: "manual",
    });
    if (htmlResponse.status >= 300 && htmlResponse.status < 400) {
      return response.status(502).send("Unable to render redirect as Markdown");
    }
    const html = await htmlResponse.text();
    if (!htmlResponse.ok) {
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      return response.status(htmlResponse.status).send(html);
    }

    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
    const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
    const turndown = new TurndownService({
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      headingStyle: "atx",
    });
    turndown.remove(["script", "style", "noscript", "nav", "footer"]);

    const metadata = getMetadata(html, turndown);
    const jsonLd = Array.from(
      html.matchAll(
        /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      ),
      (match) => match[1].trim(),
    ).filter(Boolean);
    const markdown = turndown
      .turndown(main || body || html)
      .replace(/^#{1,6}\s*$/gm, "")
      .replace(/\n{3,}/g, "\n\n");
    const document = [
      metadata && `---\n${metadata}\n---`,
      markdown,
      jsonLd.length > 0 && `\`\`\`json\n${jsonLd.join("\n")}\n\`\`\``,
    ]
      .filter(Boolean)
      .join("\n\n");

    response.setHeader("Content-Type", "text/markdown; charset=utf-8");
    response.setHeader("Content-Signal", contentSignal);
    response.setHeader("Vary", "Accept");
    response.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    if (request.method === "HEAD") {
      return response.status(200).end();
    }
    return response.status(200).send(document);
  } catch {
    return response.status(502).send("Unable to render Markdown");
  }
}
