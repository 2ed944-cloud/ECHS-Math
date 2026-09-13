#!/usr/bin/env bash
set -euo pipefail

# Safe bootstrap for a dedicated Ubuntu/Debian VPS.
# This script installs prerequisites, creates persistent directories, clones
# OpenClaw, stages the sales workspace/config, and generates local secrets.
# It deliberately does NOT expose port 18789 publicly and does NOT invent API keys.

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="${OPENCLAW_RUNTIME_DIR:-$HOME/openclaw-runtime}"
STATE_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
SALES_WORKSPACE="$STATE_DIR/workspace-echs-sales"
AUTH_SECRET_DIR="${OPENCLAW_AUTH_PROFILE_SECRET_DIR:-$HOME/.openclaw-auth-profile-secrets}"

sudo apt-get update
sudo apt-get install -y git curl ca-certificates openssl ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi

sudo systemctl enable --now docker
sudo ufw allow OpenSSH
sudo ufw --force enable

mkdir -p "$STATE_DIR" "$SALES_WORKSPACE" "$AUTH_SECRET_DIR"
chmod 700 "$STATE_DIR" "$AUTH_SECRET_DIR"

if [ ! -d "$RUNTIME_DIR/.git" ]; then
  git clone https://github.com/openclaw/openclaw.git "$RUNTIME_DIR"
else
  git -C "$RUNTIME_DIR" pull --ff-only
fi

cp -R "$PACKAGE_ROOT/workspace/." "$SALES_WORKSPACE/"
cp "$PACKAGE_ROOT/config/openclaw.sales.example.json5" "$STATE_DIR/openclaw.json"

ENV_FILE="$RUNTIME_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  GATEWAY_TOKEN="$(openssl rand -hex 32)"
  KEYRING_PASSWORD="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<EOF
OPENCLAW_IMAGE=ghcr.io/openclaw/openclaw:latest
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_GATEWAY_TOKEN=$GATEWAY_TOKEN
OPENCLAW_DISABLE_BONJOUR=1
OPENCLAW_CONFIG_DIR=$STATE_DIR
OPENCLAW_WORKSPACE_DIR=$STATE_DIR/workspace
OPENCLAW_AUTH_PROFILE_SECRET_DIR=$AUTH_SECRET_DIR
GOG_KEYRING_PASSWORD=$KEYRING_PASSWORD
XDG_CONFIG_HOME=/home/node/.config
OPENAI_API_KEY=REPLACE_WITH_OPENAI_PROJECT_KEY
EOF
  chmod 600 "$ENV_FILE"
fi

cat <<EOF

Bootstrap complete.

Runtime:   $RUNTIME_DIR
State:     $STATE_DIR
Workspace: $SALES_WORKSPACE
Env file:  $ENV_FILE

Security state:
- UFW enabled; SSH allowed.
- No public rule was created for port 18789.
- Gateway token/keyring secret were generated locally if .env was new.

NEXT REQUIRED ACTIONS:
1. Edit $ENV_FILE and replace OPENAI_API_KEY placeholder.
2. Read $PACKAGE_ROOT/deploy/README.md and run the activation commands.
3. Keep TCP 18789 private. Use an SSH tunnel or Tailscale for the Control UI.
4. Pair WhatsApp once by QR.
5. Pair a desktop Meet node named sales-meet-node.

EOF
