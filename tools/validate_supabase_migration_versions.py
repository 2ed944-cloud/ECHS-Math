#!/usr/bin/env python3
"""Reject duplicate or malformed Supabase migration versions before deployment."""
from __future__ import annotations
import re,sys
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];MIGRATIONS=ROOT/'supabase'/'migrations';PATTERN=re.compile(r'^(?P<version>\d+)_(?P<name>[a-z0-9_]+)\.sql$');errors=[];versions=defaultdict(list)
if not MIGRATIONS.is_dir():errors.append('Missing supabase/migrations directory')
else:
 for path in sorted(MIGRATIONS.glob('*.sql')):
  match=PATTERN.fullmatch(path.name)
  if not match:errors.append(f'Malformed migration filename: {path.name}')
  else:versions[match.group('version')].append(path.name)
for version,names in sorted(versions.items()):
 if len(names)>1:errors.append(f'Duplicate migration version {version}: {", ".join(names)}')
required={
 '202607270001_session_lookup_repair.sql','202607272001_mastery_evidence_foundation.sql','202607272002_mastery_authority_guard.sql','202607272003_attempt_trust_guard.sql','202607272004_atomic_skill_mapping.sql','202607272101_private_bank_foundation.sql','202607272102_private_attempt_trust_bridge.sql'
}
existing={path.name for path in MIGRATIONS.glob('*.sql')} if MIGRATIONS.is_dir() else set()
for name in sorted(required-existing):errors.append(f'Missing required migration: {name}')
legacy={'202607270001_mastery_evidence_foundation.sql','202607270002_mastery_authority_guard.sql','202607270003_attempt_trust_guard.sql','202607270004_atomic_skill_mapping.sql'}
for name in sorted(existing&legacy):errors.append(f'Obsolete colliding migration filename remains: {name}')
print('ECHS Supabase migration version validation');print(f'Migration files: {len(existing)}');print(f'Unique versions: {len(versions)}');print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:sys.exit(1)
print('Status: PASS')
