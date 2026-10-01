#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# RentHub — Dev Runner
# Starts the API server (port 3000) and Vite frontend (port 5173)
# concurrently and streams colour-coded output side by side.
#
# Usage:
#   ./run.sh             — starts both
#   ./run.sh --stop      — kills any processes left on those ports
#
# Requirements: bash (Git Bash / WSL / macOS / Linux)
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
WEB_DIR="$ROOT_DIR/web"

# ── Colours ───────────────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[36m'
MAGENTA='\033[35m'
GREEN='\033[32m'
YELLOW='\033[33m'
RESET='\033[0m'

# ── Utility: prefix every output line ─────────────────────────────
prefix_stream() {
  local label="$1"
  local color="$2"
  while IFS= read -r line; do
    echo -e "${color}${BOLD}[${label}]${RESET} $line"
  done
}

# ── --stop helper ─────────────────────────────────────────────────
if [[ "${1:-}" == "--stop" ]]; then
  echo -e "${YELLOW}Stopping RentHub dev processes on ports 3000 and 5173...${RESET}"
  for port in 3000 5173; do
    pid=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [[ -n "$pid" ]]; then
      kill -9 "$pid" && echo -e "${GREEN}Killed PID $pid on port $port${RESET}"
    else
      echo "Port $port is already free."
    fi
  done
  exit 0
fi

# ── Banner ────────────────────────────────────────────────────────
echo -e ""
echo -e "${BOLD}${CYAN}  ╔══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}  ║   🏠  RentHub — Dev Environment      ║${RESET}"
echo -e "${BOLD}${CYAN}  ╚══════════════════════════════════════╝${RESET}"
echo -e "${YELLOW}  API Server  → http://localhost:3000${RESET}"
echo -e "${MAGENTA}  Frontend    → http://localhost:5173${RESET}"
echo -e ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop all processes."
echo -e ""

# ── Dependency check ──────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "ERROR: npm is not installed or not in PATH." >&2
  exit 1
fi

# ── Install deps if node_modules are missing ──────────────────────
if [[ ! -d "$SERVER_DIR/node_modules" ]]; then
  echo -e "${YELLOW}Installing server dependencies...${RESET}"
  (cd "$SERVER_DIR" && npm install)
fi

if [[ ! -d "$WEB_DIR/node_modules" ]]; then
  echo -e "${YELLOW}Installing web dependencies...${RESET}"
  (cd "$WEB_DIR" && npm install)
fi

# ── Launch both processes ─────────────────────────────────────────
cleanup() {
  echo -e "\n${YELLOW}Shutting down RentHub dev servers...${RESET}"
  kill "$SERVER_PID" "$WEB_PID" 2>/dev/null || true
  wait "$SERVER_PID" "$WEB_PID" 2>/dev/null || true
  echo -e "${GREEN}All processes stopped. Goodbye!${RESET}"
}
trap cleanup INT TERM EXIT

# Start API server
(cd "$SERVER_DIR" && npm run dev 2>&1) | prefix_stream "server" "$CYAN" &
SERVER_PID=$!

# Small delay so server boots first (optional, prevents port race)
sleep 1

# Start Vite frontend
(cd "$WEB_DIR" && npm run dev 2>&1) | prefix_stream "web   " "$MAGENTA" &
WEB_PID=$!

# Wait for both
wait "$SERVER_PID" "$WEB_PID"
