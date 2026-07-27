#!/usr/bin/env python3
"""Build an account-free ECHS Mathematics website from the canonical repository.

The source repository remains the institutional platform. This exporter creates a
separate static site containing lessons, practice, review, tests and local-only
progress while excluding account, role, backend and administration surfaces.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

TOP_LEVEL_EXCLUDES = {
    ".git", ".github", ".echs-backups", "_pages", "_open", "node_modules",
    "supabase", "config", "templates", "tools", "variants", "platform",
}
ROOT_SECURE_FILES = {"login.html", "setup.html", "learning-library.html", "school-control-assets.json"}
QUESTION_BANK_SECURE_FILES = {"admin.html", "school-control.html", "student.html", "teacher.html", "parent.html"}

ACCOUNT_LINK_PATTERN = re.compile(
    r'<a\b[^>]*href=["\'][^"\']*(?:login|setup|student|teacher|parent|admin|school-control)\.html[^"\']*["\'][^>]*>.*?</a>',
    re.IGNORECASE | re.DOTALL,
)
SCRIPT_PATTERN = re.compile(
    r'<script\b[^>]*src=["\'][^"\']*(?:institution-[^"\']*|portal-access|lesson-access-guard|login\.js|role-entry)[^"\']*["\'][^>]*>\s*</script>',
    re.IGNORECASE | re.DOTALL,
)
LINK_PATTERN = re.compile(
    r'<link\b[^>]*href=["\'][^"\']*(?:institution[^"\']*\.css|learning-access\.css)[^"\']*["\'][^>]*>',
    re.IGNORECASE,
)
GATE_STYLE_PATTERN = re.compile(
    r'<style\b[^>]*id=["\']echsLessonGateStyle["\'][^>]*>.*?</style>',
    re.IGNORECASE | re.DOTALL,
)
ATTRIBUTE_PATTERNS = [
    re.compile(r'\sdata-require-account=["\'][^"\']*["\']', re.IGNORECASE),
    re.compile(r'\sdata-echs-learning-guard=["\'][^"\']*["\']', re.IGNORECASE),
    re.compile(r'\sdata-echs-lesson-guard=["\'][^"\']*["\']', re.IGNORECASE),
    re.compile(r'\sdata-role-home(?:=["\'][^"\']*["\'])?', re.IGNORECASE),
    re.compile(r'\sdata-auth-content(?:=["\'][^"\']*["\'])?', re.IGNORECASE),
    re.compile(r'\sdata-guest-content(?:=["\'][^"\']*["\'])?', re.IGNORECASE),
]
COPY_REPLACEMENTS = {
    "Assigned-course practice, lesson-unlocked skills, adaptive sequencing and mastery recovery.": "Open course practice, adaptive sequencing, review and local mastery progress.",
    "Students practise assigned courses and skills unlocked by completed lessons. Teachers and administrators retain full course access.": "Choose any course, unit or topic and practise freely. Progress is stored only on this device.",
    "Assigned-course access": "Open course access",
    "Your next mastery step starts here": "Your next practice session starts here",
    "Complete a lesson, open its practice and build evidence toward mastery.": "Choose any course or topic and build evidence toward mastery.",
    "Preparing your pathway…": "Preparing open practice…",
    "Questions are selected from your current learning pathway.": "Questions are selected from the course and topic filters you choose.",
    "ECHS Student Learning Dashboard": "ECHS Learning Progress Dashboard",
    "ECHS Student Dashboard": "ECHS Learning Progress",
    "Student progress is stored locally on this device until cloud synchronization is configured.": "Learning progress is stored locally on this device.",
    "Student progress": "Learning progress",
    "Student name": "Learner name",
    "Student profile": "Learner profile",
    "Reset student learning data": "Reset local learning data",
    "Teacher classes and assignments are preserved.": "Only local progress on this browser is affected.",
    "Learning evidence synchronises with the student mastery journey.": "Learning evidence is stored locally in this browser.",
}

SOURCE_ROOT = Path.cwd()


def ignore_copy(path: str, names: list[str]) -> set[str]:
    directory = Path(path)
    ignored: set[str] = set()
    if directory.name in {".git", "node_modules", "_pages", "_open"}:
        return set(names)
    if directory == SOURCE_ROOT:
        ignored.update(name for name in names if name in TOP_LEVEL_EXCLUDES)
    return ignored


def remove_path(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
    elif path.exists():
        path.unlink()


def remove_secure_surfaces(root: Path) -> None:
    for name in ROOT_SECURE_FILES:
        remove_path(root / name)
    for name in QUESTION_BANK_SECURE_FILES:
        remove_path(root / "question-bank" / name)
    for relative in ["question-bank/official/admin", "question-bank/teacher", "question-bank/parent", "question-bank/admin"]:
        remove_path(root / relative)
    for pattern in [
        "js/institution-*.js", "js/login.js", "js/portal-access.js", "js/lesson-access-guard.js",
        "css/institution*.css", "css/learning-access.css",
        "question-bank/js/admin-accounts.js", "question-bank/js/student-cloud.js",
        "question-bank/js/teacher-cloud.js", "question-bank/js/parent-cloud.js",
        "question-bank/js/role-entry.js", "question-bank/js/school-control*.js",
    ]:
        for path in root.glob(pattern):
            remove_path(path)


def clean_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    text = SCRIPT_PATTERN.sub("", text)
    text = LINK_PATTERN.sub("", text)
    text = GATE_STYLE_PATTERN.sub("", text)
    text = ACCOUNT_LINK_PATTERN.sub("", text)
    for pattern in ATTRIBUTE_PATTERNS:
        text = pattern.sub("", text)
    text = re.sub(r'\sdata-auth-state=["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    for old, new in COPY_REPLACEMENTS.items():
        text = text.replace(old, new)
    text = text.replace("Student Dashboard", "My Progress")
    text = text.replace("Teacher Dashboard", "")
    text = text.replace("Parent Report", "")
    text = re.sub(
        r'<a\b[^>]*href=["\'][^"\']*(?:teacher|parent|student|admin|school-control)\.html[^"\']*["\'][^>]*>.*?</a>',
        '', text, flags=re.IGNORECASE | re.DOTALL,
    )
    path.write_text(text, encoding="utf-8")


def write_manifest(root: Path) -> None:
    payload = {
        "id": "./", "name": "ECHS Mathematics Open", "short_name": "ECHS Math Open",
        "description": "Open mathematics lessons, practice, review, assessments and local mastery progress.",
        "start_url": "./", "scope": "./", "display": "standalone",
        "background_color": "#f7f4ee", "theme_color": "#78183f",
        "icons": [
            {"src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "shortcuts": [
            {"name": "Lessons", "url": "./#courses"},
            {"name": "Practice", "url": "./question-bank/practice.html"},
            {"name": "My Progress", "url": "./question-bank/dashboard.html"},
        ],
    }
    (root / "manifest.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_service_worker(root: Path) -> None:
    worker = '''/* ECHS Mathematics Open service worker — no account or private API caching */
const CACHE="echs-math-open-v1";
const CORE=["./","./index.html","./manifest.json","./css/portal.css","./css/platform-foundation.css","./css/open-platform.css","./js/portal-open.js","./data/courses.js"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==location.origin)return;event.respondWith(fetch(request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(hit=>hit||caches.match("./index.html"))))});
'''
    (root / "sw.js").write_text(worker, encoding="utf-8")


def write_metadata(root: Path) -> None:
    metadata = {
        "edition": "open", "accounts": False, "roles": False, "cloud_sync": False,
        "progress_storage": "browser-localStorage",
        "built_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    (root / "open-build.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    (root / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    (root / ".nojekyll").touch()


def install_open_files(source: Path, root: Path) -> None:
    shutil.copy2(source / "variants/open/index.html", root / "index.html")
    shutil.copy2(source / "variants/open/open-platform.css", root / "css/open-platform.css")
    (root / ".github/workflows").mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / "variants/open/deploy-pages.yml", root / ".github/workflows/deploy-pages.yml")
    shutil.copy2(source / "variants/open/README.md", root / "README.md")
    (root / "tools").mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / "tools/test_open_site_contract.py", root / "tools/validate_open_release.py")


def build(source: Path, output: Path) -> None:
    global SOURCE_ROOT
    SOURCE_ROOT = source.resolve()
    output = output.resolve()
    if output == SOURCE_ROOT or (SOURCE_ROOT in output.parents and output.name not in {"_open", "open-site"}):
        raise ValueError("Output must be a dedicated build directory")
    if output.exists():
        shutil.rmtree(output)
    shutil.copytree(SOURCE_ROOT, output, ignore=ignore_copy)
    install_open_files(SOURCE_ROOT, output)
    remove_secure_surfaces(output)
    for path in sorted(output.rglob("*.html")):
        clean_html(path)
    write_manifest(output)
    write_service_worker(output)
    write_metadata(output)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        build(args.source, args.output)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}")
        return 1
    lesson_count = len(list((args.output / "lessons").rglob("*.html"))) if (args.output / "lessons").is_dir() else 0
    print("ECHS Mathematics open-site export")
    print(f"Output: {args.output.resolve()}")
    print(f"Lesson pages: {lesson_count}")
    print("Accounts and institutional role pages: excluded")
    return 0


if __name__ == "__main__":
    sys.exit(main())
