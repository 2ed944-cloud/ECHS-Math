# Installer Hotfix 5.0.1

## Issue

The 5.0.0 Windows installer invoked `admin/tools/validate-private-bank.ps1`, whose JSON error message contained an expandable string with `$Relative:`. Windows PowerShell interpreted the colon as part of a drive-qualified variable reference and raised `InvalidVariableReferenceWithDrive` while parsing the script.

## Repair

- Replaced the ambiguous interpolation with `-f` format-operator output.
- Added `-LiteralPath` to JSON file reads and existence checks.
- Added a package-wide PowerShell parser preflight to `install.ps1` before package validation, backup, or copying.
- Added a release-validator regression check for `$Variable:` followed by a non-variable character.
- Bumped installer and verification metadata to 5.0.1.

## Scope

No question IDs, question text, answers, solutions, KaTeX, media, mappings, student-ready decisions, or application visual assets changed in this installer-only hotfix.

## Repository safety

The failing 5.0.0 code path occurred during package validation, before the installer created a backup or copied files into the target repository. A failure matching the screenshot therefore left the target repository unchanged.
