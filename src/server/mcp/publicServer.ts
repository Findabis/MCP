import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TRPCError } from '@trpc/server';
import { MCP_GUIDES } from './guides';
import { PUBLIC_MCP_INSTRUCTIONS } from './instructions';
import { PUBLIC_PROMPTS } from './prompts';
import { asError, asResult, type McpCallContext, McpToolError, type PublicMcpTool } from './registry';
import { MCP_SERVER_INFO } from './serverInfo';
import { publicTools } from './tools/public';

/**
 * The public MCP server for one request: the public tools, the static guides
 * as resources and the prompts. Nothing here takes a health answer, an id, an
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

export function createPublicMcpServer(ctx: McpCallContext, allowCall: () => Promise<boolean>): McpServer {
    // `instructions` travels in the initialize response and clients place it in
    // the model's context — the one place the disclaimer and the tool routing
    // reach every tool call
    const server = new McpServer(MCP_SERVER_INFO, { instructions: PUBLIC_MCP_INSTRUCTIONS });

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

    for (const prompt of PUBLIC_PROMPTS) {
        server.registerPrompt(
            prompt.name,
            { title: prompt.title, description: prompt.description, argsSchema: prompt.argsSchema },
            (args) => ({
                description: prompt.summary(args),
                messages: [{ role: 'user', content: { type: 'text', text: prompt.text(args) } }],
            }),
        );
    }

    return server;
}
