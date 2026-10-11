import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { MCP_SERVER_INSTRUCTIONS } from './disclaimer';
import { MCP_GUIDES } from './guides';
import { asError, asResult, type McpCallContext, McpToolError, type PublicMcpTool } from './registry';
import { MCP_SERVER_INFO } from './serverInfo';
import { publicTools } from './tools/public';

/**
 * The public MCP server for one request: the public tools, the static guides
 * as resources and one prompt. Nothing here takes a health answer, an id, an
 * email or a phone number — the inputs are text queries, enums and page slugs.
 *
 * Every public tool is advertised read-only, idempotent and closed-world: it
 * reads the Findabis directory and nothing else, so a client may call it
 * without asking the user each time.
 */
export const PUBLIC_TOOL_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
} as const;

/** Messages the model can act on; anything else (a driver error names the database host) is "unexpected error" */
function reasonOf(error: unknown): string {
    if (error instanceof McpToolError) return error.message;
    if (error instanceof TRPCError) return error.message;
    return 'unexpected error';
}

/** One tool's callback: the rate gate, the handler, and every failure as an `isError` result the model can read */
export function runPublicTool(tool: PublicMcpTool, ctx: McpCallContext, allowCall: () => Promise<boolean>) {
    return async (args: Record<string, unknown>) => {
        if (!(await allowCall())) return asError(`${tool.name} failed: rate limit exceeded — wait a minute and retry.`);
        try {
            return asResult(await tool.handler(args, ctx));
        } catch (error) {
            return asError(`${tool.name} failed: ${reasonOf(error)}`);
        }
    };
}

/** A UK town or postcode: letters, digits, spaces and the punctuation place names use — nothing else reaches the prompt */
const placeInput = z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Za-z0-9 ,.'()-]+$/, 'A UK town, city or postcode')
    .describe('A UK town, city or postcode, e.g. "Leeds" or "M1 1AE".');

export function findCareNearPrompt(place: string): string {
    return [
        `Find medical cannabis clinics and dispensing pharmacies near ${place}, UK, using the Findabis tools.`,
        '',
        `1. Call find_clinics with near "${place}" (nearest first, with miles). Many clinics also consult online UK-wide: if few are close, call it again with consultationType ONLINE and no near.`,
        `2. Call find_pharmacies with near "${place}". Most deliver UK-wide, so delivery matters more than distance.`,
        "3. List what you found with each listing's Findabis page URL, town, distance, and for clinics the published fees. Use only the distances the tools return. To weigh two or more, call compare_providers.",
        '4. Say plainly that Findabis is a directory, not medical advice; that only a specialist decides whether anyone can be prescribed; and that a pharmacy dispenses only against a prescription a clinic has issued.',
        '5. For the route to a prescription, read the resource findabis://guide/how-to-get-a-prescription.',
    ].join('\n');
}

export function createPublicMcpServer(ctx: McpCallContext, allowCall: () => Promise<boolean>): McpServer {
    // `instructions` travels in the initialize response and clients place it in
    // the model's context — the one place a disclaimer reaches every tool call
    const server = new McpServer(MCP_SERVER_INFO, { instructions: MCP_SERVER_INSTRUCTIONS });

    for (const tool of publicTools) {
        server.registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                inputSchema: tool.inputSchema,
                outputSchema: tool.outputSchema,
                annotations: { title: tool.title, ...PUBLIC_TOOL_ANNOTATIONS },
            },
            runPublicTool(tool, ctx, allowCall),
        );
    }

    for (const guide of MCP_GUIDES) {
        server.registerResource(
            guide.name,
            guide.uri,
            { title: guide.title, description: guide.description, mimeType: 'text/markdown' },
            async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: guide.text }] }),
        );
    }

    server.registerPrompt(
        'find_care_near',
        {
            title: 'Find care near a place',
            description:
                'Clinics and dispensing pharmacies near a UK town or postcode, with Findabis page links. Takes only a place.',
            argsSchema: { place: placeInput },
        },
        ({ place }) => ({
            description: `Clinics and pharmacies near ${place}`,
            messages: [{ role: 'user', content: { type: 'text', text: findCareNearPrompt(place) } }],
        }),
    );

    return server;
}
