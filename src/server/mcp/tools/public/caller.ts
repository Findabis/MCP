import { createCaller } from '@/server/api/root';
import type { Context } from '@/server/api/trpc';
import { db } from '@/server/db';
import type { McpCallContext } from '@/server/mcp/registry';

/** No session, and the route already charged the rate window (see middleware/rateLimit.ts) */
type PublicMcpContext = Context & { session: null; edgeRateLimited: true };

/**
 * A tRPC caller with no session, so only `publicProcedure` is reachable.
 * Every public tool goes through the same procedures the website uses, which
 * is what stops the MCP and the site answering the same question
 * differently — and means a fix to one is a fix to both.
 */
export async function publicCaller(ctx: McpCallContext) {
    const context: PublicMcpContext = {
        db,
        session: null,
        headers: ctx.headers,
        portalSlug: null,
        portalEntityId: null,
        portalEntityType: null,
        // Limited per caller by the route (Postgres, 60/min); see rateLimit.ts
        edgeRateLimited: true,
    };
    return createCaller(context);
}
