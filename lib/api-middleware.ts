/**
 * API middleware utilities for common request handling patterns.
 *
 * Access control (authentication + authorization) is enforced by the
 * Edge proxy (proxy.ts). The helpers here retrieve the already-verified
 * session for use in route handlers.
 */

import type { Session } from "next-auth";
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

  if (!session) {
    // Should never happen — proxy.ts blocks unauthenticated requests
    throw new Error("Session not found — proxy misconfiguration?");
  }

  return session;
}
