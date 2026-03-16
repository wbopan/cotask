#!/bin/bash
# Post-install hook: install npm dependencies and create global CLI symlink
set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${PLUGIN_ROOT}/server"

# Install server dependencies
if [ -f "${SERVER_DIR}/package.json" ]; then
  echo "[task-management] Installing server dependencies..."
  cd "${SERVER_DIR}" && npm install --production --silent 2>/dev/null
fi

# Create global CLI symlink
SCRIPT="${PLUGIN_ROOT}/scripts/task-dashboard.sh"
BIN_DIR="${HOME}/.local/bin"
LINK="${BIN_DIR}/task-dashboard"

if [ -f "${SCRIPT}" ]; then
  mkdir -p "${BIN_DIR}"
  ln -sf "${SCRIPT}" "${LINK}"
  chmod +x "${SCRIPT}"
  echo "[task-management] Created global command: task-dashboard"
  echo "[task-management] Make sure ${BIN_DIR} is in your PATH"
fi
