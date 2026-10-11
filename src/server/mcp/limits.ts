/** Public MCP rate limits; the /docs MCP section quotes them, so keep one source */

/** Anonymous callers, per IP */
export const MCP_RATE_LIMIT = { windowMs: 60_000, max: 60 } as const;

/** Callers presenting an API token, per token — a named caller gets more room and a kill switch */
export const MCP_KEYED_RATE_LIMIT = { windowMs: 60_000, max: 300 } as const;
