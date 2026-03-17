#!/bin/bash
# Post-install hook: install npm dependencies and download UI assets
set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${PLUGIN_ROOT}/server"

# Install server dependencies
if [ -f "${SERVER_DIR}/package.json" ]; then
  echo "[octask] Installing server dependencies..."
  cd "${SERVER_DIR}" && npm install --production --silent 2>/dev/null
fi

# Download bundled UI assets (fonts + lucide)
if [ -x "${PLUGIN_ROOT}/scripts/download-assets.sh" ]; then
  "${PLUGIN_ROOT}/scripts/download-assets.sh"
fi
