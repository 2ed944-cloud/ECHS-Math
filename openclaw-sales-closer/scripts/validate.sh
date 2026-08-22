#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
cd "$ROOT"

python3 - <<'PY'
import json
import pathlib
import re
import sys

root = pathlib.Path('.')
repo = root.parent
errors = []

def fail(message):
    errors.append(message)

def load_json(path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        fail(f'{path}: invalid JSON: {exc}')
        return None

pricing_path = root / 'workspace/commercial/pricing.json'
evals_path = root / 'evals/scenarios.json'
schema_path = root / 'integrations/lead.schema.json'
config_path = root / 'config/openclaw.sales.example.json5'

pricing = load_json(pricing_path)
evals_data = load_json(evals_path)
load_json(schema_path)

if isinstance(pricing, dict):
    discount = pricing.get('autonomous_discount_percent')
    if not isinstance(discount, (int, float)) or not 0 <= discount <= 100:
        fail('pricing.json: autonomous_discount_percent must be between 0 and 100')
    if pricing.get('configured') is True:
        for key in ('seller_legal_name', 'commercial_product_name', 'payment_terms'):
            if not str(pricing.get(key, '')).strip():
                fail(f'pricing.json: {key} is required when configured=true')
        for offer in pricing.get('offers', []):
            name = offer.get('sku', '<unknown>')
            price = offer.get('price')
            floor = offer.get('floor_price')
            if not isinstance(price, (int, float)) or price <= 0:
                fail(f'pricing.json: {name} requires a positive price when configured=true')
            if not isinstance(floor, (int, float)) or floor <= 0:
                fail(f'pricing.json: {name} requires a positive floor_price when configured=true')
            if isinstance(price, (int, float)) and isinstance(floor, (int, float)) and floor > price:
                fail(f'pricing.json: {name} floor_price cannot exceed price')

if isinstance(evals_data, list):
    if len(evals_data) < 20:
        fail('evals/scenarios.json: expected at least 20 adversarial scenarios')
    ids = [row.get('id') for row in evals_data if isinstance(row, dict)]
    if len(ids) != len(set(ids)):
        fail('evals/scenarios.json: scenario ids must be unique')
else:
    fail('evals/scenarios.json: expected a JSON array')

try:
    config = config_path.read_text(encoding='utf-8')
except Exception as exc:
    config = ''
    fail(f'{config_path}: cannot read: {exc}')

required_config_fragments = [
    'dmScope: "per-account-channel-peer"',
    'dmPolicy: "open"',
    'allowFrom: ["*"]',
    'groupPolicy: "disabled"',
    'agentId: "echs-sales-closer"',
    'defaultMode: "agent"',
    'transcriptionProvider: "openai"',
    'toolPolicy: "safe-read-only"',
]
for fragment in required_config_fragments:
    if fragment not in config:
        fail(f'OpenClaw config missing required hardening fragment: {fragment}')

if 'dmPolicy: "pairing"' in config:
    fail('OpenClaw config must not require manual DM pairing for the public sales inbox')

intro_match = re.search(r'introMessage\s*:\s*"([^"]+)"', config, flags=re.I)
if not intro_match or 'ai sales specialist' not in intro_match.group(1).lower() or 'transcription' not in intro_match.group(1).lower():
    fail('OpenClaw Meet introMessage must disclose AI identity and transcription')

for skill in sorted((root / 'workspace/skills').glob('*/SKILL.md')):
    text = skill.read_text(encoding='utf-8')
    if not text.startswith('---\n') or '\nname:' not in text or '\ndescription:' not in text:
        fail(f'{skill}: missing OpenClaw skill frontmatter')

expected = [
    root / 'workspace/AGENTS.md',
    root / 'workspace/SOUL.md',
    root / 'workspace/IDENTITY.md',
    root / 'workspace/USER.md',
    root / 'workspace/TOOLS.md',
    root / 'workspace/knowledge/PRODUCT.md',
    root / 'workspace/knowledge/CLAIMS_REGISTER.md',
    root / 'workspace/playbooks/DISCOVERY.md',
    root / 'workspace/playbooks/DEMO.md',
    root / 'workspace/playbooks/NEGOTIATION.md',
    root / 'workspace/playbooks/CLOSING.md',
    repo / 'demo/school/index.html',
    repo / 'demo/school/demo.css',
    repo / 'demo/school/demo.js',
]
for path in expected:
    if not path.is_file():
        fail(f'missing required file: {path}')

demo_path = repo / 'demo/school/index.html'
if demo_path.is_file():
    demo = demo_path.read_text(encoding='utf-8').lower()
    if 'synthetic data' not in demo or 'demo data only' not in demo:
        fail('school demo must visibly identify synthetic/demo data')

# Basic secret-leak guard. Placeholders and environment variable names are allowed.
secret_patterns = {
    'OpenAI-style key': re.compile(r'\bsk-[A-Za-z0-9_-]{24,}\b'),
    'GitHub token': re.compile(r'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),
    'private key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'long JWT': re.compile(r'\beyJ[A-Za-z0-9_-]{80,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b'),
}
for base in (root, repo / 'demo/school'):
    for path in base.rglob('*'):
        if not path.is_file() or '.git' in path.parts:
            continue
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        for label, pattern in secret_patterns.items():
            if pattern.search(text):
                fail(f'{path}: possible committed {label}')

if errors:
    print('OpenClaw sales closer validation FAILED:', file=sys.stderr)
    for item in errors:
        print(f' - {item}', file=sys.stderr)
    sys.exit(1)

print(f'OpenClaw sales closer static validation passed ({len(evals_data)} sales scenarios).')
PY

bash -n "$ROOT/scripts/install.sh"
node --check "$REPO/demo/school/demo.js"

echo "Shell and demo JavaScript syntax checks passed."
