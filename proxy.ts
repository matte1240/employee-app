import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Proxy — logs API requests.
 * Runs on the Edge runtime, so we can only use console.log here
 * (the audit file writer runs in Node.js API routes).
 */
export function proxy(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();
  const duration = Date.now() - start;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const method = request.method;
  const path = request.nextUrl.pathname;

  // Structured JSON log line for API access
  const entry = {
    timestamp: new Date().toISOString(),
    category: "ACCESS",
    method,
    path,
    ip,
    durationMs: duration,
  };

  console.log(JSON.stringify(entry));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
