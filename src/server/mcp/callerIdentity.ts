import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { clientIp } from '@/utils/clientIp';
import { MCP_KEYED_RATE_LIMIT, MCP_RATE_LIMIT } from './limits';

export type McpCaller =
    | { ok: true; key: string; limit: typeof MCP_RATE_LIMIT | typeof MCP_KEYED_RATE_LIMIT; keyed: boolean }
    | { ok: false; status: 401 | 403; error: string };

/**
 * Who is calling the public MCP, for rate limiting only.
 *
 * The endpoint stays open: with no `Authorization` header the caller is its
 * IP at the anonymous limit. An entity API token (the same one the SDK
 * takes, minted in entity settings) is OPTIONAL and buys two things — a
 * per-token quota that does not share a NAT with strangers, and a kill
 * switch (revoke the token). It buys no data: the token's entity is
 * deliberately not returned, so a keyed caller sees exactly what an
 * anonymous one does. Entity-scoped tools are a separate namespace gated on
 * the data-protection review (docs/AI_VISIBILITY_PLAN.md, point 6).
 *
 * Monthly SDK usage is not counted here: that budget is for entity data, and
 * this is a read of the public directory.
 */
export async function resolveMcpCaller(request: Request, db: PrismaClient): Promise<McpCaller> {
    const auth = request.headers.get('authorization');
    const raw = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
    if (!raw) return { ok: true, key: `mcp:public:${clientIp(request.headers)}`, limit: MCP_RATE_LIMIT, keyed: false };

    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const token = await db.apiToken.findUnique({
        where: { tokenHash },
        select: { id: true, isActive: true, expiresAt: true, user: { select: { isSuspended: true } } },
    });
    if (!token || !token.isActive) return { ok: false, status: 401, error: 'Invalid or revoked token' };
    if (token.expiresAt && token.expiresAt < new Date()) return { ok: false, status: 401, error: 'Token expired' };
    if (token.user?.isSuspended) return { ok: false, status: 403, error: 'Account suspended' };

    void db.apiToken.update({ where: { id: token.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
    return { ok: true, key: `mcp:token:${token.id}`, limit: MCP_KEYED_RATE_LIMIT, keyed: true };
}
