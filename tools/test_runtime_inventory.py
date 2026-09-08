"""Validate the dated ECHS-001 inventory without modifying runtime or bank data."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
inventory = json.loads((ROOT / 'docs/codex/RUNTIME_INVENTORY_20260908.json').read_text(encoding='utf-8'))
assert inventory['schema_version'] == 'echs.runtime-inventory.v1'
assert inventory['observed_main_sha'] == 'fda45056e7b11e3f1d45bf96f7c8c36246d69e8d'
assert inventory['tracked_source_files'] > 1000
for group in ['supabase_functions', 'supabase_migrations', 'critical_tests']:
    assert inventory[group] and len(inventory[group]) == len(set(inventory[group])), group
    for name in inventory[group]:
        path = (ROOT / name).resolve()
        assert path.is_relative_to(ROOT) and path.is_file(), name
assert len(inventory['supabase_functions']) == 11
assert len(inventory['supabase_migrations']) == 20
scripts = inventory['index_script_order']
assert scripts.index('data/courses.js') < scripts.index('data/ap-calculus-update.js')
assert not any('preview/' in path for path in scripts)
assert inventory['deployment']['production_branch'] == 'main'
assert '.echs-backups/' in inventory['deployment']['artifact_exclusions']
assert 'supabase/' in inventory['deployment']['artifact_exclusions']
assert 'integration/' in inventory['deployment']['artifact_exclusions']
assert inventory['backend_audit'] and inventory['content_audit']
assert any('.staging/' in row['paths'] for row in inventory['noncanonical_copies'])
print('PASS: dated runtime inventory, canonical paths, deployment boundaries and critical tests')
