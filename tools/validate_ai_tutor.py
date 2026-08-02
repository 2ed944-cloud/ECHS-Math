#!/usr/bin/env python3
"""Static validation for ECHS Math Tutor Pro v4."""

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

    require('const VERSION = "4.0.0"' in worker, "Worker version is not 4.0.0", errors)
    require("@cf/google/gemma-4-26b-a4b-it" in worker, "Vision-capable primary model is missing", errors)
    require("@cf/zai-org/glm-4.7-flash" in worker, "Text fallback/review model is missing", errors)
    require("@cf/meta/llama-4-scout-17b-16e-instruct" in worker, "Vision fallback model is missing", errors)
    require('new Set(["hint", "guide", "explain", "check", "alternative", "practice"])' in worker,
            "All six tutor modes are not declared", errors)
    require("NON-NEGOTIABLE MATHEMATICAL ACCURACY PROTOCOL" in worker,
            "Mathematical accuracy protocol is missing", errors)
    require("sanitizeImage" in worker and "image_url" in worker,
            "Multimodal image handling is missing", errors)
    require("looksIncomplete" in worker and "completeIfNeeded" in worker,
            "Automatic completion of truncated answers is missing", errors)
    require("reviewAnswer" in worker and "shouldReview" in worker,
            "Independent mathematical review layer is missing", errors)
    require("assessmentDetected" in worker, "Assessment integrity detection is missing", errors)
    require("RATE_LIMIT_PER_MINUTE" in worker and "enforceRateLimit" in worker,
            "Rate limiting is missing", errors)
    require('"https://2ed944-cloud.github.io"' in worker,
            "Production origin is missing", errors)
    require('endpoint: "/chat"' in worker, "Health response does not advertise /chat", errors)
    require("visionEnabled: true" in worker, "Health response does not advertise vision", errors)

    for mode in ("hint", "guide", "explain", "check", "alternative", "practice"):
        require(f'id: "{mode}"' in frontend, f"Frontend mode missing: {mode}", errors)

    require('new URL("chat"' in frontend, "Frontend does not call /chat", errors)
    require("safeMarkdown" in frontend and "escapeHTML" in frontend,
            "Safe rich-answer rendering is missing", errors)
    require("ensureKaTeX" in frontend and "auto-render.min.js" in frontend,
            "Automatic KaTeX loading is missing", errors)
    require("data-image-input" in frontend and "prepareImage" in frontend,
            "Image attachment UI is missing", errors)
    require("clipboardData" in frontend, "Clipboard image support is missing", errors)
    require("AbortController" in frontend, "Request timeout protection is missing", errors)
    require("grid-template-rows: auto auto minmax(0, 1fr) auto" in css,
            "Tutor panel does not reserve fixed composer space", errors)
    require(".echsAiTutor__imagePreview" in css and ".echsAiTutor__messageImage" in css,
            "Image UI styling is missing", errors)
    require(".echsAiTutor__mathSource" in css, "KaTeX source block styling is missing", errors)
    require('title: "ECHS Math Tutor Pro"' in config, "Professional tutor title is not enabled", errors)
    require("maxImageBytes" in config and "maxImageDimension" in config,
            "Frontend image limits are missing", errors)

    require('PRIMARY_MODEL = "@cf/google/gemma-4-26b-a4b-it"' in wrangler,
            "Wrangler primary model is incorrect", errors)
    require('FALLBACK_MODEL = "@cf/zai-org/glm-4.7-flash"' in wrangler,
            "Wrangler text fallback model is incorrect", errors)
    require('VISION_FALLBACK_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct"' in wrangler,
            "Wrangler vision fallback model is incorrect", errors)
    require('MAX_IMAGE_BYTES = "4000000"' in wrangler,
            "Wrangler image size limit is missing", errors)
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

    print("ECHS Math Tutor Pro v4 validation passed")
    print("Worker: text + vision, automatic completion, fallback + review")
    print("Frontend: six modes, automatic KaTeX, file/paste images, timeouts")
    print("Security: origin validation, size limits, rate limits, assessment safeguards")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
