from pathlib import Path
from html.parser import HTMLParser
import sys

ROOT = Path(__file__).resolve().parents[1]

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
    def handle_starttag(self, tag, attrs):
        values=dict(attrs)
        for key in ('href','src'):
            value=values.get(key)
            if value:
                self.links.append(value)

errors=[]
checked=0
for html in sorted(ROOT.rglob('*.html')):
    parser=LinkParser(); parser.feed(html.read_text(encoding='utf-8'))
    for link in parser.links:
        if link.startswith(('http://','https://','#','mailto:','javascript:')):
            continue
        target=(html.parent/link.split('#',1)[0]).resolve()
        checked+=1
        if not target.exists():
            errors.append(f'{html.relative_to(ROOT)} -> {link}')
if errors:
    print('LOCAL LINK AUDIT: FAIL')
    print('\n'.join(errors))
    sys.exit(1)
print(f'LOCAL LINK AUDIT: PASS ({checked} local references)')
