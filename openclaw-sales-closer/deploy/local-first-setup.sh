#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${OPENCLAW_SALES_WORKSPACE:-$HOME/.openclaw/workspace-echs-sales}"
CONFIG="$HOME/.openclaw/openclaw.json"
CANDIDATE="$HOME/.openclaw/echs-sales-config.example.json5"

printf '\nECHS OpenClaw Sales — local-first setup\n'
printf '======================================\n'

OS="$(uname -s)"
case "$OS" in
  Darwin) PLATFORM="macos" ;;
  Linux) PLATFORM="linux" ;;
  *)
    echo "This automated local voice-meeting setup supports macOS or Linux Desktop." >&2
    echo "Windows can run OpenClaw, but Chrome talk-back for Meet should use a supported macOS/Linux desktop host." >&2
    exit 2
    ;;
esac

echo "Platform: $PLATFORM"

if ! command -v openclaw >/dev/null 2>&1; then
  echo "OpenClaw is not installed. Installing with the official installer (without onboarding)..."
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
fi

if ! command -v openclaw >/dev/null 2>&1; then
  echo "OpenClaw CLI is still not on PATH. Open a new terminal and rerun this script." >&2
  exit 1
fi

mkdir -p "$WORKSPACE" "$HOME/.openclaw"
cp -R "$ROOT/workspace/." "$WORKSPACE/"
cp "$ROOT/config/openclaw.sales.example.json5" "$CANDIDATE"

echo "Installing customer channel and meeting plugins..."
openclaw plugins install clawhub:@openclaw/whatsapp || true
openclaw plugins install npm:@openclaw/google-meet || true

if [[ "$PLATFORM" == "macos" ]]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew is required for the macOS meeting audio dependencies." >&2
    echo "Install Homebrew, then rerun this script." >&2
    exit 1
  fi
  echo "Installing macOS meeting audio dependencies..."
  brew install blackhole-2ch sox || true
  echo "NOTE: BlackHole may require a reboot before Google Meet voice works."
else
  if command -v apt-get >/dev/null 2>&1; then
    echo "Installing Linux Desktop meeting audio dependencies..."
    sudo apt-get update
    sudo apt-get install -y pipewire-audio pulseaudio-utils
    systemctl --user --now enable pipewire pipewire-pulse wireplumber || true
  else
    echo "Install PipeWire-Pulse plus pactl/pacat/parec using your distribution package manager."
  fi
fi

if [[ ! -f "$CONFIG" ]]; then
  echo "No existing OpenClaw config found. Installing the ECHS sales config as the initial config."
  cp "$CANDIDATE" "$CONFIG"
else
  echo "Existing OpenClaw config detected; it was NOT overwritten."
  echo "Sales config candidate: $CANDIDATE"
fi

echo
echo "Next interactive steps (required once):"
echo "1) Authenticate model reasoning with your ChatGPT/Codex account:"
echo "   openclaw models auth login --provider openai"
echo "2) Verify the tier models exposed to this account:"
echo "   openclaw models list --provider openai"
echo "3) Link the dedicated WhatsApp number when it is ready:"
echo "   openclaw channels login --channel whatsapp --account biz"
echo "4) For autonomous voice meetings, set a small-budget OPENAI_API_KEY for realtime transcription."
echo "5) Validate Meet/audio:"
echo "   openclaw googlemeet setup --transport chrome --mode agent"
echo "6) Validate runtime:"
echo "   openclaw config validate"
echo "   openclaw doctor --fix"
echo "7) Start the gateway:"
echo "   openclaw gateway"
echo
echo "Workspace installed at: $WORKSPACE"
echo "Config candidate: $CANDIDATE"
