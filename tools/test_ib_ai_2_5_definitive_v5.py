"""Release tests for IB Mathematics AI SL Lesson 2.5 v5.

These tests protect the stable assessment records while auditing the rebuilt Learn
route, exact SVG graphics, coordinate mathematics, domain restrictions and TI-84
workflows.
"""
from __future__ import annotations

import json
import math
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNIT = ROOT / "lessons" / "ib-math-ai" / "unit-2"
DATA = UNIT / "data"
CSS = UNIT / "assets" / "css"
HTML = UNIT / "lessons" / "IB_AI_SL_2.5_transformations_composition_inverses_ECHS.html"

BUILD_FILES = [
    DATA / "lesson-2.5-v5-build.js",
    DATA / "lesson-2.5-v5-content-a.js",
    DATA / "lesson-2.5-v5-content-b.js",
    DATA / "lesson-2.5-v5-content-c.js",
    DATA / "lesson-2.5-v5-finalize.js",
]
RUNTIME_FILES = [
    DATA / "lesson-2.5-v5-graphics.js",
    DATA / "lesson-2.5-v5-interactions.js",
    DATA / "lesson-2.5-v5-ti84.js",
]


def _run_node(source: str) -> str:
    completed = subprocess.run(
        ["node", "-e", source],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    return completed.stdout.strip()


def _build_snapshot() -> dict:
    files = [DATA / "lesson-2.5.js", *BUILD_FILES]
    node_files = json.dumps([str(path) for path in files])
    source = f"""
const fs=require('fs'),vm=require('vm');
const files={node_files};
const context={{window:{{}},console}};context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(files[0],'utf8'),context,{{filename:files[0]}});
const legacy={{
  practice:context.window.LESSON_DATA.practice.map(q=>q.id),
  quiz:context.window.LESSON_DATA.quiz.map(q=>q.id),
  exam:context.window.LESSON_DATA.exam.map(q=>q.id)
}};
for(const file of files.slice(1))vm.runInContext(fs.readFileSync(file,'utf8'),context,{{filename:file}});
const data=context.window.LESSON_DATA;
const visualIds=[...new Set(data.slides.flatMap(s=>[...s.html.matchAll(/data-tci5-visual=\"([^\"]+)\"/g)].map(m=>m[1])))];
console.log(JSON.stringify({{
  version:data.version,
  counts:data.counts,
  practiceIds:data.practice.map(q=>q.id),
  quizIds:data.quiz.map(q=>q.id),
  examIds:data.exam.map(q=>q.id),
  legacy,
  slides:data.slides.map(s=>({{section:s.section,title:s.title,kind:s.kind,html:s.html}})),
  visualIds,
  audit:data.audit,
  tiSlides:data.slides.filter(s=>s.html.includes('data-tci5-ti-workflow')).length
}}));
"""
    return json.loads(_run_node(source))


def test_release_files_exist() -> None:
    expected = [
        HTML,
        DATA / "lesson-2.5.js",
        *BUILD_FILES,
        *RUNTIME_FILES,
        CSS / "lesson-2.5-v5-core.css",
        CSS / "lesson-2.5-v5-responsive-ti84.css",
        ROOT / "lessons" / "ib-math-ai" / "unit-1" / "assets" / "css" / "unit-1-ti84-simulator-v7.css",
    ]
    missing = [str(path.relative_to(ROOT)) for path in expected if not path.is_file()]
    assert not missing, f"Missing Lesson 2.5 release files: {missing}"


def test_javascript_syntax() -> None:
    for path in [*BUILD_FILES, *RUNTIME_FILES]:
        subprocess.run(["node", "--check", str(path)], check=True, capture_output=True, text=True)


def test_html_load_order_and_platform_routes() -> None:
    html = HTML.read_text(encoding="utf-8")
    ordered = [
        "../data/lesson-2.5.js",
        "../data/lesson-2.5-v5-build.js",
        "../data/lesson-2.5-v5-content-a.js",
        "../data/lesson-2.5-v5-content-b.js",
        "../data/lesson-2.5-v5-content-c.js",
        "../data/lesson-2.5-v5-finalize.js",
        "../assets/js/katex-global.js",
        "../assets/js/engine.js",
        "../data/lesson-2.5-v5-graphics.js",
        "../data/lesson-2.5-v5-interactions.js",
        "../data/lesson-2.5-v5-ti84.js",
    ]
    positions = [html.index(item) for item in ordered]
    assert positions == sorted(positions), "The legacy assessment data must load before the v5 finalizer and engine."
    for route in ("learn", "practice", "exam", "quiz", "review"):
        assert f'data-route="{route}"' in html
    assert "lesson-2.5-v5-core.css" in html
    assert "lesson-2.5-v5-responsive-ti84.css" in html
    assert "unit-1-ti84-simulator-v7.css" in html
    assert '<html lang="en" class="unit2-lesson-2-5-v5' in html


def test_build_counts_schema_and_stable_ids() -> None:
    snapshot = _build_snapshot()
    assert snapshot["version"] == "5.0.0"
    assert snapshot["counts"] == {"slides": 88, "practice": 60, "quiz": 12, "exam": 5}
    assert len(snapshot["practiceIds"]) == len(set(snapshot["practiceIds"])) == 60
    assert len(snapshot["quizIds"]) == len(set(snapshot["quizIds"])) == 12
    assert len(snapshot["examIds"]) == len(set(snapshot["examIds"])) == 5
    assert snapshot["practiceIds"] == snapshot["legacy"]["practice"]
    assert snapshot["quizIds"] == snapshot["legacy"]["quiz"]
    assert snapshot["examIds"][:3] == snapshot["legacy"]["exam"]
    assert snapshot["examIds"][-2:] == ["U2-2.5-T4", "U2-2.5-T5"]
    assert snapshot["tiSlides"] == 3
    assert snapshot["audit"]["allVisualsPurposeBuilt"] is True
    assert snapshot["audit"]["legacyAssessmentIdsPreserved"] is True
    assert snapshot["audit"]["calculatorUseSelective"] is True
    assert all(slide["section"] and slide["title"] and slide["kind"] for slide in snapshot["slides"])


def test_every_learn_visual_has_a_purpose_built_factory() -> None:
    snapshot = _build_snapshot()
    source = (DATA / "lesson-2.5-v5-graphics.js").read_text(encoding="utf-8")
    factory_ids = set(re.findall(r"\n\s*'([^']+)'\s*:\s*(?:\(\)=>|\[)", source))
    factory_ids.update(re.findall(r"\n\s*([A-Za-z][\w-]*)\s*:\s*\(\)=>", source))
    missing = sorted(set(snapshot["visualIds"]) - factory_ids)
    assert not missing, f"Visuals would fall back to a generic diagram: {missing}"
    assert len(snapshot["visualIds"]) >= 60
    assert "inverse-table" in factory_ids
    assert "translated-rational" in factory_ids
    assert "rational-inverse-verify" in factory_ids
    assert "sensor-case" in factory_ids


def test_svg_renderer_has_discontinuity_and_marker_protection() -> None:
    source = (DATA / "lesson-2.5-v5-graphics.js").read_text(encoding="utf-8")
    assert "const markerId=`flow-arrow-${++uid}`" in source
    assert 'marker-end="url(#${markerId})"' in source
    assert "intervals:[[-7,0.98],[1.02,5]]" in source
    assert "intervals:[[-7,-2.02],[-1.98,5]]" in source
    assert "clipPath" in source and "pathFor" in source
    assert "<canvas" not in source
    assert "role=\"img\"" in source and "<desc>" in source


def test_coordinate_map_and_feature_examples_are_exact() -> None:
    # General coordinate map g(x)=a f(b(x-h))+k.
    def base(x: float) -> float:
        return 0.35 * x**3 - 1.2 * x + 2

    cases = [
        (6.0, -2.0, -3.0, 2.0, 4.0, 5.0),
        (-9.0, 4.0, 2.0, -3.0, -1.0, -7.0),
        (-8.0, 5.0, 0.5, -0.25, 0.0, 0.0),
    ]
    for u, v, a, b, h, k in cases:
        x = h + u / b
        y = k + a * v
        assert math.isclose(b * (x - h), u)
        # Build an auxiliary function whose known point is (u,v).
        shifted = lambda z, u=u, v=v: base(z) - base(u) + v
        transformed = a * shifted(b * (x - h)) + k
        assert math.isclose(transformed, y)

    # Published feature-map example: h=1,b=-2,a=3,k=4.
    assert math.isclose(1 + (-2) / -2, 2)
    assert math.isclose(4 + 3 * 5, 19)
    assert math.isclose(1 + 4 / -2, -1)
    assert math.isclose(4 + 3 * -1, 1)
    # Published asymptote example: b=1/2,h=-2,a=-2,k=5.
    assert math.isclose(-2 + 1 / 0.5, 0)
    assert math.isclose(5 - 2 * 2, 1)


def test_inverse_and_composition_examples() -> None:
    f = lambda x: (x - 1) / (x + 2)
    g = lambda x: (1 + 2 * x) / (1 - x)
    for value in (-5.0, -1.0, 0.0, 3.5):
        assert not math.isclose(value, -2)
        assert math.isclose(g(f(value)), value, rel_tol=1e-12, abs_tol=1e-12)
    for value in (-4.0, -0.5, 0.0, 2.5):
        assert not math.isclose(value, 1)
        assert math.isclose(f(g(value)), value, rel_tol=1e-12, abs_tol=1e-12)

    restricted = lambda x: 9 - (x - 4) ** 2
    restricted_inverse = lambda y: 4 + math.sqrt(9 - y)
    for x in (4.0, 5.0, 7.0, 11.0):
        assert math.isclose(restricted_inverse(restricted(x)), x)

    fahrenheit = lambda c: 1.8 * c + 32
    celsius = lambda f_value: (f_value - 32) / 1.8
    assert math.isclose(celsius(fahrenheit(30)), 30)
    assert math.isclose(fahrenheit(celsius(86)), 86)

    pipeline = lambda x: 1.03 * (x / 100) - 0.2
    pipeline_inverse = lambda y: (y + 0.2) / 0.0103
    assert math.isclose(pipeline(250), 2.375)
    assert math.isclose(pipeline_inverse(pipeline(250)), 250)


def test_finite_domain_sensor_sets_and_error_propagation() -> None:
    sensor = lambda temperature: 1.6 * temperature + 12
    inverse = lambda signal: (signal - 12) / 1.6
    assert sensor(-20) == -20
    assert sensor(80) == 140
    assert inverse(-20) == -20
    assert inverse(140) == 80
    assert inverse(100) == 55
    assert math.isclose(0.5 / 1.6, 0.3125)  # ±0.5 signal units -> ±0.3125 °C.


def test_ti84_workflows_are_manual_first_and_verifiable() -> None:
    source = (DATA / "lesson-2.5-v5-ti84.js").read_text(encoding="utf-8")
    for key in ("transform-overlay", "inverse-overlay", "composition-check"):
        assert f"'{key}'" in source
    for route in ("[Y=]", "[GRAPH]", "[2nd] [GRAPH]", "[VARS]", "Y₂(Y₁(30))"):
        assert route in source
    assert "Manual mathematics" in source
    assert "Independent verification" in source
    assert "IB communication" in source
    assert "manualFirst:true" in source
    assert "data-open-ti84" in (DATA / "lesson-2.5-v5-build.js").read_text(encoding="utf-8")


def test_responsive_and_accessibility_contract() -> None:
    core = (CSS / "lesson-2.5-v5-core.css").read_text(encoding="utf-8")
    responsive = (CSS / "lesson-2.5-v5-responsive-ti84.css").read_text(encoding="utf-8")
    assert ".tci5-transform-lab" in core
    assert ".tci5-ti-overlay" in core
    assert ".tci5-parameter-table>div" in core
    assert ".tci5-mark-audit>div" in core
    assert "@media (max-width:700px)" in responsive
    assert "@media (prefers-reduced-motion:reduce)" in responsive
    assert "@media print" in responsive
    assert "body.u1-ti84-sim-open" in responsive
    html = HTML.read_text(encoding="utf-8")
    assert 'aria-label="Lesson routes"' in html
    assert 'aria-pressed="false"' in html
    assert 'tabindex="-1"' in html
