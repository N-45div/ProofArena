#!/usr/bin/env bash
set -euo pipefail

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
  nvm use 23 >/dev/null
fi

node_version="$(node --version 2>/dev/null || true)"
if [ -z "$node_version" ]; then
  echo "Node.js is required before bootstrapping OKX A2A." >&2
  exit 1
fi

node -e '
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 14)) {
  console.error(`Node.js >= 22.14.0 is required. Found ${process.version}.`);
  process.exit(1);
}
'

npm install -g @okxweb3/a2a-node@latest

okx-a2a daemon start --ai-provider codex
okx-a2a switch-runtime --json
okx-a2a agent refresh --json
okx-a2a setup --json
okx-a2a doctor --non-interactive
