#!/usr/bin/env bash
# Creates the Medusa app in ./backend and layers DS Wardrobe customisations on top.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CUSTOM="$ROOT/backend/src"
TMP="$ROOT/.backend-tmp"

command -v node >/dev/null || { echo "Node 20+ required"; exit 1; }

# 1. Generate a fresh Medusa app (no storefront, no auto db setup)
rm -rf "$TMP"
npx create-medusa-app@latest "$TMP" --skip-db --no-browser || true
[ -f "$TMP/package.json" ] || { echo "create-medusa-app failed; see docs/SETUP.md for manual steps"; exit 1; }

# 2. Copy our customisations over the generated project
cp -R "$CUSTOM/." "$TMP/src/"
cp "$ROOT/backend/.env.template" "$TMP/.env.template"
rm -rf "$ROOT/backend"
mv "$TMP" "$ROOT/backend"

# 3. Register the review module in medusa-config.ts
CFG="$ROOT/backend/medusa-config.ts"
if ! grep -q "modules/review" "$CFG"; then
  node -e '
    const fs=require("fs");const p=process.argv[1];let s=fs.readFileSync(p,"utf8");
    if(/\bmodules\s*:/.test(s)){console.log("medusa-config.ts already has modules: add { resolve: \"./src/modules/review\" } by hand");process.exit(0)}
    s=s.replace("defineConfig({","defineConfig({\n  modules: [{ resolve: \"./src/modules/review\" }],");
    fs.writeFileSync(p,s);' "$CFG"
fi
echo "Done. Next: cd backend && cp .env.template .env && edit it, then see docs/SETUP.md"
