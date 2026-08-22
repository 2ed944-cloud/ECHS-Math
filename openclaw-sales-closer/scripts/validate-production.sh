#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required=(
  "$ROOT/deploy/.env.example"
  "$ROOT/deploy/vps-bootstrap.sh"
  "$ROOT/deploy/README.md"
  "$ROOT/deploy/MEET_NODE.md"
  "$ROOT/integrations/STRIPE.md"
  "$ROOT/integrations/CRM_BLUEPRINT.md"
  "$ROOT/workspace/commercial/PRICING_RECOMMENDATION.md"
  "$ROOT/workspace/policy/COMPLIANCE.md"
)

for path in "${required[@]}"; do
  test -f "$path" || { echo "Missing production file: $path" >&2; exit 1; }
done

bash -n "$ROOT/deploy/vps-bootstrap.sh"

python3 - "$ROOT" <<'PY'
import json
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
config = (root / 'config/openclaw.sales.example.json5').read_text(encoding='utf-8')
env = (root / 'deploy/.env.example').read_text(encoding='utf-8')
pricing = json.loads((root / 'workspace/commercial/pricing.json').read_text(encoding='utf-8'))
rec = (root / 'workspace/commercial/PRICING_RECOMMENDATION.md').read_text(encoding='utf-8')
errors = []

fragments = [
    'primary: "openai/gpt-5.6-sol"',
    'model: "gpt-4o-mini-tts"',
    'speakerVoice: "cedar"',
    'defaultTransport: "chrome-node"',
    'node: "sales-meet-node"',
    'allow: ["browser.proxy", "googlemeet.chrome"]',
]
for f in fragments:
    if f not in config:
        errors.append(f'missing production config fragment: {f}')

if pricing.get('configured') is not False:
    errors.append('pricing.json must stay configured=false until explicit commercial approval')

if 'NOT ACTIVE' not in rec:
    errors.append('pricing recommendation must be visibly marked NOT ACTIVE')

if 'OPENAI_API_KEY=REPLACE_WITH_OPENAI_PROJECT_KEY' not in env:
    errors.append('env template must contain the OpenAI placeholder, not a secret')

if re.search(r'\bsk-[A-Za-z0-9_-]{20,}\b', env):
    errors.append('env template appears to contain a real OpenAI key')

if '18789' not in (root / 'deploy/README.md').read_text(encoding='utf-8'):
    errors.append('deployment runbook must state the private gateway port rule')

if errors:
    for e in errors:
        print(f'ERROR: {e}', file=sys.stderr)
    raise SystemExit(1)

print('Production sales closer validation passed.')
PY
