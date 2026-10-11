import type { z } from 'zod';
import { decodeEntities } from '@/utils/searchText';

/**
 * One MCP tool. `scopes` is what a caller must hold to see it at all — the
 * dispatcher filters the advertised list, so a tool a caller may not use is
 * never offered rather than offered and refused.
 *
 * Tools live in two module trees on purpose. This one is imported by the
 * HTTP route; the developer tools in `scripts/mcp/` are NOT and must never
 * be, because `dev_query` is arbitrary SQL and this endpoint faces the
 * internet. Separate trees make that a build error rather than a filter that
 * could be got wrong.
 */
export type McpScope = 'public' | 'entity:read' | 'entity:write' | 'agent';

/**
 * One version string for the handshake, the GET probe and the server card
 * at /.well-known/mcp/server.json — three places that must never disagree.
 * A bump means a re-publish to the registry (docs/MCP_PLAN.md, the end).
 */
export const MCP_SERVER_VERSION = '0.3.0';

export type McpTool = {
    name: string;
    title: string;
    /**
     * Read by a model to decide whether to call this. It is a prompt: say
     * what the tool answers, and say what it does not cover.
     */
    description: string;
    inputSchema: z.ZodRawShape;
    scopes: McpScope[];
    /** Advertised as `readOnlyHint`; a public tool is always read-only, an agent tool says so per tool */
    readOnly?: boolean;
    /** Never accepts an entity id — scope comes from the credential, not the model */
    handler: (args: any, ctx: McpCallContext) => Promise<string>;
};

/** What a public tool answers: a short text rendering, and the same facts as typed rows */
export type McpToolOutput = { text: string; structured: Record<string, unknown> };

/**
 * A public tool: always read-only and idempotent, and always typed. The
 * `outputSchema` is advertised to clients and the SDK checks every answer
 * against it, so a field the schema does not name cannot ride along unseen.
 */
export type PublicMcpTool = Omit<McpTool, 'handler' | 'readOnly'> & {
    outputSchema: z.ZodRawShape;
    handler: (args: any, ctx: McpCallContext) => Promise<McpToolOutput>;
};

export type McpCallContext = {
    /** Entity the credential is scoped to, for the entity namespace. Null for public callers. */
    entity: { entityType: string; entityId: string } | null;
    headers: Headers;
};

/**
 * A refusal whose message is safe to show the model ("no clinic with that
 * slug"). Any other error reaches it as "unexpected error": a driver error
 * names the database host.
 */
export class McpToolError extends Error {}

/**
 * Wrap a tool's text for the MCP content envelope. Names are stored as
 * typed — `Canopy Growth&reg;` — and the website decodes them at render;
 * this is the one render step the MCP has, so it decodes here too, or a
 * model quotes the entity.
 */
export const asContent = (text: string) => ({ content: [{ type: 'text' as const, text: decodeEntities(text) }] });

/** Decode every string in a structured answer, as `asContent` does for the text */
function decodeDeep(value: unknown): unknown {
    if (typeof value === 'string') return decodeEntities(value);
    if (Array.isArray(value)) return value.map(decodeDeep);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, decodeDeep(inner)]));
    }
    return value;
}

/** A successful public tool call: text for the model to read, typed rows for the client to use */
export const asResult = ({ text, structured }: McpToolOutput) => ({
    ...asContent(text),
    structuredContent: decodeDeep(structured) as Record<string, unknown>,
});

/** A failed call the model can act on (bad slug, rate limit) — a result, not a protocol error that ends the turn */
export const asError = (text: string) => ({ ...asContent(text), isError: true });

/**
 * Models do not page well: threading a cursor across turns goes wrong, and a
 * hundred rows crowds out the reasoning they were fetched for. Every list
 * tool returns a short slice and says how much it left, so the model narrows
 * with a filter instead.
 */
export function summarise(rows: string[], total: number, hint: string): string {
    if (!rows.length) return `No matches. ${hint}`;
    const more = total > rows.length ? `\n\nShowing ${rows.length} of ${total}. ${hint}` : '';
    return `${rows.join('\n')}${more}`;
}
