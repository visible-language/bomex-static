#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-content}"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run prettier." >&2
  exit 1
fi

exec npx prettier --parser html --write "${ROOT_DIR}/**/*.html"
