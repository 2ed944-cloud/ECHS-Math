#!/usr/bin/env python3
"""Static validation for ECHS Math Tutor Pro v3."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    files = {
        "worker": root / "cloudflare-ai-worker" / "src" / "index.js",
        "wrangler": root / "cloudflare-ai-worker" / "wrangler.toml",
        "frontend": root / "js" / "echs-ai-tutor.js",
        "config": root / "js" / "echs-ai-tutor-config.js",
        "css": root / "css" / "echs-ai-tutor.css",
    }
    errors: list[str] = []

    for name, path in files.items():
        require(path.is_file(), f"Missing {name}: {path.relative_to(root)}", errors)

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    text = {name: path.read_text(encoding="utf-8") for name, path in files.items()}
    worker = text["worker"]
    frontend = text["frontend"]
    css = text["css"]
    wrangler = text["wrangler"]
    config = text["config"]

    require('const VERSION = "3.0.0"' in worker, "Worker version is not 3.0.0", errors)
    require("@cf/google/gemma-4-26b-a4b-it" in worker, "Professional primary model is missing", errors)
    require("@cf/zai-org/glm-4.7-flash" in worker, "Fallback/review model is missing", errors)
    require("@cf/meta/llama-3.1-8b-instruct\"" not in worker, "Deprecated Llama model remains in worker", errors)
    require('new Set(["hint", "guide", "explain", "check", "alternative", "practice"])' in worker,
            "All six tutor modes are not declared", errors)
    require("NON-NEGOTIABLE MATHEMATICAL ACCURACY PROTOCOL" in worker,
            "Mathematical accuracy protocol is missing", errors)
    require("reviewAnswer" in worker and "shouldReview" in worker,
            "Independent mathematical review layer is missing", errors)
    require("assessmentDetected" in worker, "Assessment integrity detection is missing", errors)
    require("RATE_LIMIT_PER_MINUTE" in worker and "enforceRateLimit" in worker,
            "Rate limiting is missing", errors)
    require('"https://2ed944-cloud.github.io"' in worker,
            "Production origin is missing", errors)
    require('endpoint: "/chat"' in worker, "Health response does not advertise /chat", errors)

    for mode in ("hint", "guide", "explain", "check", "alternative", "practice"):
        require(f'id: "{mode}"' in frontend, f"Frontend mode missing: {mode}", errors)

    require('new URL("chat"' in frontend, "Frontend does not call /chat", errors)
    require("safeMarkdown" in frontend and "escapeHTML" in frontend,
            "Safe rich-answer rendering is missing", errors)
    require("renderMathInElement" in frontend, "KaTeX rendering hook is missing", errors)
    require("AbortController" in frontend, "Request timeout protection is missing", errors)
    require("grid-template-rows: auto auto minmax(0, 1fr) auto" in css,
            "Tutor panel does not reserve fixed composer space", errors)
    require(".echsAiTutor__modes" in css, "Mode toolbar styling is missing", errors)
    require('title: "ECHS Math Tutor Pro"' in config, "Professional tutor title is not enabled", errors)

    require('PRIMARY_MODEL = "@cf/google/gemma-4-26b-a4b-it"' in wrangler,
            "Wrangler primary model is incorrect", errors)
    require('FALLBACK_MODEL = "@cf/zai-org/glm-4.7-flash"' in wrangler,
            "Wrangler fallback model is incorrect", errors)
    require('ENABLE_REVIEW = "true"' in wrangler, "Review layer is not enabled", errors)

    node = shutil.which("node")
    if node:
        for name in ("worker", "frontend"):
            result = subprocess.run(
                [node, "--check", str(files[name])],
                capture_output=True,
                text=True,
                check=False,
            )
            require(result.returncode == 0, f"JavaScript syntax failed for {name}: {result.stderr.strip()}", errors)

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("ECHS Math Tutor Pro validation passed")
    print("Worker: professional primary + fallback + review models")
    print("Frontend: six modes, safe formatting, KaTeX, timeouts")
    print("Security: origin validation, limits, assessment safeguards")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
