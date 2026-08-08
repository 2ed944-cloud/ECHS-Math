#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import math
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
U4 = Path('lessons/ib-math-ai/unit-4')
DATA = [
    U4 / 'data/lesson-4.15-v2-core.js',
    U4 / 'data/lesson-4.15-v2-practice.js',
    U4 / 'data/lesson-4.15-v2-assessment.js',
]
INTERACTIONS = U4 / 'data/lesson-4.15-v2-interactions.js'
TI84 = U4 / 'data/lesson-4.15-v2-ti84.js'
HTML = U4 / 'lessons/IB_AI_SL_4.15_chi_square_goodness_of_fit_ECHS.html'
CSS = [
    U4 / 'assets/css/lesson-4.15-v2-core.css',
    U4 / 'assets/css/lesson-4.15-v2-responsive-ti84.css',
]
errors: list[str] = []


def read(path: Path) -> str:
    full = ROOT / path
    if not full.is_file():
        errors.append(f'Missing file: {path}')
        return ''
    return full.read_text(encoding='utf-8', errors='replace')


def norm_text(value: object) -> str:
    text = html.unescape(re.sub(r'<[^>]+>', ' ', str(value or '')))
    return re.sub(r'\s+', ' ', text).strip().lower()


def close(actual: float, expected: float, tolerance: float, label: str) -> None:
    if not math.isfinite(actual) or abs(actual - expected) > tolerance:
        errors.append(f'{label}: got {actual!r}, expected {expected!r} ± {tolerance}')


def chi_square_stat(observed: list[float], expected: list[float]) -> float:
    if len(observed) != len(expected) or any(value <= 0 for value in expected):
        raise ValueError('Invalid chi-square vectors')
    return sum((o - e) ** 2 / e for o, e in zip(observed, expected))


def gamma_q(a: float, x: float) -> float:
    """Regularized upper incomplete gamma Q(a,x), standard-library QA oracle."""
    if not (a > 0 and x >= 0):
        return math.nan
    if x == 0:
        return 1.0
    if x < a + 1:
        ap = a
        term = 1.0 / a
        total = term
        for _ in range(1, 300):
            ap += 1
            term *= x / ap
            total += term
            if abs(term) < abs(total) * 1e-15:
                break
        p = total * math.exp(-x + a * math.log(x) - math.lgamma(a))
        return max(0.0, min(1.0, 1.0 - p))
    tiny = 1e-300
    b = x + 1 - a
    c = 1 / tiny
    d = 1 / b if abs(b) > tiny else 1 / tiny
    h = d
    for i in range(1, 300):
        an = -i * (i - a)
        b += 2
        d = an * d + b
        if abs(d) < tiny:
            d = tiny
        c = b + an / c
        if abs(c) < tiny:
            c = tiny
        d = 1 / d
        delta = d * c
        h *= delta
        if abs(delta - 1) < 1e-14:
            break
    return max(0.0, min(1.0, math.exp(-x + a * math.log(x) - math.lgamma(a)) * h))


def chi_square_sf(statistic: float, df: int) -> float:
    return gamma_q(df / 2, statistic / 2)


# Syntax checks first.
for path in [*DATA, INTERACTIONS, TI84]:
    if not (ROOT / path).is_file():
        errors.append(f'Missing JavaScript: {path}')
        continue
    result = subprocess.run(
        ['node', '--check', str(ROOT / path)], capture_output=True, text=True
    )
    if result.returncode:
        errors.append(f'JavaScript syntax failure {path}: {result.stderr.strip()}')

# Assemble the lesson exactly as the browser does.
program = f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in DATA])};
const sandbox={{window:{{}},console}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
process.stdout.write(JSON.stringify(sandbox.window.LESSON_DATA));
"""
assembled = subprocess.run(
    ['node', '-e', program], cwd=ROOT, capture_output=True, text=True
)
if assembled.returncode:
    errors.append(f'Data assembly failed: {assembled.stderr.strip()}')
    lesson: dict = {}
else:
    try:
        lesson = json.loads(assembled.stdout)
    except Exception as exc:  # pragma: no cover - diagnostic path
        errors.append(f'Assembled lesson is not valid JSON: {exc}')
        lesson = {}

if lesson:
    if lesson.get('schemaVersion') != '5.0.0':
        errors.append(f"Unexpected schemaVersion: {lesson.get('schemaVersion')}")
    if lesson.get('version') != '2.0.0':
        errors.append(f"Unexpected lesson version: {lesson.get('version')}")
    if str(lesson.get('lesson', {}).get('number')) != '4.15':
        errors.append('Lesson number is not 4.15')

    slides = lesson.get('slides', [])
    practice = lesson.get('practice', [])
    exam = lesson.get('exam', [])
    quiz = lesson.get('quiz', [])
    if (len(slides), len(practice), len(exam), len(quiz)) != (61, 52, 3, 14):
        errors.append(
            f'Count mismatch: slides={len(slides)}, practice={len(practice)}, '
            f'exam={len(exam)}, quiz={len(quiz)}'
        )

    expected_levels = Counter(
        {'Foundation': 13, 'Application': 13, 'Reasoning': 13, 'Challenge': 13}
    )
    actual_levels = Counter(item.get('level') for item in practice)
    if actual_levels != expected_levels:
        errors.append(f'Practice-level balance is {dict(actual_levels)}')

    slide_ids = [item.get('id') for item in slides]
    slide_titles = [norm_text(item.get('title')) for item in slides]
    if any(not item for item in slide_ids) or len(slide_ids) != len(set(slide_ids)):
        errors.append('Slide IDs are missing or duplicated')
    if len(slide_titles) != len(set(slide_titles)):
        errors.append('Slide titles are duplicated')

    assessment_items = [*practice, *quiz]
    assessment_ids = [item.get('id') for item in assessment_items]
    assessment_ids.extend(task.get('id') for task in exam)
    if any(not item for item in assessment_ids) or len(assessment_ids) != len(set(assessment_ids)):
        errors.append('Assessment IDs are missing or duplicated')

    practice_prompts = {norm_text(item.get('prompt')) for item in practice}
    quiz_prompts = {norm_text(item.get('prompt')) for item in quiz}
    if len(practice_prompts) != len(practice):
        errors.append('Duplicate Practice Studio prompts')
    if len(quiz_prompts) != len(quiz):
        errors.append('Duplicate timed-quiz prompts')
    if practice_prompts & quiz_prompts:
        errors.append('Timed quiz repeats a Practice Studio prompt')

    for item in assessment_items:
        qid = item.get('id', '?')
        for required in ('prompt', 'solution', 'answer'):
            if not str(item.get(required, '')).strip():
                errors.append(f'{qid} missing {required}')
        if not isinstance(item.get('marks'), int) or item['marks'] <= 0:
            errors.append(f'{qid} has invalid marks')
        qtype = item.get('type')
        if qtype == 'mcq':
            choices = item.get('choices')
            correct = item.get('correct_index')
            if not isinstance(choices, list) or len(choices) < 3:
                errors.append(f'{qid} has invalid choices')
            elif not isinstance(correct, int) or not 0 <= correct < len(choices):
                errors.append(f'{qid} has invalid correct_index')
        elif qtype == 'numeric':
            value = item.get('numeric_answer')
            tolerance = item.get('tolerance')
            if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
                errors.append(f'{qid} has invalid numeric_answer')
            if not isinstance(tolerance, (int, float)) or tolerance < 0:
                errors.append(f'{qid} has invalid tolerance')
        elif qtype == 'short':
            if item.get('manual_check') is not True:
                errors.append(f'{qid} short response is not marked manual_check')
        else:
            errors.append(f'{qid} has unsupported type {qtype!r}')

    for task in exam:
        task_id = task.get('id', '?')
        parts = task.get('parts', [])
        if sum(part.get('marks', 0) for part in parts) != task.get('total_marks'):
            errors.append(f'{task_id} part marks do not total {task.get("total_marks")}')
        if len(parts) < 4:
            errors.append(f'{task_id} is not a multi-part IB task')
        for part in parts:
            for required in ('label', 'prompt', 'solution', 'answer'):
                if not str(part.get(required, '')).strip():
                    errors.append(f'{task_id} part {part.get("label")} missing {required}')

    def audit_math_string(value: object, label: str) -> None:
        text = str(value or '')
        controls = [ord(char) for char in text if ord(char) < 32 and char not in '\n\r\t']
        if controls:
            errors.append(f'Control character in {label}: {controls[:4]}')
        for left, right in ((r'\(', r'\)'), (r'\[', r'\]')):
            if text.count(left) != text.count(right):
                errors.append(f'Unbalanced math delimiters in {label}: {left}/{right}')
        for segment in re.findall(r'\\\((?:.|\n)*?\\\)|\\\[(?:.|\n)*?\\\]', text):
            if '<' in segment or '>' in segment:
                errors.append(f'Raw HTML inequality inside math in {label}: {segment[:90]}')
        visible = re.sub(r'\\\((?:.|\n)*?\\\)|\\\[(?:.|\n)*?\\\]', '', text)
        visible = re.sub(r'</?[A-Za-z][^>]*>', '', visible)
        if '<' in visible or '>' in visible:
            errors.append(f'Raw inequality or malformed tag in {label}: {visible[:100]!r}')

    for index, slide in enumerate(slides, 1):
        audit_math_string(slide.get('html'), f'slide {index} {slide.get("id")}')
    for item in assessment_items:
        for key in ('prompt', 'solution', 'answer'):
            audit_math_string(item.get(key), f'{item.get("id")} {key}')
    for task in exam:
        for part in task.get('parts', []):
            for key in ('prompt', 'solution', 'answer'):
                audit_math_string(part.get(key), f'{task.get("id")}{part.get("label")} {key}')

    visible_lesson = '\n'.join(str(slide.get('html', '')) for slide in slides)
    solutions = '\n'.join(str(item.get('solution', '')) for item in assessment_items)
    required_precision = [
        r'E_i\ge5',
        'An expected frequency equal to 5 satisfies the rule',
        r'df=k-1',
        r'df=k-1-m',
        'right-tail',
        'fail to reject',
        'fully specified model',
        'combine meaningful categories',
    ]
    for marker in required_precision:
        if marker not in visible_lesson:
            errors.append(f'Precision marker missing from learning sequence: {marker}')
    banned = [
        'expected frequency is at most 5',
        'expected frequencies are at most 5',
        'below or equal to 5',
    ]
    for phrase in banned:
        if phrase.lower() in visible_lesson.lower() or phrase.lower() in solutions.lower():
            errors.append(f'Incorrect expected-frequency condition present: {phrase}')
    if re.search(r'\baccept\s+H(?:_?0|₀)\b', visible_lesson + '\n' + solutions, re.I):
        errors.append('A learning explanation accepts the null hypothesis')

    lab_types = re.findall(r'data-gof-lab="([^"]+)"', visible_lesson)
    if Counter(lab_types) != Counter({'classifier': 1, 'builder': 1, 'contributions': 1, 'tail': 1}):
        errors.append(f'Interactive lab inventory is {lab_types}')
    if visible_lesson.count('<svg') < 8:
        errors.append('Fewer than eight original SVG/statistical visualizations')
    if visible_lesson.count('role="img"') < 8:
        errors.append('SVG visualizations lack sufficient accessible roles')

    # Independent mathematical recomputation of every anchor example and IB task.
    fair_stat = chi_square_stat([10, 8, 11, 10, 8, 13], [10] * 6)
    close(fair_stat, 1.8, 1e-12, 'fair-die chi-square')
    close(chi_square_sf(fair_stat, 5), 0.87606840032466, 2e-13, 'fair-die p-value')

    specified_stat = chi_square_stat([26, 18, 30, 16, 10], [25, 20, 30, 15, 10])
    close(specified_stat, 0.30666666666666664, 1e-12, 'specified-vector chi-square')
    close(chi_square_sf(specified_stat, 4), 0.9893797642627363, 2e-12, 'specified-vector p-value')

    coin_stat = chi_square_stat([2, 11, 36, 24, 7], [5, 20, 30, 20, 5])
    close(coin_stat, 8.65, 1e-12, 'binomial example chi-square')
    close(chi_square_sf(coin_stat, 4), 0.07046865426408042, 2e-13, 'binomial example p-value')

    normal_expected = [
        17.627284243982114,
        38.97225798549432,
        36.80091554104712,
        38.972257985494316,
        17.62728424398212,
    ]
    normal_stat = chi_square_stat([15, 43, 37, 34, 21], normal_expected)
    close(normal_stat, 2.0886290578781335, 2e-12, 'normal example chi-square')
    close(chi_square_sf(normal_stat, 4), 0.7194616972481833, 2e-12, 'normal example p-value')

    task1_stat = chi_square_stat([27, 18, 25, 21, 23, 30], [24] * 6)
    close(task1_stat, 3.8333333333333335, 2e-12, 'task 1 chi-square')
    close(chi_square_sf(task1_stat, 5), 0.5736528385606281, 2e-12, 'task 1 p-value')

    task2_expected = [12.4416, 41.472, 55.296, 36.864, 12.288 + 1.6384]
    task2_stat = chi_square_stat([10, 36, 55, 42, 17], task2_expected)
    close(task2_stat, 2.5966515560699612, 2e-12, 'task 2 merged chi-square')
    close(chi_square_sf(task2_stat, 4), 0.6274164007439251, 2e-12, 'task 2 p-value')
    task2_contrib = [(o - e) ** 2 / e for o, e in zip([10, 36, 55, 42, 17], task2_expected)]
    if task2_contrib.index(max(task2_contrib)) != 1:
        errors.append('Task 2 largest contribution is not x=1')

    task3_expected = [
        18.242243945173577,
        47.42988471120347,
        68.65574268724589,
        47.429884711203485,
        18.242243945173577,
    ]
    task3_stat = chi_square_stat([19, 42, 68, 49, 22], task3_expected)
    close(task3_stat, 1.4854097612173214, 2e-12, 'task 3 chi-square')
    close(chi_square_sf(task3_stat, 4), 0.8292227644181317, 2e-12, 'task 3 p-value')

    rendered = json.dumps(lesson, ensure_ascii=False)
    for marker in (
        'χ²=1.8', 'p=.8760684', '\\chi^2=8.650', '0.0705',
        '2.0886', '0.7195', '2.596652', '0.627416', '1.485410', '0.829223',
    ):
        if marker not in rendered:
            errors.append(f'Computed result not represented in lesson: {marker}')

# Validate actual runtime p-value implementation against independent oracle.
interaction_program = f"""
const fs=require('fs'),vm=require('vm');
const document={{readyState:'loading',addEventListener(){{}},querySelector(){{return null}},querySelectorAll(){{return []}}}};
const localStorage={{getItem(){{return null}},setItem(){{}}}};
const sandbox={{window:{{LESSON_DATA:{{lesson:{{number:'4.15'}}}}}},document,localStorage,console,Math,Number,Object,Array,String,Map,JSON,Promise,MutationObserver:function(){{}},CSS:{{escape:x=>x}}}};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync({json.dumps(str(INTERACTIONS))},'utf8'),sandbox);
const f=sandbox.window.GOF415Math.chiSquareSF;
process.stdout.write(JSON.stringify([[1.8,5],[8.65,4],[2.0886290578781335,4],[14.2306173,6],[50,10]].map(([x,df])=>f(x,df))));
"""
runtime = subprocess.run(['node', '-e', interaction_program], cwd=ROOT, capture_output=True, text=True)
if runtime.returncode:
    errors.append(f'Interaction math runtime failed: {runtime.stderr.strip()}')
else:
    try:
        values = json.loads(runtime.stdout)
        expected_values = [
            0.87606840032466,
            0.07046865426408042,
            0.7194616972481833,
            0.02716349354995801,
            2.669083424904495e-7,
        ]
        for index, (actual, expected) in enumerate(zip(values, expected_values), 1):
            close(float(actual), expected, 2e-12, f'JS chi-square SF check {index}')
    except Exception as exc:
        errors.append(f'Interaction p-value output invalid: {exc}')

html_wrapper = read(HTML)
for marker in (
    'unit4-lesson-4-15-v2',
    'lesson-4.15-v2-core.css?v=2.0.0',
    'lesson-4.15-v2-responsive-ti84.css?v=2.0.0',
    'lesson-4.15-v2-core.js?v=2.0.0',
    'lesson-4.15-v2-practice.js?v=2.0.0',
    'lesson-4.15-v2-assessment.js?v=2.0.0',
    'lesson-4.15-v2-interactions.js?v=2.0.0',
    'lesson-4.15-v2-ti84.js?v=2.0.0',
    'data-route="learn"', 'data-route="practice"', 'data-route="exam"',
    'data-route="quiz"', 'data-route="mastery"',
):
    if marker not in html_wrapper:
        errors.append(f'HTML wrapper missing {marker}')
if 'lesson-4.15.js' in html_wrapper:
    errors.append('HTML wrapper still loads the retired monolithic lesson-4.15.js')

css = '\n'.join(read(path) for path in CSS)
for marker in (
    '.gof-custom-lab', '.gof-tail-svg', '.gof-method-buttons', '.gof-mini-bars',
    '.ti84-gof-dock', '.ti84-gof-modal', '@media (max-width:760px)',
    '@media (prefers-reduced-motion:no-preference)',
):
    if marker not in css:
        errors.append(f'CSS missing {marker}')

ti84 = read(TI84)
for marker in (
    'STAT', '1:Edit', 'TESTS', 'D:χ²GOF-Test', 'Observed:L1', 'Expected:L2',
    'CNTRB', 'binompdf(4,0.5)', 'normalcdf(lower,upper,70,8)',
    'loading="lazy"', 'sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads"',
    'https://ti84calc.com/ti84calc', 'manualFirst:true',
    "fair:{", "specified:{", "binomial:{", "normal:{",
):
    if marker not in ti84:
        errors.append(f'TI-84 implementation missing {marker}')
if 'frame.src=' not in ti84 or "if(!frame.getAttribute('src'))" not in ti84:
    errors.append('TI-84 simulator is not guarded by lazy, user-initiated loading')

interactions = read(INTERACTIONS)
for marker in (
    'regularizedGammaQ', 'chiSquareSF', 'MutationObserver',
    "data-gof-lab", "type==='classifier'", "type==='builder'",
    "type==='contributions'", "type==='tail'", 'const reject=p<=alpha;',
):
    if marker not in interactions:
        errors.append(f'Interactions missing {marker}')

print('IB AI SL Lesson 4.15 definitive v2 validation')
print(f'Errors: {len(errors)}')
for error in errors:
    print(' ERROR:', error)
if errors:
    raise SystemExit(1)
print('Status: PASS')
print('Scope: 61 learn slides · 52 balanced practice questions · 3 IB tasks · 14 quiz questions')
print('Mathematics: fair, specified, binomial, normal, merge, df, and p-value anchors independently verified')
