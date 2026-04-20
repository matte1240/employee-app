/**
 * API middleware utilities for common request handling patterns.
 *
 * Access control (authentication + authorization) is enforced by the
 * Edge proxy (proxy.ts). The helpers here retrieve the already-verified
 * session for use in route handlers.
 */

import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { getAuthSession } from "@/lib/auth";

// Re-export isAdmin for convenience (used for data-filtering, not access control)
export { isAdmin } from "@/lib/utils/user-utils";

/**
 * Get the current session, asserting it is non-null.
 *
 * Because proxy.ts already gates all protected routes, this should
 * never return null at runtime. The assertion exists as a TypeScript
 * safety-net and a fail-safe in case the proxy is misconfigured.
 */
export async function getRequiredSession(): Promise<Session> {
  const session = await getAuthSession();

  if (session) {
    return session;
  }

  // Fallback for deployments behind reverse proxies where getServerSession
  // may fail to read session state even when proxy.ts already validated JWT.
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? "";
  const tokenReq = new IncomingMessage(new Socket()) as IncomingMessage & {
    cookies: Partial<Record<string, string>>;
  };
  tokenReq.headers = { cookie: cookieHeader };
  tokenReq.cookies = {};

  const token = await getToken({
    req: tokenReq,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.id && token.email) {
    const expires =
      typeof token.exp === "number"
        ? new Date(token.exp * 1000).toISOString()
        : new Date().toISOString();

    return {
      user: {
        id: token.id,
        email: token.email,
        name: typeof token.name === "string" ? token.name : undefined,
        image: token.picture ?? undefined,
        role: (token.role as string | undefined) ?? "EMPLOYEE",
        hasPermesso104: Boolean(token.hasPermesso104),
        hasPaternityLeave: Boolean(token.hasPaternityLeave),
      },
      expires,
    };
  }

  throw new Error("Session not found — proxy misconfiguration?");
}
