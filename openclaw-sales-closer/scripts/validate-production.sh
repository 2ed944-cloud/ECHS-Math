#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required=(
  "$ROOT/deploy/.env.example"
  "$ROOT/deploy/local-first-setup.sh"
  "$ROOT/deploy/vps-bootstrap.sh"
  "$ROOT/deploy/README.md"
  "$ROOT/deploy/MEET_NODE.md"
  "$ROOT/LOW_COST_ARCHITECTURE.md"
  "$ROOT/ACTIVATION_INPUTS.md"
  "$ROOT/integrations/STRIPE.md"
  "$ROOT/integrations/CRM_BLUEPRINT.md"
  "$ROOT/workspace/commercial/PRICING_RECOMMENDATION.md"
  "$ROOT/workspace/policy/COMPLIANCE.md"
)

for path in "${required[@]}"; do
  test -f "$path" || { echo "Missing production file: $path" >&2; exit 1; }
done

bash -n "$ROOT/deploy/local-first-setup.sh"
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
arch = (root / 'LOW_COST_ARCHITECTURE.md').read_text(encoding='utf-8')
activation = (root / 'ACTIVATION_INPUTS.md').read_text(encoding='utf-8')
errors = []

fragments = [
    'primary: "openai/gpt-5.6-luna"',
    'primary: "openai/gpt-5.6-terra"',
    'primary: "openai/gpt-5.6-sol"',
    'provider: "microsoft"',
    'defaultTransport: "chrome"',
    'agentId: "echs-meeting-closer"',
]
for f in fragments:
    if f not in config:
        errors.append(f'missing local-first config fragment: {f}')

if 'defaultTransport: "chrome-node"' in config:
    errors.append('launch config must not require a separate chrome-node')

if pricing.get('configured') is not False:
    errors.append('pricing.json must stay configured=false until explicit commercial approval')

if 'NOT ACTIVE' not in rec:
    errors.append('pricing recommendation must be visibly marked NOT ACTIVE')

if 'OPENAI_API_KEY=REPLACE_ONLY_WHEN_MEET_VOICE_IS_ENABLED' not in env:
    errors.append('env template must state that the API key is only required for Meet voice transcription')

if re.search(r'\bsk-[A-Za-z0-9_-]{20,}\b', env):
    errors.append('env template appears to contain a real OpenAI key')

for phrase in ('No VPS is required for launch.', 'No n8n is required for launch.', 'Microsoft neural TTS'):
    if phrase not in arch:
        errors.append(f'low-cost architecture missing launch rule: {phrase}')

if 'VPS and a second meeting computer are **not required for launch**' not in activation:
    errors.append('activation checklist still treats paid infrastructure as a launch requirement')

if errors:
    for e in errors:
        print(f'ERROR: {e}', file=sys.stderr)
    raise SystemExit(1)

print('Local-first production sales closer validation passed.')
PY
