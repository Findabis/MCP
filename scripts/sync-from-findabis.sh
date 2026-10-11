#!/usr/bin/env bash
# Copy the public MCP server's source from the Findabis app into src/.
# Public, read-only tools only: the agent (Finny) and local dev servers are private and never copied.
# Usage: scripts/sync-from-findabis.sh [path to the Findabis repo, default ../Findabis]
set -euo pipefail
cd "$(dirname "$0")/.."
APP="${1:-../Findabis}"
[ -d "$APP/src/server/mcp" ] || { echo "Findabis repo not found at $APP" >&2; exit 1; }

rm -rf src
mkdir -p src/server/mcp/tools/public src/app/api/mcp "src/app/.well-known/mcp/server.json"

for f in callerIdentity disclaimer guides limits links publicServer registry serverInfo; do
    cp "$APP/src/server/mcp/$f.ts" src/server/mcp/
done
cp "$APP"/src/server/mcp/tools/public/*.ts src/server/mcp/tools/public/
cp "$APP/src/app/api/mcp/route.ts" src/app/api/mcp/
cp "$APP/src/app/.well-known/mcp/server.json/route.ts" "src/app/.well-known/mcp/server.json/"

# Guard: nothing from the private servers may slip in
PRIVATE="^import .*(tools/agent|scripts/mcp|dev-server)"
if grep -rlE "$PRIVATE" src --include=*.ts | grep -q .; then
    echo "Refusing: a copied file imports a private MCP module" >&2
    grep -rnE "$PRIVATE" src --include=*.ts >&2
    exit 1
fi
echo "Synced $(find src -name '*.ts' | wc -l | tr -d ' ') files from $APP"
