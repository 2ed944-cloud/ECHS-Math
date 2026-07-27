#!/usr/bin/env python3
"""Process one queued Teacher Upload Manager request.

Private-bank requests are imported directly into Supabase. Course-release requests are
validated and materialised in the checked-out repository; the workflow then opens a PR.
"""
from __future__ import annotations
import argparse, hashlib, html, json, os, re, shutil, subprocess, sys, tempfile, urllib.parse, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET = "teacher-upload-staging"


def now(): return datetime.now(timezone.utc).isoformat()
def canonical(value): return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()

def request(method, path, body=None, headers=None):
    merged={"apikey":SERVICE_KEY,"authorization":f"Bearer {SERVICE_KEY}","user-agent":"ECHS-Teacher-Upload-Processor/1.0"};merged.update(headers or {})
    req=urllib.request.Request(f"{SUPABASE_URL}{path}",data=body,method=method,headers=merged)
    with urllib.request.urlopen(req,timeout=300) as response:
        data=response.read();ctype=response.headers.get("content-type","")
        return json.loads(data) if data and "json" in ctype else data

def patch(request_id, values):
    query=urllib.parse.urlencode({"id":f"eq.{request_id}"})
    return request("PATCH",f"/rest/v1/teacher_upload_requests?{query}",canonical({**values,"updated_at":now()}),{"content-type":"application/json","prefer":"return=representation"})

def queued(request_id=""):
    select="id,organization_id,upload_kind,course_key,unit_key,original_filename,object_path,file_size_bytes,sha256,status"
    if request_id:
        query=urllib.parse.urlencode({"select":select,"id":f"eq.{request_id}","limit":"1"},safe=",")
    else:
        query=urllib.parse.urlencode({"select":select,"status":"eq.queued","order":"created_at.asc","limit":"1"},safe=",")
    rows=request("GET",f"/rest/v1/teacher_upload_requests?{query}") or []
    return rows[0] if rows else None

def download(row, destination):
    encoded="/".join(urllib.parse.quote(part,safe="._+-") for part in row["object_path"].split("/"))
    data=request("GET",f"/storage/v1/object/{BUCKET}/{encoded}")
    destination.write_bytes(data)
    digest=hashlib.sha256(data).hexdigest()
    if digest!=row["sha256"]: raise RuntimeError(f"SHA-256 mismatch: expected {row['sha256']}, got {digest}")
    if len(data)!=int(row["file_size_bytes"]): raise RuntimeError("Staged ZIP size does not match the upload request")

def safe_extract(archive_path, destination):
    with zipfile.ZipFile(archive_path) as archive:
        bad=archive.testzip()
        if bad: raise RuntimeError(f"ZIP CRC failure: {bad}")
        for member in archive.infolist():
            path=PurePosixPath(member.filename)
            if path.is_absolute() or ".." in path.parts: raise RuntimeError(f"Unsafe ZIP path: {member.filename}")
            if member.file_size>25*1024*1024: raise RuntimeError(f"Oversized release member: {member.filename}")
        archive.extractall(destination)

def lesson_number(name, unit):
    match=re.search(rf"(?:^|_){re.escape(str(unit))}\.(\d+)(?:_|\b)",name)
    return int(match.group(1)) if match else 999

def human_title(path):
    text=path.read_text(encoding="utf-8",errors="replace")
    title=re.search(r"<title[^>]*>(.*?)</title>",text,re.I|re.S)
    value=re.sub(r"<[^>]+>"," ",html.unescape(title.group(1) if title else path.stem))
    value=re.sub(r"\s+"," ",value).strip()
    value=re.sub(r"\s*[|·-]\s*ECHS.*$","",value,flags=re.I)
    return value or path.stem.replace("_"," ")

def process_course(row, package):
    course=row.get("course_key") or "";unit=str(row.get("unit_key") or "").strip()
    if course!="ap-precalculus": raise RuntimeError("The first Course Release Manager version supports AP Precalculus releases only")
    if not re.fullmatch(r"\d+",unit): raise RuntimeError("AP Precalculus unit key must be a whole number")
    with tempfile.TemporaryDirectory() as temp:
        extracted=Path(temp)/"release";extracted.mkdir();safe_extract(package,extracted)
        html_files=sorted((p for p in extracted.rglob("*.html") if p.name.lower()!="start_here.html"),key=lambda p:(lesson_number(p.name,unit),p.name.lower()))
        if not html_files: raise RuntimeError("No lesson HTML files were found in the release")
        expected_prefix=f"AP_Precalculus_{unit}."
        lesson_files=[p for p in html_files if expected_prefix.lower() in p.name.lower()]
        if not lesson_files: raise RuntimeError(f"No AP Precalculus Unit {unit} lesson filenames were found")
        destinations=ROOT/"lessons"/"ap-precalculus"/f"unit-{unit}";destinations.mkdir(parents=True,exist_ok=True)
        lessons=[]
        for source in lesson_files:
            number=lesson_number(source.name,unit)
            if number==999: continue
            target=destinations/source.name
            shutil.copy2(source,target)
            text=target.read_text(encoding="utf-8",errors="replace")
            if "<html" not in text.lower() or "</html>" not in text.lower(): raise RuntimeError(f"Incomplete HTML document: {source.name}")
            lessons.append({"number":number,"title":human_title(target),"file":source.name})
        if not lessons: raise RuntimeError("No numbered lesson files could be prepared")
        lessons.sort(key=lambda row:row["number"])
        title=f"Unit {unit}: Functions Involving Parameters, Vectors, and Matrices" if unit=="4" else f"Unit {unit}"
        rows=[]
        for item in lessons:
            label=f"{unit}.{item['number']} {re.sub(r'^.*?\d+\.\d+\s*','',item['title']).strip()}".strip()
            outcomes=[f"Develop the core concepts and representations in {label}.","Apply the lesson ideas across symbolic, graphical, numerical, and contextual representations.","Use the linked practice pathway to build mastery evidence."]
            rows.append([str(item["number"]),label,item["file"],outcomes])
        payload=json.dumps(rows,ensure_ascii=False)
        js=f'''(function(){{"use strict";if(!Array.isArray(window.ECHS_COURSES))return;var lessons={payload}.map(function(item){{var url="lessons/ap-precalculus/unit-{unit}/"+item[2];return{{number:item[0],title:item[1],outcomes:item[3],resources:[{{label:"Complete interactive lesson",url:url,type:"resource"}}],url:url,status:"ready",new:true,keywords:(item[1]+" AP Precalculus unit {unit}").toLowerCase().split(/\\s+/)}}}});var unitRelease={{title:{json.dumps(title)},description:"{len(rows)} complete interactive AP Precalculus lessons uploaded through the ECHS Course Release Manager.",portalSummary:"{len(rows)} interactive lessons · automatic release validation",essential_questions:["How do the representations in this unit describe mathematical structure and change?","How can technology, algebra, graphs, and context support reliable conclusions?"],lessons:lessons,refreshed:true,videoSource:"ECHS interactive AP Precalculus lesson sequence"}};function normalize(value){{return String(value||"").toLowerCase().replace(/[–—−]/g,"-").replace(/\\s+/g," ").trim()}}var course=window.ECHS_COURSES.find(function(item){{if(!item)return false;var id=normalize(item.id),labels=[item.course,item.title,item.shortTitle].map(normalize);return id==="ap-precalculus-g10-g11"||id==="ap-precalculus"||labels.some(function(label){{return label.indexOf("ap precalculus")>=0}})}});if(!course)return;if(!Array.isArray(course.units))course.units=[];var index=course.units.findIndex(function(value){{return new RegExp("^unit\\\\s*{unit}(?:\\\\s*:|\\\\b)","i").test(String(value&&value.title||"").trim())}});if(index>=0)course.units[index]=unitRelease;else course.units.splice(Math.min({max(int(unit)-1,0)},course.units.length),0,unitRelease);course.unitCount=course.units.length;course.lessonCount=course.units.reduce(function(total,value){{return total+(Array.isArray(value&&value.lessons)?value.lessons.length:0)}},0)}})();\n'''
        update_path=ROOT/"data"/f"ap-precalculus-unit-{unit}-update.js";update_path.write_text(js,encoding="utf-8")
        index_path=ROOT/"index.html";index=index_path.read_text(encoding="utf-8")
        script=f'<script src="data/ap-precalculus-unit-{unit}-update.js"></script>'
        if script not in index:
            marker='<script src="data/ap-precalculus-unit-3-update.js"></script>'
            if marker in index:index=index.replace(marker,marker+"\n  "+script)
            else:
                portal='<script src="js/portal.js'
                pos=index.find(portal)
                if pos<0: raise RuntimeError("Could not locate the portal script insertion point")
                index=index[:pos]+script+"\n  "+index[pos:]
            index_path.write_text(index,encoding="utf-8")
        return {"course":course,"unit":unit,"lessons":len(lessons),"destination":str(destinations.relative_to(ROOT)),"update_file":str(update_path.relative_to(ROOT)),"pr_title":f"Add AP Precalculus Unit {unit} lessons"}

def process_bank(row, package):
    command=[sys.executable,str(ROOT/"tools"/"upload_private_bank_package.py"),str(package),"--organization-id",row["organization_id"]]
    result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if result.returncode: raise RuntimeError(f"Private bank import failed: {result.stderr[-3000:] or result.stdout[-3000:]}")
    match=re.findall(r"\{[\s\S]*?\}",result.stdout)
    parsed={}
    if match:
        try:parsed=json.loads(match[-1])
        except Exception:pass
    return {"kind":"private-bank",**parsed,"log_tail":result.stdout[-1200:]}

def write_output(name,value):
    output=os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output,"a",encoding="utf-8") as handle:handle.write(f"{name}={value}\n")

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--request-id",default="");args=parser.parse_args()
    if not SUPABASE_URL or not SERVICE_KEY: raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    row=queued(args.request_id)
    if not row:
        print("No queued teacher upload request found");write_output("found","false");return 0
    request_id=row["id"];write_output("found","true");write_output("request_id",request_id);write_output("kind",row["upload_kind"])
    patch(request_id,{"status":"processing","progress":18,"stage":"Automatic processor started","started_at":now(),"error_message":None})
    try:
        with tempfile.TemporaryDirectory() as temp:
            package=Path(temp)/row["original_filename"];patch(request_id,{"progress":24,"stage":"Downloading private staged ZIP"});download(row,package)
            patch(request_id,{"progress":34,"stage":"SHA-256 and ZIP integrity verified"})
            if row["upload_kind"]=="private-bank":
                patch(request_id,{"progress":42,"stage":"Importing questions, mappings, and private media"});result=process_bank(row,package)
                patch(request_id,{"status":"completed","progress":100,"stage":"Private bank imported and linked to lessons","result":result,"completed_at":now()});write_output("changed","false")
            else:
                patch(request_id,{"progress":48,"stage":"Validating lesson release and preparing repository files"});result=process_course(row,package)
                patch(request_id,{"progress":76,"stage":"Release validated · preparing pull request","result":result});write_output("changed","true");write_output("pr_title",result["pr_title"])
        return 0
    except Exception as exc:
        patch(request_id,{"status":"failed","progress":0,"stage":"Automatic processing failed","error_message":str(exc)[:4000],"completed_at":now()});raise

if __name__=="__main__":raise SystemExit(main())
