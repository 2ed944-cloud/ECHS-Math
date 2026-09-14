#!/usr/bin/env python3
"""Add four public, stateless teaching adapters to the guarded Pages artifact.

Canonical lesson files and their immutable import identities remain unchanged.
All source pins and all four staged inputs are checked before any stage write.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import unquote

HERE = Path(__file__).absolute().parent
MANIFEST = HERE / "lesson-investigations/source-preservation.json"
MAX_HTML_BYTES = 8 * 1024 * 1024
ROUTES = {
    "lessons/ap-precalculus/unit-1/AP_Precalculus_1.3_Rates_of_Change_in_Linear_and_Quadratic_Functions_ECHS_Refined.html": ("ap-rates", "ap-precalculus", "../../shared/investigations/host.mjs"),
    "lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html": ("arithmetic", "ib-math-ai", "../../../shared/investigations/host.mjs"),
    "lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html": ("geometric", "ib-math-ai", "../../../shared/investigations/host.mjs"),
    "lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html": ("finance", "ib-math-ai", "../../../shared/investigations/host.mjs"),
}
COMMENT = "<!-- Optional stateless teaching investigations; existing deck and practice remain canonical. -->"
GATE_STYLE = 'html:not([data-lesson-gate="allowed"]) body{visibility:hidden!important}'


def need(condition: bool, code: str) -> None:
    if not condition:
        raise ValueError(code)


def hook(relative_path: str) -> str:
    need(relative_path in ROUTES, "investigation-route")
    return f'\n{COMMENT}\n<script type="module" src="{ROUTES[relative_path][2]}"></script>\n'


class _Markers(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: list[tuple[str, list[tuple[str, str | None]]]] = []
        self.body_ends = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"meta", "script", "style"}:
            self.tags.append((tag, attrs))

    def handle_endtag(self, tag: str) -> None:
        if tag == "body":
            self.body_ends += 1


def inject_html(html_bytes: bytes, relative_path: str) -> bytes:
    """Pure allowlisted guarded-HTML transform, also used by native test staging."""
    need(type(relative_path) is str and relative_path in ROUTES, "investigation-route")
    need(type(html_bytes) is bytes and 0 < len(html_bytes) <= MAX_HTML_BYTES, "investigation-html-size")
    try:
        text = html_bytes.decode("utf-8")
    except UnicodeError as exc:
        raise ValueError("investigation-html-encoding") from exc
    need("\0" not in text, "investigation-html-encoding")
    parsed = _Markers()
    parsed.feed(text)
    parsed.close()
    need(parsed.body_ends == 1 and text.lower().rfind("</body>") >= 0, "investigation-body")
    course = ROUTES[relative_path][1]
    metas = [attrs for tag, attrs in parsed.tags if tag == "meta" and any(k == "data-echs-lesson-guard" for k, _ in attrs)]
    need(metas == [[("name", "echs-course"), ("content", course), ("data-echs-lesson-guard", "1")]], "investigation-guard-meta")
    styles = [attrs for tag, attrs in parsed.tags if tag == "style" and ("id", "echsLessonGateStyle") in attrs]
    need(styles == [[("id", "echsLessonGateStyle")]] and f'<style id="echsLessonGateStyle">{GATE_STYLE}</style>' in text, "investigation-guard-style")
    prefix = "../" * len(PurePosixPath(relative_path).parent.parts)
    for name in ["institution-client.js", "portal-access.js", "lesson-access-guard.js"]:
        src = prefix + "js/" + name + "?v=20260830-lesson-visibility1"
        matches = [attrs for tag, attrs in parsed.tags if tag == "script" and any(k == "src" and v and name in v for k, v in attrs)]
        need(matches == [[("src", src)]], "investigation-guard-script")
    candidates = [attrs for tag, attrs in parsed.tags if tag == "script" and any(k == "src" and v and ("investigations" in unquote(v).lower() or "host.mjs" in unquote(v).lower()) for k, v in attrs)]
    addition = hook(relative_path)
    if candidates:
        need(candidates == [[("type", "module"), ("src", ROUTES[relative_path][2])]], "investigation-hook-script")
        need(text.count(addition) == 1 and text.count(COMMENT) == 1, "investigation-hook-shape")
        return html_bytes
    need(COMMENT not in text, "investigation-orphan-hook")
    position = text.lower().rfind("</body>")
    return (text[:position] + addition + text[position:]).encode("utf-8")


def _safe_file(root: Path, relative_path: str) -> Path:
    need(type(relative_path) is str and relative_path and "\\" not in relative_path and ":" not in relative_path, "investigation-file-path")
    parts = relative_path.split("/")
    need(all(part not in {"", ".", ".."} for part in parts), "investigation-file-path")
    current = root.absolute()
    for ancestor in [*reversed(current.parents), current]:
        need(not ancestor.is_symlink() and not getattr(ancestor, "is_junction", lambda: False)(), "investigation-linked-path")
    need(current.is_dir(), "investigation-root")
    for part in parts:
        current /= part
        need(not current.is_symlink() and not getattr(current, "is_junction", lambda: False)(), "investigation-linked-path")
    need(current.is_file() and current.resolve().is_relative_to(root.resolve()), "investigation-file")
    return current


def load_preservation() -> dict:
    need(MANIFEST.stat().st_size <= 100000, "investigation-manifest-size")
    def unique_object(pairs):
        need(len(pairs) == len({key for key, _ in pairs}), "investigation-manifest-duplicates")
        return dict(pairs)
    value = json.loads(MANIFEST.read_text(encoding="utf-8"), object_pairs_hook=unique_object)
    need(type(value) is dict and set(value) == {"version", "baseline_commit", "protected_roster_source", "lesson_sources", "protected_calculus_sources"}, "investigation-manifest-shape")
    need(value["version"] == "echs.lesson-investigations.source-preservation.v1" and re.fullmatch(r"[0-9a-f]{40}", value["baseline_commit"] or ""), "investigation-manifest-version")
    need(value["protected_roster_source"] == "docs/codex/AP_CALCULUS_U2_U5_SOURCE_BASELINE.json", "investigation-protected-roster")
    need(type(value["lesson_sources"]) is list and all(type(row) is dict for row in value["lesson_sources"]) and [row.get("path") for row in value["lesson_sources"]] == list(ROUTES), "investigation-lesson-roster")
    need(type(value["protected_calculus_sources"]) is list and len(value["protected_calculus_sources"]) == 69, "investigation-protected-count")
    paths = []
    for row in value["lesson_sources"] + value["protected_calculus_sources"]:
        need(type(row) is dict and set(row) == {"path", "bytes", "sha256"}, "investigation-pin-shape")
        need(type(row["path"]) is str and type(row["bytes"]) is int and 0 < row["bytes"] <= MAX_HTML_BYTES and type(row["sha256"]) is str and re.fullmatch(r"[0-9a-f]{64}", row["sha256"]), "investigation-pin")
        paths.append(row["path"])
    need(len(set(paths)) == 73, "investigation-pin-duplicates")
    roster = json.loads(_safe_file(HERE.parent, value["protected_roster_source"]).read_text(encoding="utf-8"))
    need([row["path"] for row in value["protected_calculus_sources"]] == [row["path"] for row in roster["files"]], "investigation-protected-roster")
    return value


def verify_sources(source_root: Path, metadata: dict) -> dict[str, bytes]:
    source = {}
    for row in metadata["lesson_sources"] + metadata["protected_calculus_sources"]:
        path = _safe_file(source_root, row["path"])
        need(path.stat().st_size == row["bytes"], "investigation-source-size")
        raw = path.read_bytes()
        need(len(raw) == row["bytes"] and hashlib.sha256(raw).hexdigest() == row["sha256"], "investigation-source-hash")
        if row["path"] in ROUTES:
            source[row["path"]] = raw
    return source


def guarded_projection(source_root: Path, relative_path: str, raw: bytes) -> bytes:
    # Invoke the unchanged canonical injector against an in-memory path adapter.
    # It computes its own exact guard markup; no canonical source write occurs.
    spec = importlib.util.spec_from_file_location("_investigation_access_guard", HERE / "inject_learning_access_guard.py")
    need(spec is not None and spec.loader is not None, "investigation-guard-module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    class MemoryLesson:
        parent = (source_root / relative_path).parent
        value = raw

        def as_posix(self):
            return (source_root / relative_path).as_posix()

        def read_text(self, encoding):
            return self.value.decode(encoding).replace("\r\n", "\n").replace("\r", "\n")

        def write_text(self, text, encoding):
            self.value = text.replace("\n", os.linesep).encode(encoding)

    memory = MemoryLesson()
    need(module.inject_lesson(source_root, memory) is True, "investigation-source-already-guarded")
    return memory.value


def run(stage_root: Path, source_root: Path) -> dict:
    need(stage_root.resolve() != source_root.resolve(), "investigation-separate-stage")
    metadata = load_preservation()
    originals = verify_sources(source_root, metadata)
    planned = []
    for relative_path in ROUTES:
        target = _safe_file(stage_root, relative_path)
        need(target.stat().st_size <= MAX_HTML_BYTES, "investigation-html-size")
        before = target.read_bytes()
        guarded = guarded_projection(source_root, relative_path, originals[relative_path])
        after = inject_html(guarded, relative_path)
        need(before in {guarded, after}, "investigation-stage-source-mismatch")
        need(inject_html(before, relative_path) == after, "investigation-stage-hook")
        planned.append((relative_path, target, before, after))
    # Source and stage sweeps finish before the first mutation. A failed stage
    # build is never uploaded by the Pages job; only these four files can change.
    verify_sources(source_root, metadata)
    for relative_path, target, before, _ in planned:
        need(_safe_file(stage_root, relative_path) == target and target.read_bytes() == before, "investigation-stage-drift")
    changed = 0
    for _, target, before, after in planned:
        if before != after:
            target.write_bytes(after)
            changed += 1
    return {"status": "PASS", "routes": 4, "source_pins": 73, "changed": changed, "already_present": 4 - changed}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("--source-root", type=Path, required=True)
    args = parser.parse_args()
    try:
        result = run(args.root, args.source_root)
    except (ValueError, OSError, UnicodeError, TypeError, KeyError) as error:
        code = str(error) if type(error) is ValueError and re.fullmatch(r"investigation-[a-z-]+", str(error)) else "investigation-build-failed"
        print(json.dumps({"status": "FAIL", "code": code}))
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
