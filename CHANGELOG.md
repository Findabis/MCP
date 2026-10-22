# Changelog

Versions match the `version` the server reports in its handshake and on its
[registry card](https://findabis.com/.well-known/mcp/server.json).

## 0.4.0 — 2026-10

- New `find_brands`: brands by name or dose form, with page link, location, website and how many products each
  lists. Sorted by name or product count, never by sponsorship.
- `offset` on `find_clinics`, `find_pharmacies`, `find_products`, `find_strains` and `find_brands` for the next
  page; every list answer says which offset comes next.
- `plugin.json` and `mcp.json` ([Agent Plugins](https://agent-plugins.org)) and `gemini-extension.json`, so Cursor
  and Gemini CLI can install the server from this repo.

## 0.3.0 — 2026-10

- Eight public, read-only tools: `find_clinics`, `find_pharmacies`, `find_products`, `get_product`,
  `find_strains`, `get_listing`, `compare_providers`, `search_findabis`.
- Every tool returns typed structured content alongside text.
- Medical disclaimer and answering rules sent as the server's `instructions`.
- Public rate limit: 60 requests per minute per client.
- Listed in the official MCP Registry as `com.findabis/findabis`.
