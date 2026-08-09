#!/usr/bin/env python3
"""Viewport and interaction QA for the definitive IB AI SL lesson 4.8."""
from __future__ import annotations

import argparse
import base64
import gzip
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright

LESSON = "IB_AI_SL_4.8_tree_diagrams_bayes_sequential_events_ECHS.html"


def prepare_shell(path: Path) -> str:
    html = path.read_text(encoding="utf-8")
    html = re.sub(r"<link[^>]+>", "", html)
    html = re.sub(r"<script[^>]+></script>", "", html)
    return html


def load_bundle(unit: Path) -> dict[str, str]:
    bundle_dir = unit / "data/lesson-4.8-definitive-bundle"
    manifest = json.loads((bundle_dir / "manifest.json").read_text(encoding="utf-8"))
    encoded = "".join((bundle_dir / name).read_text(encoding="ascii").strip() for name in manifest["parts"])
    return json.loads(gzip.decompress(base64.b64decode(encoded)).decode("utf-8"))


def boot(browser: Browser, unit: Path, viewport: dict[str, int]) -> tuple[Page, list[str]]:
    context = browser.new_context(viewport=viewport)
    page = context.new_page()
    errors: list[str] = []
    bundle = load_bundle(unit)
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))
    page.set_content(prepare_shell(unit / "lessons" / LESSON), wait_until="domcontentloaded")
    page.add_style_tag(content=bundle["css"])
    page.add_script_tag(content="window.renderMathInElement=function(){};")
    for script in (bundle["data"], bundle["app"], bundle["ti"]):
        page.add_script_tag(content=script)
    page.wait_for_timeout(100)
    return page, errors


def audit_viewport(page: Page, errors: list[str], name: str) -> dict[str, object]:
    assert page.locator("body").get_attribute("data-rendered") == "1"
    assert page.evaluate("window.ECHS_U48_APP.qa") == {
        "slides": 96, "practice": 80, "examTasks": 6, "quiz": 18, "labs": 6,
    }

    overflows: list[dict[str, object]] = []
    for index in range(96):
        page.evaluate("index=>window.ECHS_U48_APP.goSlide(index,{instant:true})", index)
        overflow = page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
        if overflow > 1:
            overflows.append({
                "screen": index + 1,
                "title": page.locator(".u48-slide-head h1").inner_text(),
                "overflow": overflow,
            })
        assert page.locator(".u48-stage").count() == 1
        assert page.locator(".u48-map-item").count() == 96

    page.evaluate("window.ECHS_U48_APP.goSlide(1,{instant:true})")
    page.locator('[data-note="inquiry"]').fill("Persistent Bayes note")
    page.evaluate("window.ECHS_U48_APP.goSlide(2,{instant:true})")
    page.evaluate("window.ECHS_U48_APP.goSlide(1,{instant:true})")
    assert page.locator('[data-note="inquiry"]').input_value() == "Persistent Bayes note"

    page.evaluate("window.ECHS_U48_APP.goSlide(15,{instant:true})")
    page.locator("[data-check]").fill("0.65*0.18")
    page.locator("[data-numeric-answer]").fill("0.117")
    page.locator("[data-check-numeric]").click()
    assert "Correct" in page.locator("#u48-toast").inner_text()

    labs = [
        (46, "[data-tree-output]"),
        (64, "[data-bayes-output]"),
        (35, "[data-three-tree]"),
        (39, "[data-stop-tree]"),
        (20, "[data-generated-urn-lab]"),
        (68, "[data-generated-reliability-lab]"),
    ]
    for index, selector in labs:
        page.evaluate("index=>window.ECHS_U48_APP.goSlide(index,{instant:true})", index)
        assert page.locator(selector).count() == 1, (index, selector)

    page.evaluate("window.ECHS_U48_APP.goSlide(81,{instant:true})")
    page.locator("[data-run-simulation]").click()
    assert "Simulation:" in page.locator("[data-sim-mini]").inner_text()

    page.locator('[data-route="practice"]').click()
    assert page.locator(".u48-practice-card").count() == 8
    first_practice = page.locator(".u48-practice-card").first
    first_practice.locator("[data-practice-reveal]").click()
    assert page.locator(".u48-practice-card").first.locator(".u48-answer-panel").count() == 1
    page.locator(".u48-practice-card").first.locator("[data-practice-master]").click()
    assert page.locator(".u48-practice-card.mastered").count() >= 1
    page.locator("[data-practice-level]").select_option(label="Challenge")
    assert page.locator(".u48-practice-card").count() == 8

    page.locator('[data-route="exam"]').click()
    assert page.locator(".u48-exam-task").count() == 6
    assert page.locator(".u48-exam-part").count() == 24
    page.locator("[data-exam-response]").first.fill("Student model response")
    page.locator("[data-toggle-scheme]").first.click()
    assert page.locator(".u48-exam-task").first.locator(".u48-scheme").count() == 4

    page.locator('[data-route="quiz"]').click()
    assert page.locator(".u48-quiz-card").count() == 18
    for card in page.locator(".u48-quiz-card").all():
        card.locator("input").first.check()
    page.locator("[data-quiz-submit]").click()
    assert page.locator(".u48-quiz-feedback").count() == 18

    page.locator('[data-route="mastery"]').click()
    assert page.locator(".u48-mastery-card").count() == 4

    page.locator("#u48-ti-classroom").click()
    assert page.locator("#u48-ti-overlay.open").count() == 1
    assert page.locator(".u48-ti-columns article").count() == 3
    page.locator("[data-ti-close]").click()
    page.wait_for_timeout(300)
    assert page.locator("#u48-ti-overlay.open").count() == 0

    page.locator("#u48-ti-simulator").click()
    assert page.locator("#u48-ti-dock.open").count() == 1
    assert not page.locator("[data-ti-frame]").get_attribute("src"), "Simulator must remain lazy-loaded."
    page.locator("[data-dock-close]").click()
    page.wait_for_timeout(300)
    assert page.locator("#u48-ti-dock.open").count() == 0

    final_overflow = page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
    assert not overflows, overflows
    assert final_overflow <= 1
    assert not errors, errors
    return {"viewport": name, "screens": 96, "overflows": 0, "console_or_page_errors": 0}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    parser.add_argument("--screenshots", type=Path)
    args = parser.parse_args()
    unit = args.root.resolve() / "lessons/ib-math-ai/unit-4"

    results: list[dict[str, object]] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=args.chromium, args=["--no-sandbox"])
        try:
            for name, viewport in (("desktop-1440x900", {"width": 1440, "height": 900}), ("mobile-390x844", {"width": 390, "height": 844})):
                page, errors = boot(browser, unit, viewport)
                results.append(audit_viewport(page, errors, name))
                if args.screenshots:
                    args.screenshots.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(args.screenshots / f"u48-{name}.png"))
                page.context.close()
        finally:
            browser.close()

    print("IB_AI_SL_4.8_BROWSER_QA_PASS")
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())