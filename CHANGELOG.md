# Changelog

Versions match the `version` the server reports in its handshake and on its
[registry card](https://findabis.com/.well-known/mcp/server.json).

## 0.3.0 — 2026-10

- Eight public, read-only tools: `find_clinics`, `find_pharmacies`, `find_products`, `get_product`,
  `find_strains`, `get_listing`, `compare_providers`, `search_findabis`.
- Every tool returns typed structured content alongside text.
- Medical disclaimer and answering rules sent as the server's `instructions`.
- Public rate limit: 60 requests per minute per client.
- Listed in the official MCP Registry as `com.findabis/findabis`.
