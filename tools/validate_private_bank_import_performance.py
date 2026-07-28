#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    file = root / path
    if not file.is_file():
        errors.append(f"Missing {path}")
        return ""
    return file.read_text(encoding="utf-8", errors="replace")

uploader = read("tools/upload_private_bank_package_fast.py")
processor = read("tools/process_teacher_upload_request_fast.py")
workflow = read(".github/workflows/process-teacher-uploads.yml")

for marker in ["return=minimal", "Questions imported:", "Media archives uploaded:", "--batch-size", "IMPORT_RESULT="]:
    if marker not in uploader:
        errors.append(f"Fast uploader missing {marker}")
for marker in ["subprocess.Popen", "stdout=subprocess.PIPE", "status.eq.processing", "upload_private_bank_package_fast.py"]:
    if marker not in processor:
        errors.append(f"Fast processor missing {marker}")
for marker in ["timeout-minutes: 120", "PYTHONUNBUFFERED", "process_teacher_upload_request_fast.py", "upload_private_bank_package_fast.py"]:
    if marker not in workflow:
        errors.append(f"Workflow missing {marker}")

for path in ["tools/upload_private_bank_package_fast.py", "tools/process_teacher_upload_request_fast.py"]:
    result = subprocess.run([sys.executable, "-m", "py_compile", str(root / path)], capture_output=True, text=True)
    if result.returncode:
        errors.append(f"Syntax failure {path}: {result.stderr}")

print("ECHS private-bank import performance validation")
for error in errors:
    print("ERROR:", error)
if errors:
    raise SystemExit(1)
print("Status: PASS")
