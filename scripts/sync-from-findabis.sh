#!/usr/bin/env bash
# Copy the public MCP server's source from the Findabis app into src/.
# Public, read-only tools only: the agent (Finny), Findabis for Business (the signed-in business MCP and its OAuth)
# and local dev servers are private and never copied.
# Usage: scripts/sync-from-findabis.sh [path to the Findabis repo, default ../Findabis]
set -euo pipefail
cd "$(dirname "$0")/.."
APP="${1:-../Findabis}"
[ -d "$APP/src/server/mcp" ] || { echo "Findabis repo not found at $APP" >&2; exit 1; }

rm -rf src
mkdir -p src/server/mcp/tools/public src/server/mcp/knowledge src/server/mcp/site src/app/api/mcp \
    "src/app/.well-known/mcp/server.json"

for f in callerIdentity disclaimer guides http instructions limits links prompts publicServer registry serverInfo templates; do
    cp "$APP/src/server/mcp/$f.ts" src/server/mcp/
done
cp "$APP"/src/server/mcp/tools/public/*.ts src/server/mcp/tools/public/
cp "$APP"/src/server/mcp/knowledge/*.ts src/server/mcp/knowledge/
# A business's own MCP on its own domain (the route hands every other host there): public data of programme members
cp "$APP"/src/server/mcp/site/*.ts src/server/mcp/site/
cp "$APP/src/app/api/mcp/route.ts" src/app/api/mcp/
cp "$APP/src/app/.well-known/mcp/server.json/route.ts" "src/app/.well-known/mcp/server.json/"

# Guard: nothing from the private servers may slip in — any mention of their paths, on any line (a wrapped import,
# an `export … from`, a dynamic `import()`), not only a one-line import
PRIVATE="(from|import\(|require\()[[:space:]]*['\"][^'\"]*(tools/agent|scripts/mcp|dev-server|mcp/business|api/mcp/oauth|routers/mcpConnect|routers/businessMcp)"
if grep -rlE "$PRIVATE" src --include=*.ts | grep -q .; then
    echo "Refusing: a copied file refers to a private MCP module" >&2
    grep -rnE "$PRIVATE" src --include=*.ts >&2
    exit 1
fi
echo "Synced $(find src -name '*.ts' | wc -l | tr -d ' ') files from $APP"
