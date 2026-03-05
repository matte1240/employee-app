import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { auditSecurity } from "@/lib/audit-log";

const handler = NextAuth(authOptions);

// Max 5 login attempts per IP per 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

async function rateLimitedPost(req: NextRequest, context: unknown): Promise<Response> {
  const ip = getClientIp(req);
  const result = checkRateLimit(`login:${ip}`, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);

  if (result.limited) {
    auditSecurity.rateLimited(ip, "/api/auth");
    return NextResponse.json(
      { error: "Troppi tentativi di login. Riprova più tardi." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSeconds) },
      }
    );
  }

  return (handler as (...args: unknown[]) => Promise<Response>)(req, context);
}

export { handler as GET, rateLimitedPost as POST };
