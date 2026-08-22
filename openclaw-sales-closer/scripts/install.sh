#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${OPENCLAW_SALES_WORKSPACE:-$HOME/.openclaw/workspace-echs-sales}"

if ! command -v openclaw >/dev/null 2>&1; then
  echo "openclaw CLI not found. Install OpenClaw first, then re-run." >&2
  exit 1
fi

mkdir -p "$WORKSPACE"
cp -R "$ROOT/workspace/." "$WORKSPACE/"

echo "Installing/updating sales channel and meeting plugins..."
openclaw plugins install clawhub:@openclaw/whatsapp || true
openclaw plugins install npm:@openclaw/google-meet || true
openclaw plugins install @openclaw/voice-call || true

echo
echo "Workspace copied to: $WORKSPACE"
echo "Next:"
echo "1) Merge config/openclaw.sales.example.json5 into ~/.openclaw/openclaw.json"
echo "2) Link the dedicated WhatsApp account:"
echo "   openclaw channels login --channel whatsapp --account biz"
echo "3) Configure realtime transcription + TTS credentials."
echo "4) Run: openclaw googlemeet setup"
echo "5) Fill commercial/pricing.json and set configured=true."
echo "6) Restart: openclaw gateway restart"
