import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.headers.get("accept")?.includes("text/markdown")) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = "/api/markdown";
  destination.search = "";
  destination.searchParams.set(
    "path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|llms.txt|posts/rss|.*\\..*).*)"],
};
