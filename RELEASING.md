# Releasing a new version

The server's version lives in one place, `MCP_SERVER_VERSION` in the app (`src/server/mcp/registry.ts`); the
handshake, the GET probe and the server card all read it. This repo mirrors it in `server.json`, `plugin.json` and
`gemini-extension.json`, and the official MCP Registry lists whichever version was last published. One script and
one workflow keep the four in step.

## Once: give the workflow the namespace key

The registry accepts a new version of `com.findabis/findabis` only from whoever holds the Ed25519 key behind
[`findabis.com/.well-known/mcp-registry-auth`](https://findabis.com/.well-known/mcp-registry-auth). The same hex
key that `yarn mcp:publish` reads from `~/.config/findabis-mcp/private-key.hex` goes into a repository secret:

```bash
gh secret set MCP_REGISTRY_PRIVATE_KEY -R Findabis/MCP < ~/.config/findabis-mcp/private-key.hex
```

## Each release

1. **Cut it from this repo.** With the app checked out beside this one (`../Findabis`):

   ```bash
   scripts/release.sh patch        # or minor, major, or an exact X.Y.Z; no argument keeps the app's version
   ```

   It bumps `MCP_SERVER_VERSION` in the app and runs the app's MCP tests, syncs `src/` here, writes the version into
   the three manifests, insists on a `## X.Y.Z` section in `CHANGELOG.md` (it writes a stub and stops if there is
   none), then commits `Release vX.Y.Z`, tags `vX.Y.Z` and pushes. `--dry-run` shows the plan and touches nothing.

2. **Deploy the app.** Commit the `registry.ts` bump there and run `yarn deploy`. Before or after step 1, either order
   works.

3. **Let the workflow finish.** The tag starts [`publish.yml`](.github/workflows/publish.yml), which waits up to
   30 minutes for the live server card and GET probe to report the new version, publishes the *live* card to the
   registry (never the repo copy, so the registry can't describe something findabis.com doesn't serve), checks the
   listing, and creates the GitHub release from the CHANGELOG section. Watch it with:

   ```bash
   gh run watch -R Findabis/MCP
   ```

   If the deploy took longer than the wait, re-run it after the deploy: `gh workflow run publish.yml -R Findabis/MCP`.
   Re-runs are safe: a version the registry already lists is skipped, and an existing release is left alone.

## Where the new version shows up

- **Official MCP Registry** — from the workflow. Glama, PulseMCP, mcprush and GitHub's MCP registry import from it
  within hours; nothing to submit.
- **Gemini CLI extensions and cursor.directory** — read this repo; the manifests carry the version.
- **Claude's connector directory, Smithery, MCPBundles and the rest** — manual submissions, listed with their state
  in the app's `docs/MCP_DISTRIBUTION_PLAN.md`.

## Fallback

`yarn mcp:publish` in the app does the registry step by hand with the local key, after `yarn deploy`; then
`gh release create vX.Y.Z -R Findabis/MCP --notes "See CHANGELOG.md"`.
