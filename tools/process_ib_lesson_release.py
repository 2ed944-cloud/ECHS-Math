#!/usr/bin/env python3
"""Validate and materialise an IB Mathematics AI lesson/unit release."""
from __future__ import annotations
import json, re, shutil, tempfile, urllib.parse
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

ALLOWED_TOP={"assets","data","lessons","portal","docs","reports"}
BRIDGE_MARKER="echs_course_release_bridge_v1"


def _json(path:Path,label:str):
    try:value=json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:raise RuntimeError(f"Invalid {label}: {path.name}: {exc}") from exc
    if not isinstance(value,dict):raise RuntimeError(f"{label} must contain one JSON object")
    return value


def _local_html(path:Path,root:Path):
    text=path.read_text(encoding="utf-8",errors="replace")
    lower=text.lower()
    if "<html" not in lower or "</html>" not in lower:raise RuntimeError(f"Incomplete HTML document: {path.relative_to(root)}")
    if re.search(r'(?:src|href)\s*=\s*["\']\s*(?:https?:)?//',text,re.I):raise RuntimeError(f"External runtime asset found in {path.name}; lesson releases must be self-contained")
    for raw in re.findall(r'(?:src|href)\s*=\s*["\']([^"\']+)',text,re.I):
        ref=raw.split("#",1)[0].split("?",1)[0].strip()
        if not ref or ref.startswith(("#","data:","mailto:","tel:")):continue
        if ref.lower().startswith("javascript:"):raise RuntimeError(f"Unsafe javascript URL in {path.name}")
        target=(path.parent/urllib.parse.unquote(ref)).resolve()
        try:target.relative_to(root.resolve())
        except ValueError as exc:raise RuntimeError(f"Reference escapes package in {path.name}: {raw}") from exc
        if not target.exists():raise RuntimeError(f"Missing local reference in {path.name}: {raw}")


def _bridge(engine:Path):
    text=engine.read_text(encoding="utf-8",errors="replace")
    if BRIDGE_MARKER in text:return
    bridge=r'''
/* echs_course_release_bridge_v1 */
(function(){
  function context(){const p=new URLSearchParams(location.search),d=window.LESSON_DATA||{},n=String(d.lesson?.number||p.get("topic")||"");return{lessonKey:p.get("lessonKey")||"",course:p.get("course")||"g11-ib-ai",unit:p.get("unit")||"1",topic:p.get("topic")||n,title:p.get("title")||`${n} · ${d.lesson?.title||"IB Mathematics AI"}`}}
  function complete(){const c=context();if(!c.lessonKey){alert("Open this lesson from the G11 IB Mathematics course card before marking it complete.");return}try{const k="echs_math_complete",a=JSON.parse(localStorage.getItem(k)||"[]"),r=Array.isArray(a)?a:[];if(!r.includes(c.lessonKey))r.push(c.lessonKey);localStorage.setItem(k,JSON.stringify(r));const e="echs_learning_lesson_events_v2",x=JSON.parse(localStorage.getItem(e)||"[]"),h=Array.isArray(x)?x:[];h.push({number:c.topic,title:(window.LESSON_DATA?.lesson?.title||"IB Mathematics AI"),unitTitle:(window.LESSON_DATA?.unit?.title||"IB Unit"),course:c.course,label:c.title,type:"completed",source:"ib-ai-lesson-release",at:new Date().toISOString()});localStorage.setItem(e,JSON.stringify(h.slice(-3000)))}catch(error){console.warn(error)}window.dispatchEvent(new CustomEvent("echs:lesson-complete",{detail:c}));location.href="../../../../index.html#courses"}
  window.ECHSCompleteIBLesson=complete;const actions=document.querySelector(".header-actions");if(actions&&!document.getElementById("platform-complete-lesson")){const b=document.createElement("button");b.type="button";b.id="platform-complete-lesson";b.className="icon-btn";b.textContent="Complete lesson";b.addEventListener("click",complete);actions.prepend(b)}
})();
'''
    engine.write_text(text+bridge,encoding="utf-8")


def _portal_js(unit_number:int,unit:dict):
    payload=json.dumps(unit,ensure_ascii=False,separators=(",",":"))
    return f'''(function(){{"use strict";var unit={payload};window.ECHS_IB_MATH_AI_UNIT_{unit_number}=unit;if(!Array.isArray(window.ECHS_COURSES))return;function n(v){{return String(v||"").toLowerCase().replace(/[–—−]/g,"-").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}}function isIB(c){{if(!c)return false;var v=[c.id,c.course,c.title,c.shortTitle].map(n);return v.includes("g11-ib-ai")||v.includes("ib-math-ai")||v.some(function(x){{return x.includes("ib-mathematics-applications-and-interpretation")||x.includes("ib-math-ai")}})}}var i=window.ECHS_COURSES.findIndex(function(c){{return n(c&&c.id)==="g11-ib-ai"}});if(i<0)i=window.ECHS_COURSES.findIndex(isIB);if(i<0){{console.error("Canonical G11 IB Mathematics AI course was not found");return}}var course=window.ECHS_COURSES[i];window.ECHS_COURSES=window.ECHS_COURSES.filter(function(c,j){{return j===i||!isIB(c)}});course.id="g11-ib-ai";course.grade="G11";course.title="G11 IB Mathematics: Applications and Interpretation";course.shortTitle="IB Math AI";course.course=course.title;if(!Array.isArray(course.units))course.units=[];var u=course.units.findIndex(function(value,index){{return index==={unit_number-1}||/^unit\\s*{unit_number}(?:\\s*:|\\b)/i.test(String(value&&value.title||""))}});if(u>=0)course.units[u]=unit;else course.units.splice(Math.min({unit_number-1},course.units.length),0,unit);course.unitCount=course.units.length;course.lessonCount=course.units.reduce(function(t,x){{return t+(Array.isArray(x&&x.lessons)?x.lessons.length:0)}},0);course.status="Started";course.updatedUnits="Unit {unit_number} · "+unit.lessons.length+" complete interactive lessons";window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready",{{detail:{{courseId:course.id,unit:{unit_number},lessons:unit.lessons.length}}}}))}})();\n'''


def _insert_script(root:Path,relative:str):
    path=root/"index.html";text=path.read_text(encoding="utf-8")
    pattern=re.compile(rf'<script\s+src="{re.escape(relative)}(?:\?[^\"]*)?"></script>')
    tag=f'<script src="{relative}?v={datetime.now(timezone.utc).strftime("%Y%m%d")}-lesson-release"></script>'
    if pattern.search(text):text=pattern.sub(tag,text)
    else:
        marker='<script src="js/portal.js';pos=text.find(marker)
        if pos<0:raise RuntimeError("Could not locate portal script insertion point")
        text=text[:pos]+tag+"\n"+text[pos:]
    path.write_text(text,encoding="utf-8")


def process_ib_ai_release(root:Path,row:dict,package:Path,safe_extract):
    unit_key=str(row.get("unit_key") or "").strip()
    if not re.fullmatch(r"\d+",unit_key):raise RuntimeError("IB Mathematics AI unit key must be a whole number")
    unit_number=int(unit_key)
    with tempfile.TemporaryDirectory() as temp:
        extracted=Path(temp)/"release";extracted.mkdir();safe_extract(package,extracted)
        manifests=sorted(extracted.rglob("portal/lesson-catalog-patch.json"))
        if len(manifests)!=1:raise RuntimeError("IB lesson release must contain exactly one portal/lesson-catalog-patch.json")
        package_root=manifests[0].parent.parent
        catalog=_json(manifests[0],"IB lesson catalog patch")
        object_path=package_root/"portal"/f"unit-{unit_number}-portal-object.json"
        if not object_path.is_file():raise RuntimeError(f"Missing portal/unit-{unit_number}-portal-object.json")
        unit=_json(object_path,"IB portal unit object")
        lessons=catalog.get("lessons");portal_lessons=unit.get("lessons")
        if catalog.get("course")!="ib-math-ai" or int(catalog.get("unit",-1))!=unit_number:raise RuntimeError("Uploaded IB manifest does not match selected course and unit")
        if not isinstance(lessons,list) or not lessons:raise RuntimeError("IB lesson catalog contains no lessons")
        if not isinstance(portal_lessons,list) or len(portal_lessons)!=len(lessons):raise RuntimeError("IB portal object and catalog counts do not match")
        expected=[f"{unit_number}.{i}" for i in range(1,len(lessons)+1)]
        if [str(x.get("number") or "") for x in lessons]!=expected:raise RuntimeError(f"IB lesson numbers must be consecutive: {', '.join(expected)}")
        prefix=f"lessons/ib-math-ai/unit-{unit_number}/";seen=set()
        for item in lessons:
            url=str(item.get("url") or "")
            if not url.startswith(prefix) or "?" in url:raise RuntimeError(f"Lesson {item.get('number')} must use a direct local HTML URL under {prefix}")
            if url in seen:raise RuntimeError(f"Duplicate lesson URL: {url}")
            seen.add(url);relative=PurePosixPath(url[len(prefix):]);source=package_root.joinpath(*relative.parts)
            if not source.is_file() or source.suffix.lower()!=".html":raise RuntimeError(f"Lesson HTML is missing: {url}")
            _local_html(source,package_root)
        for item in portal_lessons:
            number=str(item.get("number") or "");match=next((x for x in lessons if str(x.get("number"))==number),None)
            if not match:raise RuntimeError(f"Portal lesson {number} is missing from catalog")
            item["number"]=number;item["title"]=re.sub(r"^\s*\d+\.\d+\s*","",str(item.get("title") or "")).strip();item["lesson_key"]=match.get("lesson_key");item["url"]=match.get("url");item["status"]="ready";item["new"]=True
        title=str(unit.get("title") or f"Unit {unit_number}")
        if not re.match(rf"^Unit\s*{unit_number}(?:\s*:|\b)",title,re.I):title=f"Unit {unit_number}: {title}"
        unit["title"]=title;unit["portalSummary"]=unit.get("portalSummary") or f"{len(lessons)} complete interactive lessons · uploaded through ECHS Lesson Release Manager"
        destination=root/"lessons"/"ib-math-ai"/f"unit-{unit_number}"
        if destination.exists():shutil.rmtree(destination)
        destination.mkdir(parents=True)
        for name in ALLOWED_TOP:
            source=package_root/name
            if source.is_dir():shutil.copytree(source,destination/name,ignore=shutil.ignore_patterns("screenshots"))
        for name in ("START_HERE.html","index.html","README.md","README_AR.md"):
            source=package_root/name
            if source.is_file():shutil.copy2(source,destination/name)
        for path in destination.rglob("*.html"):_local_html(path,destination)
        delivered=[p for p in (destination/"lessons").glob("*.html")]
        if len(delivered)!=len(lessons):raise RuntimeError("Copied release does not contain expected lesson HTML count")
        engine=destination/"assets"/"js"/"engine.js"
        if not engine.is_file():raise RuntimeError("IB lesson engine is missing")
        _bridge(engine)
        portal_js=_portal_js(unit_number,unit)
        (destination/"portal"/f"ib-math-ai-unit-{unit_number}.js").write_text(portal_js,encoding="utf-8")
        update=root/"data"/f"ib-math-ai-unit-{unit_number}-update.js";update.write_text(portal_js,encoding="utf-8")
        delivery=root/"data"/f"ib-math-ai-unit-{unit_number}-delivery-catalog.json";delivery.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        _insert_script(root,str(update.relative_to(root)).replace("\\","/"))
        return{"kind":"course-release","course":"ib-math-ai","unit":unit_key,"lessons":len(lessons),"destination":str(destination.relative_to(root)),"update_file":str(update.relative_to(root)),"delivery_catalog":str(delivery.relative_to(root)),"pr_title":f"Add IB Mathematics AI Unit {unit_key} lessons"}
