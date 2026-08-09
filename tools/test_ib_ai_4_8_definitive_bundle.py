#!/usr/bin/env python3
"""Release audit for the GitHub Pages bundle of IB AI SL lesson 4.8."""
from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import json
import math
import re
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path
from typing import Any

LESSON = "IB_AI_SL_4.8_tree_diagrams_bayes_sequential_events_ECHS.html"
PREFIX = "window.ECHS_U48_DATA="


def close(actual: float, expected: float, tolerance: float = 1e-10) -> None:
    assert math.isclose(actual, expected, rel_tol=tolerance, abs_tol=tolerance), (actual, expected)


def load_bundle(unit: Path) -> tuple[dict[str, Any], dict[str, str]]:
    bundle_dir = unit / "data/lesson-4.8-definitive-bundle"
    manifest = json.loads((bundle_dir / "manifest.json").read_text(encoding="utf-8"))
    encoded = "".join((bundle_dir / name).read_text(encoding="ascii").strip() for name in manifest["parts"])
    compressed = base64.b64decode(encoded)
    assert len(compressed) == manifest["compressed_bytes"]
    assert hashlib.sha256(compressed).hexdigest() == manifest["sha256"]
    raw = gzip.decompress(compressed)
    assert len(raw) == manifest["uncompressed_bytes"]
    bundle = json.loads(raw.decode("utf-8"))
    assert set(bundle) == {"css", "data", "app", "ti"}
    source = bundle["data"].strip()
    assert source.startswith(PREFIX) and source.endswith(";")
    data = json.loads(source[len(PREFIX):-1])
    return data, bundle


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    unit = root / "lessons/ib-math-ai/unit-4"
    html_path = unit / "lessons" / LESSON
    loader_path = unit / "data/lesson-4.8-definitive-loader.js"
    catalog_path = root / "data/ib-math-ai-unit-4-delivery-catalog.json"
    for path in (html_path, loader_path, catalog_path):
        assert path.is_file(), f"Missing release file: {path}"

    html = html_path.read_text(encoding="utf-8")
    loader = loader_path.read_text(encoding="utf-8")
    assert "lesson-4.8-definitive-loader.js?v=2.0.0" in html
    assert "lesson-4.8-definitive-data.js" not in html
    assert "EXPECTED_SHA256" in loader and "DecompressionStream('gzip')" in loader
    assert "Promise.all(PARTS.map" in loader and "crypto.subtle.digest('SHA-256'" in loader

    data, bundle = load_bundle(unit)
    lesson = data["metadata"]["lesson"]
    assert lesson["number"] == "4.8" and lesson["lesson_key"] == "u4-probability-trees"
    assert lesson["slides"] == len(data["slides"]) == 96
    assert lesson["practiceQuestions"] == len(data["practice"]) == 80
    assert lesson["examTasks"] == len(data["examTasks"]) == 6
    assert lesson["quizQuestions"] == len(data["quiz"]) == 18
    assert lesson["interactiveLabs"] == 6
    assert lesson["ti84Workflows"] == len(data["ti84Workflows"]) == 5

    slide_ids = [slide["id"] for slide in data["slides"]]
    assert len(slide_ids) == len(set(slide_ids)) == 96
    assert slide_ids[0] == "launch-cover" and slide_ids[-1] == "consolidation-mastery"
    levels = Counter(question["level"] for question in data["practice"])
    assert levels == Counter({"Foundation": 20, "Application": 20, "Reasoning": 20, "Challenge": 20})
    prompts = [re.sub(r"\s+", " ", question["prompt"].strip().lower()) for question in data["practice"]]
    assert len(prompts) == len(set(prompts)) == 80
    assert sum(task["marks"] for task in data["examTasks"]) == 68
    assert all(sum(part["marks"] for part in task["parts"]) == task["marks"] for task in data["examTasks"])
    assert all(len(question["options"]) == 4 and 0 <= question["answer"] < 4 for question in data["quiz"])

    # Independent high-risk probability checks.
    close(0.4 * 0.7 + 0.6 * 0.2, 0.4)
    close((0.02 * 0.94) / (0.02 * 0.94 + 0.98 * 0.09), 0.17570093457943925)
    close((5 / 8) * (4 / 7), 5 / 14)
    close(3 * (0.6**2) * 0.4, 0.432)
    close(0.96 * 0.94, 0.9024)
    close(1 - (1 - 0.96) * (1 - 0.94), 0.9976)

    assert ".u48-three-tree" in bundle["css"] and "@media(max-width:760px)" in bundle["css"]
    assert "renderPractice" in bundle["app"] and "renderExam" in bundle["app"] and "renderMastery" in bundle["app"]
    assert "ti84calc.com/ti84calc" in bundle["ti"] and "lazyLoad: true" in bundle["ti"]

    with tempfile.TemporaryDirectory() as temp:
        temp_path = Path(temp)
        for name in ("data", "app", "ti"):
            path = temp_path / f"{name}.js"
            path.write_text(bundle[name], encoding="utf-8")
            result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
            assert result.returncode == 0, result.stderr
        result = subprocess.run(["node", "--check", str(loader_path)], capture_output=True, text=True)
        assert result.returncode == 0, result.stderr

    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    entry = next(item for item in catalog["lessons"] if item["number"] == "4.8")
    assert entry["lesson_key"] == "u4-probability-trees"
    assert (entry["slides"], entry["practice_questions"], entry["quiz_questions"], entry["exam_tasks"]) == (96, 80, 18, 6)

    print("IB_AI_SL_4.8_DEFINITIVE_BUNDLE_AUDIT_PASS")
    print(json.dumps({"slides": 96, "practice": dict(levels), "exam_tasks": 6, "exam_marks": 68, "quiz": 18, "labs": 6, "ti84_workflows": 5}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())