from __future__ import annotations

from pathlib import Path
import json
import math
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA_PREFIX = 'window.LESSON_DATA = '


def parse_payload(path: Path) -> dict:
    text = path.read_text(encoding='utf-8')
    if not (text.startswith(DATA_PREFIX) and text.endswith(';\n')):
        raise ValueError(f'{path.name}: invalid data wrapper')
    return json.loads(text[len(DATA_PREFIX):-2])


def normalize_prompt(text: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', text)
    return re.sub(r'\s+', ' ', text).strip().lower()


def parse_answer_number(answer: str) -> float | None:
    text = str(answer).replace(',', '').replace('−', '-').replace('\\,', '')
    scientific = re.search(r'([-+]?\d*\.?\d+)\s*\\times\s*10\^\{?([-+]?\d+)\}?', text)
    if scientific:
        return float(scientific.group(1)) * 10 ** int(scientific.group(2))
    fraction = re.search(r'\\frac\{([-+]?\d+(?:\.\d+)?)\}\{([-+]?\d+(?:\.\d+)?)\}', text)
    if fraction:
        return float(fraction.group(1)) / float(fraction.group(2))
    match = re.search(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', text)
    return float(match.group(0)) if match else None


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    all_ids: list[str] = []
    global_prompts: dict[str, list[str]] = {}
    totals = {'lessons': 0, 'slides': 0, 'practice': 0, 'quiz': 0, 'exam': 0, 'numeric_checks': 0}

    editorial_patterns = [
        r'\bcorrected:', r'\bcorrect the previous\b', r'\busing the previous model\b',
        r'\bfor the same sequence\b', r'\bfor the same rectangle\b', r'\bfor the same loan\b',
        r'\bfor that loan\b', r'\bfor that plan\b', r'\bthe loan above\b'
    ]

    for path in sorted((ROOT / 'data').glob('lesson-*.js')):
        payload = parse_payload(path)
        lesson = payload['lesson']['number']
        totals['lessons'] += 1
        totals['slides'] += len(payload['slides'])
        totals['practice'] += len(payload['practice'])
        totals['quiz'] += len(payload['quiz'])
        totals['exam'] += len(payload['exam'])

        expected = {'slides': 49, 'practice': 40, 'quiz': 10, 'exam': 2}
        for key, count in expected.items():
            actual = len(payload[key])
            if actual != count:
                errors.append(f'{lesson}: {key}={actual}, expected {count}')

        levels = {name: 0 for name in ['Foundation', 'Application', 'Reasoning', 'Challenge']}
        local_prompts: dict[str, list[str]] = {}
        for section in ['practice', 'quiz']:
            for item in payload[section]:
                qid = item.get('id', '')
                all_ids.append(qid)
                if not item.get('prompt') or not item.get('answer') or not item.get('solution'):
                    errors.append(f'{qid}: missing prompt, answer or solution')
                if section == 'practice':
                    if item.get('level') not in levels:
                        errors.append(f'{qid}: unexpected level {item.get("level")}')
                    else:
                        levels[item['level']] += 1
                prompt = normalize_prompt(item['prompt'])
                local_prompts.setdefault(prompt, []).append(qid)
                global_prompts.setdefault(prompt, []).append(qid)
                for pattern in editorial_patterns:
                    if re.search(pattern, prompt, flags=re.I):
                        errors.append(f'{qid}: dependent/editorial wording remains: {item["prompt"]}')

                choices = item.get('choices')
                if choices is not None:
                    correct = item.get('correct')
                    if not isinstance(correct, int) or not 0 <= correct < len(choices):
                        errors.append(f'{qid}: invalid MCQ correct index')

                check = item.get('check')
                if check and check.get('mode') == 'number':
                    totals['numeric_checks'] += 1
                    value = float(check['value'])
                    tolerance = float(check.get('tolerance', 0))
                    if not math.isfinite(value) or not math.isfinite(tolerance) or tolerance <= 0:
                        errors.append(f'{qid}: non-finite/non-positive numeric check')
                        continue
                    if value != 0 and tolerance >= abs(value):
                        errors.append(f'{qid}: tolerance would accept zero ({tolerance} for target {value})')
                    parsed = parse_answer_number(item['answer'])
                    if parsed is None:
                        warnings.append(f'{qid}: numeric check but answer number was not parsed')
                    elif abs(parsed - value) > tolerance + max(abs(value) * 1e-12, 1e-15):
                        errors.append(f'{qid}: displayed answer {parsed} is outside target tolerance for {value}')

        if any(value != 10 for value in levels.values()):
            errors.append(f'{lesson}: Practice Studio level distribution {levels}')
        for prompt, ids in local_prompts.items():
            if len(ids) > 1:
                errors.append(f'{lesson}: duplicate prompt in {ids}')

        for task in payload['exam']:
            all_ids.append(task['id'])
            if sum(part['marks'] for part in task['parts']) != task['total_marks']:
                errors.append(f'{task["id"]}: part marks do not sum to total')
            for part in task['parts']:
                if not part.get('prompt') or not part.get('answer') or not part.get('markscheme'):
                    errors.append(f'{task["id"]}({part.get("label")}): incomplete part')

    if len(all_ids) != len(set(all_ids)):
        duplicates = sorted({qid for qid in all_ids if all_ids.count(qid) > 1})
        errors.append('duplicate IDs: ' + ', '.join(duplicates))
    for prompt, ids in global_prompts.items():
        if len(ids) > 1:
            errors.append(f'global duplicate prompt: {ids}')

    expected_totals = {'lessons': 8, 'slides': 392, 'practice': 320, 'quiz': 80, 'exam': 16}
    for key, expected in expected_totals.items():
        if totals[key] != expected:
            errors.append(f'total {key}={totals[key]}, expected {expected}')

    report = {'status': 'passed' if not errors else 'failed', 'totals': totals, 'errors': errors, 'warnings': warnings}
    (ROOT / 'reports' / 'question-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    if errors:
        print('QUESTION AUDIT: FAIL')
        print('\n'.join(errors))
        return 1
    print('QUESTION AUDIT: PASS')
    print(json.dumps(totals, indent=2))
    if warnings:
        print('Warnings:')
        print('\n'.join(warnings))
    return 0


if __name__ == '__main__':
    sys.exit(main())
