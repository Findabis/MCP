import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { db } from '@/server/db';
import { resolveMcpCaller } from '@/server/mcp/callerIdentity';
import { MCP_SERVER_DESCRIPTION, MEDICAL_DISCLAIMER } from '@/server/mcp/disclaimer';
import { MCP_GUIDES } from '@/server/mcp/guides';
import { MCP_KEYED_RATE_LIMIT, MCP_RATE_LIMIT } from '@/server/mcp/limits';
import { createPublicMcpServer } from '@/server/mcp/publicServer';
import { MCP_SERVER_VERSION, type McpCallContext } from '@/server/mcp/registry';
import { publicTools } from '@/server/mcp/tools/public';
import { consumeRateLimit, sweepRateLimits } from '@/server/utils/rateLimitStore';
import { resolveHostContext } from '@/server/utils/siteSeo';
import { BASE_URL } from '@/utils/jsonLd/shared';
import { isPlatformRequestHost } from '@/utils/platformRequestHost';
import { requestHost } from '@/utils/requestHost';

/**
 * The public Findabis MCP endpoint (streamable HTTP).
 *
 * Only ever serves the PUBLIC tool set — the same directory data the website
 * shows anonymously. The developer tools in `scripts/mcp/` are a separate
 * module tree that this file must never import: `dev_query` is arbitrary SQL,
 * and a filter is a runtime decision where a missing import is a build error.
 *
 * Stateless: every request builds its own server and transport, because two
 * machines run and a session pinned to one of them would break on the next
 * request. So there is no SSE stream to GET and no session to DELETE.
 *
 * CORS is open (`*`, never credentials): everything here is public data a
 * browser could read off the website, and a browser-based MCP client needs
 * the preflight to reach it at all.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
    'Access-Control-Expose-Headers':
        'Mcp-Session-Id, Mcp-Protocol-Version, RateLimit-Limit, RateLimit-Remaining, Retry-After',
    'Access-Control-Max-Age': '86400',
};

function withCors(response: Response): Response {
    for (const [name, value] of Object.entries(CORS_HEADERS)) response.headers.set(name, value);
    return response;
}

const notFound = () => new Response('Not Found', { status: 404 });

export async function POST(request: Request) {
    // The Findabis MCP answers on findabis.com only — a portal or customer domain is not it
    if ((await resolveHostContext(requestHost(request))).kind !== 'platform') return notFound();
    // Anonymous by IP, or an optional entity API token for a per-token quota
    // and a kill switch; a bad token is refused, not downgraded to anonymous
    const caller = await resolveMcpCaller(request, db);
    if (!caller.ok) return withCors(Response.json({ error: caller.error }, { status: caller.status }));
    const { key, limit } = caller;
    const gate = await consumeRateLimit(db, key, limit);
    void sweepRateLimits(db);
    if (!gate.allowed) {
        return withCors(
            Response.json(
                { error: 'Rate limit exceeded', limit: gate.limit, resetAt: gate.resetAt.toISOString() },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.max(1, Math.ceil((gate.resetAt.getTime() - Date.now()) / 1000))),
                        'RateLimit-Limit': String(gate.limit),
                        'RateLimit-Remaining': '0',
                    },
                },
            ),
        );
    }

    // A streamable-HTTP POST may batch several tools/call messages; the gate above paid for
    // the first, every further call in the same request buys its own token
    let callsInRequest = 0;
    const allowCall = async () => callsInRequest++ === 0 || (await consumeRateLimit(db, key, limit)).allowed;
    const ctx: McpCallContext = { entity: null, headers: new Headers(request.headers) };
    const server = createPublicMcpServer(ctx, allowCall);

    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    response.headers.set('RateLimit-Limit', String(gate.limit));
    response.headers.set('RateLimit-Remaining', String(gate.remaining));
    return withCors(response);
}

/**
 * GET has two callers. An MCP client opening the server-to-client SSE stream
 * (Accept: text/event-stream) gets 405, as the spec asks of a server that
 * offers none — this one is stateless. Anything else is a probe: say what
 * this is. Both on findabis.com only, like POST.
 */
export function GET(request: Request) {
    if (!isPlatformRequestHost(request)) return notFound();
    if (request.headers.get('accept')?.includes('text/event-stream')) {
        return withCors(
            new Response('Method Not Allowed: this server offers no SSE stream; POST to it.', {
                status: 405,
                headers: { Allow: 'POST' },
            }),
        );
    }
    return withCors(
        Response.json({
            name: 'findabis',
            version: MCP_SERVER_VERSION,
            description: MCP_SERVER_DESCRIPTION,
            disclaimer: MEDICAL_DISCLAIMER,
            transport: 'streamable-http',
            // Absolute: a client that found this by probing has no base to resolve against
            endpoint: `${BASE_URL}/api/mcp`,
            method: 'POST',
            authentication: {
                required: false,
                scheme: 'Bearer <entity API token>',
                anonymousLimitPerMinute: MCP_RATE_LIMIT.max,
                keyedLimitPerMinute: MCP_KEYED_RATE_LIMIT.max,
            },
            tools: publicTools.map((t) => ({ name: t.name, description: t.description })),
            resources: MCP_GUIDES.map((g) => ({ uri: g.uri, title: g.title })),
            prompts: [{ name: 'find_care_near', arguments: ['place'] }],
        }),
    );
}

/** The CORS preflight a browser sends before its first POST */
export function OPTIONS(request: Request) {
    if (!isPlatformRequestHost(request)) return notFound();
    return withCors(new Response(null, { status: 204 }));
}
