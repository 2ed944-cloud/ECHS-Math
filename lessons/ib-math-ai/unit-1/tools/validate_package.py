from pathlib import Path
import json, re, sys
root = Path(__file__).resolve().parents[1]
errors = []
expected = [root/'START_HERE.html', root/'assets/css/theme.css', root/'assets/css/katex.css', root/'assets/js/engine.js', root/'assets/js/katex.js']
for path in expected:
    if not path.exists():
        errors.append(f'missing {path.relative_to(root)}')
for n in range(1, 9):
    data_path = root/'data'/f'lesson-1.{n}.js'
    if not data_path.exists():
        errors.append(f'missing {data_path.relative_to(root)}')
        continue
    text = data_path.read_text(encoding='utf-8')
    payload = json.loads(text[len('window.LESSON_DATA = '):-2])
    if len(payload['slides']) != 49: errors.append(f'1.{n}: slides={len(payload["slides"])}')
    if len(payload['practice']) != 40: errors.append(f'1.{n}: practice={len(payload["practice"])}')
    if len(payload['quiz']) != 10: errors.append(f'1.{n}: quiz={len(payload["quiz"])}')
    if len(payload['exam']) != 2: errors.append(f'1.{n}: exam={len(payload["exam"])}')
    levels = {key: sum(item['level'] == key for item in payload['practice']) for key in ['Foundation','Application','Reasoning','Challenge']}
    if set(levels.values()) != {10}: errors.append(f'1.{n}: levels={levels}')
    prompts = [re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', item['prompt'])).strip().lower() for item in payload['practice'] + payload['quiz']]
    if len(prompts) != len(set(prompts)): errors.append(f'1.{n}: duplicate prompts')
font_files = list(root.rglob('*.woff*')) + list(root.rglob('*.ttf')) + list(root.rglob('*.otf'))
if font_files:
    errors.append('font files present: ' + ', '.join(str(path.relative_to(root)) for path in font_files))
if errors:
    print('FAIL')
    print(chr(10).join(errors))
    sys.exit(1)
print('PASS: package structure, counts, level balance, prompt uniqueness and no-font policy')
