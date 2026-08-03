#!/usr/bin/env python3
from __future__ import annotations
import json,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
lessons=['IB_AI_SL_1.2_arithmetic_sequences_ECHS.html','IB_AI_SL_1.3_geometric_sequences_ECHS.html','IB_AI_SL_1.4_financial_models_ECHS.html','IB_AI_SL_1.5_logarithms_ECHS.html','IB_AI_SL_1.6_approximation_error_ECHS.html','IB_AI_SL_1.7_loans_annuities_ECHS.html','IB_AI_SL_1.8_technology_equations_ECHS.html']
viewports={'desktop':{'width':1440,'height':900},'mobile':{'width':390,'height':844}}
errors=[];screen_checks=0;route_checks=0;control_checks=0
LOCAL_STORAGE_SHIM="""(()=>{const m=new Map();const s={getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size}};Object.defineProperty(window,'localStorage',{configurable:true,value:s});})()"""

def injected_html(wrapper: Path) -> str:
    text=wrapper.read_text(encoding='utf-8')
    styles=[]
    for tag,href in re.findall(r"(<link\b[^>]*href=['\"]([^'\"]+)['\"][^>]*>)",text,flags=re.I):
        if '.css' not in href: continue
        rel=href.split('?',1)[0]
        path=(wrapper.parent/rel).resolve()
        if not path.is_file(): raise FileNotFoundError(f'{wrapper.name}: missing stylesheet {rel}')
        styles.append(path.read_text(encoding='utf-8',errors='replace'))
        text=text.replace(tag,'')
    scripts=[]
    for tag,src in re.findall(r"(<script\b[^>]*src=['\"]([^'\"]+)['\"][^>]*>\s*</script>)",text,flags=re.I):
        rel=src.split('?',1)[0]
        path=(wrapper.parent/rel).resolve()
        if not path.is_file(): raise FileNotFoundError(f'{wrapper.name}: missing script {rel}')
        scripts.append(path.read_text(encoding='utf-8',errors='replace').replace('</script>','<\\/script>'))
        text=text.replace(tag,'')
    text=text.replace('</head>','<style>'+"\n".join(styles)+'</style></head>')
    text=text.replace('</body>', ''.join('<script>'+js+'</script>' for js in scripts)+'</body>')
    return text

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox'])
 for device,vp in viewports.items():
  for name in lessons:
   page=browser.new_page(viewport=vp)
   page.set_default_timeout(3000)
   local_errors=[]
   page.on('pageerror',lambda e,store=local_errors:store.append(f'pageerror: {e}'))
   page.on('console',lambda m,store=local_errors:store.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
   wrapper=ROOT/'lessons/ib-math-ai/unit-1/lessons'/name
   try:
    page.evaluate(LOCAL_STORAGE_SHIM)
    page.set_content(injected_html(wrapper),wait_until='load',timeout=30000)
    page.wait_for_selector('body[data-rendered="1"]',timeout=15000)
    selectors=['.brand-block','.header-title','#toggle-route-menu','#prev-slide','#next-slide','.progress-wrap']
    if device=='desktop': selectors.extend(['#start-lesson','#toggle-fullscreen'])
    fixed=page.evaluate("sels=>sels.map(sel=>{const e=document.querySelector(sel),r=e&&e.getBoundingClientRect();return {sel,visible:!!e&&getComputedStyle(e).display!=='none'&&!!r&&r.width>0&&r.height>0,x:r&&r.x,right:r&&r.right}})",selectors)
    for item in fixed:
     if not item['visible']: errors.append(f"{device} {name}: fixed control not visible {item['sel']}")
     elif item['x'] < -1 or item['right'] > vp['width']+1: errors.append(f"{device} {name}: fixed control clipped {item['sel']}")
    for index in range(36):
     title=page.locator('.slide-title,.u1-cover h1').first
     if not title.is_visible(): errors.append(f'{device} {name} slide {index+1}: title not visible')
     overflow=page.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+2')
     if overflow: errors.append(f'{device} {name} slide {index+1}: horizontal overflow')
     if page.locator('[data-math-error="true"]').count(): errors.append(f'{device} {name} slide {index+1}: math fallback')
     screen_checks+=1
     if index<35: page.evaluate("document.querySelector('#next-slide').click()");page.wait_for_timeout(15)
    page.evaluate("document.querySelector('#open-map').click()");page.evaluate("document.querySelector('[data-slide-index=\"6\"]')?.click()");page.wait_for_timeout(50)
    note=page.locator('.student-note').first
    if note.count(): note.fill('qa-note');control_checks+=1
    if page.locator('details summary').count(): page.evaluate("document.querySelector('details summary').click()");control_checks+=1
    for route in ['practice','exam','quiz','review']:
     page.evaluate("route=>document.querySelector('.route-btn[data-route=\"'+route+'\"]')?.click()",route);page.wait_for_timeout(80)
     if not page.locator('.route-page').is_visible(): errors.append(f'{device} {name} route {route}: not visible')
     overflow=page.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+2')
     if overflow: errors.append(f'{device} {name} route {route}: horizontal overflow')
     if route=='exam':
      scroll=page.evaluate("()=>{const a=document.querySelector('#app');return {scrollHeight:a.scrollHeight,clientHeight:a.clientHeight,overflow:getComputedStyle(a).overflowY}}")
      if scroll['scrollHeight']<=scroll['clientHeight'] or scroll['overflow']=='hidden': errors.append(f'{device} {name}: assessment route not scrollable')
     route_checks+=1
   except Exception as exc:
    errors.append(f'{device} {name}: browser QA exception: {exc}')
   errors.extend(f'{device} {name}: {e}' for e in local_errors)
   page.close()
 browser.close()
report={'release':'5.3.0','execution_mode':'Chromium set_content with production-order local asset injection','runs':len(lessons)*len(viewports),'learn_screen_checks':screen_checks,'route_checks':route_checks,'interactive_control_checks':control_checks,'errors':errors,'status':'PASS' if not errors else 'FAIL'}
out=ROOT/'lessons/ib-math-ai/unit-1/reports/browser-qa-v5-3-0.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
if errors: raise SystemExit(1)
