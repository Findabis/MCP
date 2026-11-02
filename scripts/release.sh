#!/usr/bin/env bash
# Cut a release of the public MCP server from this mirror, in one go.
#
#   scripts/release.sh             # release the version the app's code already carries
#   scripts/release.sh patch       # bump MCP_SERVER_VERSION in the app first: patch | minor | major | X.Y.Z
#   scripts/release.sh --dry-run   # show what would change; touch nothing, push nothing
#   scripts/release.sh --no-push   # commit and tag, but leave the push to you
#
# It syncs src/ from the Findabis app (scripts/sync-from-findabis.sh), writes the version into server.json,
# plugin.json and gemini-extension.json, checks CHANGELOG.md has a "## X.Y.Z" section (it writes a stub and stops
# if not), commits "Release vX.Y.Z", tags vX.Y.Z and pushes. The tag starts .github/workflows/publish.yml, which
# waits until findabis.com serves that version, re-publishes the server to the official MCP Registry and creates
# the GitHub release. Deploy the app before or after running this; the workflow waits up to 30 minutes.
#
# A bump edits src/server/mcp/registry.ts in the app and runs the app's MCP tests. Committing and deploying the app
# (yarn deploy) stays with you. Needs git and python3, and the app checkout (default ../Findabis, or FINDABIS_APP).
set -euo pipefail
cd "$(dirname "$0")/.."

APP="${FINDABIS_APP:-../Findabis}"
REG="$APP/src/server/mcp/registry.ts"
PUSH=1
DRY=0
BUMP=""
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY=1 ;;
        --no-push) PUSH=0 ;;
        -h | --help) sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) BUMP="$arg" ;;
    esac
done

fail() { echo "release: $*" >&2; exit 1; }
[ -f "$REG" ] || fail "Findabis app not found at $APP (set FINDABIS_APP)"
[ "$(git branch --show-current)" = "main" ] || fail "release from main"
if [ "$DRY" = 0 ]; then
    git diff --quiet && git diff --cached --quiet || fail "commit or stash your changes first"
fi

current="$(sed -n "s/^export const MCP_SERVER_VERSION = '\(.*\)';/\1/p" "$REG")"
[ -n "$current" ] || fail "no MCP_SERVER_VERSION in $REG"
next="$current"
if [ -n "$BUMP" ]; then
    IFS=. read -r major minor patch <<<"$current"
    case "$BUMP" in
        major) next="$((major + 1)).0.0" ;;
        minor) next="$major.$((minor + 1)).0" ;;
        patch) next="$major.$minor.$((patch + 1))" ;;
        [0-9]*.[0-9]*.[0-9]*) next="$BUMP" ;;
        *) fail "bump must be patch, minor, major or X.Y.Z (got '$BUMP')" ;;
    esac
fi
echo "Version: $current → $next"
git rev-parse -q --verify "refs/tags/v$next" >/dev/null && fail "tag v$next already exists"

if [ "$next" != "$current" ]; then
    if [ "$DRY" = 1 ]; then
        echo "Would set MCP_SERVER_VERSION = '$next' in $REG and run the app's MCP tests"
    else
        python3 - "$REG" "$next" <<'PY'
import pathlib, re, sys
p = pathlib.Path(sys.argv[1]); s = p.read_text()
s2 = re.sub(r"^export const MCP_SERVER_VERSION = '.*';", f"export const MCP_SERVER_VERSION = '{sys.argv[2]}';", s, count=1, flags=re.M)
assert s2 != s, 'version line not found'
p.write_text(s2)
PY
        echo "App: MCP_SERVER_VERSION set to $next in $REG (commit it with the app and deploy)"
        echo "App: running the MCP tests…"
        (cd "$APP" && yarn jest src/server/mcp >/dev/null 2>&1) || fail "the app's MCP tests fail after the bump — see yarn jest src/server/mcp"
        echo "App: MCP tests pass"
    fi
fi

# CHANGELOG must say what changed before anything is tagged
if ! grep -Eq "^## $next([^0-9.]|$)" CHANGELOG.md; then
    if [ "$DRY" = 1 ]; then
        echo "Would stop: CHANGELOG.md has no '## $next' section"
    else
        python3 - "$next" <<'PY'
import datetime, pathlib, re, sys
p = pathlib.Path('CHANGELOG.md'); s = p.read_text()
stub = f"## {sys.argv[1]} — {datetime.date.today():%Y-%m}\n\n- \n\n"
m = re.search(r'^## ', s, flags=re.M)
s = s[:m.start()] + stub + s[m.start():] if m else s.rstrip('\n') + '\n\n' + stub
p.write_text(s)
PY
        fail "CHANGELOG.md had no '## $next' section; a stub is in place — write what changed, then run this again"
    fi
fi

if [ "$DRY" = 1 ]; then
    echo "Would sync src/ from $APP, set $next in server.json, plugin.json and gemini-extension.json,"
    echo "commit 'Release v$next', tag v$next and push. Nothing touched."
    exit 0
fi

scripts/sync-from-findabis.sh "$APP"
python3 - "$next" server.json plugin.json gemini-extension.json <<'PY'
import pathlib, re, sys
version, *files = sys.argv[1:]
for name in files:
    p = pathlib.Path(name); s = p.read_text()
    s2 = re.sub(r'"version": "[^"]*"', f'"version": "{version}"', s, count=1)
    assert s2 != s or f'"version": "{version}"' in s, f'no version in {name}'
    p.write_text(s2)
    print(f'{name}: version {version}')
PY

git add -A
if git diff --cached --quiet; then
    echo "Nothing new to commit; tagging the current commit"
else
    git commit -q -m "Release v$next"
    echo "Committed: Release v$next"
fi
git tag -a "v$next" -m "v$next"
echo "Tagged v$next"

if [ "$PUSH" = 1 ]; then
    git push origin main --follow-tags
    echo
    echo "Pushed. The publish workflow is now waiting for findabis.com to serve $next:"
    echo "  gh run watch -R Findabis/MCP"
else
    echo "Not pushed (--no-push). When ready: git push origin main --follow-tags"
fi
if [ "$next" != "$current" ]; then
    echo "Still yours in the app: commit src/server/mcp/registry.ts, then yarn deploy. The workflow publishes once"
    echo "the live card says $next (it waits 30 minutes; after that, re-run it: gh workflow run publish.yml -R Findabis/MCP)."
else
    echo "If the app is not deployed yet: yarn deploy. The workflow waits 30 minutes for the live card to say $next."
fi
