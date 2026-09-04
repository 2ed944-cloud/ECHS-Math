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

echo "Installing required customer-channel and meeting plugins..."
openclaw plugins install clawhub:@openclaw/whatsapp
openclaw plugins install npm:@openclaw/google-meet

echo
echo "Workspace copied to: $WORKSPACE"
echo "Required activation steps:"
echo "1) Merge config/openclaw.sales.example.json5 into ~/.openclaw/openclaw.json"
echo "2) Validate and audit the Gateway configuration:"
echo "   openclaw config validate"
echo "   openclaw security audit"
echo "3) Link the dedicated WhatsApp business account:"
echo "   openclaw channels login --channel whatsapp --account biz"
echo "4) Configure a supported Google Meet audio host plus realtime transcription and TTS credentials."
echo "5) Run the meeting preflight:"
echo "   openclaw googlemeet setup --mode agent"
echo "6) Fill workspace/commercial/pricing.json and set configured=true only after commercial approval."
echo "7) Restart and probe:"
echo "   openclaw gateway restart"
echo "   openclaw channels status --probe"
echo "   openclaw agents list --bindings"
echo
echo "Optional PSTN voice calls can be added later with:"
echo "   openclaw plugins install @openclaw/voice-call"
echo "   openclaw voicecall setup"
