import { type NextRequest, NextResponse } from 'next/server';
import { MCP_SERVER_INFO } from '@/server/mcp/serverInfo';
import { resolveHostContext } from '@/server/utils/siteSeo';
import { BASE_URL } from '@/utils/jsonLd/shared';
import { requestHost } from '@/utils/requestHost';

export const dynamic = 'force-dynamic';

/**
 * The registry's server.json schema. Pinned to the version the installed
 * `mcp-publisher` (1.8.1) writes; the registry validates the card against it
 * on publish. Bump it with the publisher, not on its own.
 */
const SERVER_SCHEMA = 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json';

/**
 * MCP server card — what the official registry and client directories read
 * to describe this server. Platform host only: a customer's domain and a
 * portal subdomain are not the Findabis MCP and must not claim to be.
 *
 * `name` is the reverse-DNS namespace claimed in the registry
 * (`com.findabis`); it must match the claim exactly. Title, version, icons
 * and the website are the handshake's own `serverInfo` (server/mcp/serverInfo),
 * so the card and the server never describe two different things. A version
 * bump here is a re-publish (docs/MCP_PLAN.md, the end).
 */
export async function GET(request: NextRequest) {
    const context = await resolveHostContext(requestHost(request));
    if (context.kind !== 'platform') return new NextResponse('Not Found', { status: 404 });

    return NextResponse.json(
        {
            $schema: SERVER_SCHEMA,
            name: 'com.findabis/findabis',
            title: MCP_SERVER_INFO.title,
            // The registry caps this at 100 characters (it rejected the card
            // with the disclaimer appended). The disclaimer still reaches every
            // client as the server's MCP `instructions`, which has no cap.
            description: MCP_SERVER_INFO.description,
            version: MCP_SERVER_INFO.version,
            websiteUrl: MCP_SERVER_INFO.websiteUrl,
            // Public docs repo (no source): README, changelog, security policy — scanners read maintenance from it
            repository: { url: 'https://github.com/Findabis/MCP', source: 'github' },
            icons: MCP_SERVER_INFO.icons,
            remotes: [{ type: 'streamable-http', url: `${BASE_URL}/api/mcp` }],
        },
        { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } },
    );
}
