#!/usr/bin/env python3
"""Static regression checks for KaTeX rendering in authenticated mapped practice."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "question-bank" / "js" / "practice-single-bank.js"
source = SCRIPT.read_text(encoding="utf-8")

required_fragments = {
    "KaTeX 0.16.27 runtime": 'const KATEX_VERSION="0.16.27"',
    "KaTeX stylesheet": "katex.min.css",
    "KaTeX browser runtime": "katex.min.js",
    "KaTeX auto-render runtime": "contrib/auto-render.min.js",
    "inline delimiters": '{left:"\\\\(",right:"\\\\)",display:false}',
    "display delimiters": '{left:"\\\\[",right:"\\\\]",display:true}',
    "safe trust policy": "trust:false",
    "non-fatal runtime rendering": "throwOnError:false",
    "dynamic question observer": "scheduleMath(shell)",
    "question and feedback shell": 'const shell=document.getElementById("shell")',
}

missing = [label for label, fragment in required_fragments.items() if fragment not in source]
if missing:
    raise SystemExit("Missing mapped-practice KaTeX safeguards: " + ", ".join(missing))

if source.count("scheduleMath(shell)") < 3:
    raise SystemExit(
        "KaTeX rendering is not scheduled for initial, dynamic, and private-bank updates"
    )

print("Private mapped-practice KaTeX runtime: PASS")
