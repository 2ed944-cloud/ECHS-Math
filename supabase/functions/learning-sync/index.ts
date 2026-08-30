import { createClient } from "npm:@supabase/supabase-js@2";

type SessionAccount = { account_id: string; organization_id: string; role: string };
const URL = Deno.env.get("SUPABASE_URL") ?? "";
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173").split(",").map(x=>x.trim()).filter(Boolean);
const db=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
function headers(req:Request):HeadersInit{const origin=req.headers.get("origin")??"",allowed=ORIGINS.includes(origin)?origin:ORIGINS[0]??"";return{"access-control-allow-origin":allowed,"access-control-allow-headers":"authorization, content-type","access-control-allow-methods":"POST, OPTIONS","vary":"Origin","content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}}
function reply(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:headers(req)})}
async function hash(value:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function session(req:Request):Promise<SessionAccount|null>{const h=req.headers.get("authorization")??"",token=h.startsWith("Bearer ")?h.slice(7).trim():"";if(!token)return null;const {data,error}=await db.rpc("api_session_lookup",{p_token_hash:await hash(token)});if(error)throw error;return Array.isArray(data)&&data[0]?data[0]:null}
function number(value:unknown,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function canonicalCourse(value:unknown){const key=String(value??"").trim().toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const aliases:Record<string,string>={"ap-calculus-ab":"ap-calculus","ap-calculus-bc":"ap-calculus","g12-ap-calculus-ab":"ap-calculus","ap-precalculus-g10-g11":"ap-precalculus","g11-ib-ai":"ib-math-ai","ib-mathematics-ai":"ib-math-ai","g9-pre-precalculus":"grade-9","grade-9-pre-precalculus":"grade-9","g10-algebra2-ap-readiness":"algebra-2","algebra-2-concepts":"algebra-2"};if(aliases[key])return aliases[key];if(key.includes("precalculus"))return"ap-precalculus";if(key.includes("calculus"))return"ap-calculus";if(key.includes("algebra-2")||key.includes("algebra2"))return"algebra-2";if((key.includes("ib")&&key.includes("math"))||key==="g11-ib-ai")return"ib-math-ai";if(key.includes("grade-9")||key.includes("pre-precalculus"))return"grade-9";return key}

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
  try{
    const current=await session(req);
    if(!current||current.role!=="student")return reply(req,{ok:false,error:{message:"Student sign-in is required"}},401);
    if(req.method!=="POST")return reply(req,{ok:false,error:{message:"Method not allowed"}},405);
    const payload=await req.json() as {attempts?:Record<string,unknown>[];sessions?:Record<string,unknown>[];mastery?:Record<string,unknown>[];review?:Record<string,unknown>[];lessons?:Record<string,unknown>[]};
    const attempts=(payload.attempts??[]).slice(-10000),sessions=(payload.sessions??[]).slice(-1000),review=(payload.review??[]).slice(-5000),lessons=(payload.lessons??[]).slice(-2000);
    const attemptRows=await Promise.all(attempts.map(async(row,index)=>{
      const questionId=String(row.question_id??row.questionId??"");
      const clientId=String(row.event_id??row.client_event_id??row.id??await hash(JSON.stringify([questionId,row.at,row.response,index])));
      return{organization_id:current.organization_id,account_id:current.account_id,client_event_id:clientId,question_id:questionId,course:row.course??null,unit:row.unit??null,topic:row.topic??null,correct:Boolean(row.correct),response:row.response==null?null:String(row.response),mode:row.mode??"practice",bank_code:row.bank_code??row.bankCode??null,assignment_id:row.assignment_id??row.assignmentId??null,occurred_at:String(row.occurred_at??row.at??new Date().toISOString()),payload:row};
    })).then(rows=>rows.filter(row=>row.question_id));
    const sessionRows=sessions.map(row=>({organization_id:current.organization_id,account_id:current.account_id,client_session_id:String(row.client_session_id??row.clientSessionId??row.id??crypto.randomUUID()),mode:String(row.mode??row.type??"practice"),course:row.course??null,unit:row.unit??null,topic:row.topic??null,assignment_id:row.assignment_id??row.assignmentId??null,correct:number(row.correct),total:number(row.total??row.graded??row.answered),duration_seconds:number(row.duration_seconds??row.durationSeconds??(number(row.durationMs)/1000)),started_at:String(row.started_at??row.startedAt??new Date().toISOString()),completed_at:row.completed_at??row.completedAt??row.endedAt??null,payload:row}));
    const reviewRows=review.map(row=>({organization_id:current.organization_id,account_id:current.account_id,question_id:String(row.question_id??row.questionId??row.id??""),course:row.course??null,unit:row.unit??null,topic:row.topic??null,status:row.status??(row.unresolved===false?"recovered":"open"),due_at:String(row.due_at??row.dueAt??new Date().toISOString()),interval_days:number(row.interval_days??row.intervalDays??row.box,1),wrong_count:number(row.wrong_count??row.wrongCount??(row.unresolved?1:0)),correct_recovery_count:number(row.correct_recovery_count??row.correctRecoveryCount??row.correct),payload:row,updated_at:new Date().toISOString()})).filter(row=>row.question_id);
    const lessonRows=lessons.map(row=>{const course=canonicalCourse(row.course_key??row.course),unitIndex=number(row.unit_index,number(row.unit,1)-1),topic=String(row.topic??"").trim(),accessKey=String(row.access_key??`${course}::${unitIndex}::${topic}`);return{organization_id:current.organization_id,account_id:current.account_id,access_key:accessKey,course_key:course,unit_index:unitIndex,topic,title:String(row.title??""),completed_at:String(row.completed_at??row.completedAt??new Date().toISOString()),payload:row,updated_at:new Date().toISOString()}}).filter(row=>row.course_key&&row.topic&&row.unit_index>=0&&row.access_key===`${row.course_key}::${row.unit_index}::${row.topic}`);
    const assignmentRows=sessionRows.filter(row=>row.assignment_id).map(row=>({assignment_id:row.assignment_id,student_id:current.account_id,status:row.completed_at?"submitted":"in_progress",score:row.total?Math.round(row.correct/row.total*100):null,correct:row.correct,total:row.total,duration_seconds:row.duration_seconds,started_at:row.started_at,submitted_at:row.completed_at,payload:row.payload,updated_at:new Date().toISOString()}));
    const operations=[];
    if(attemptRows.length)operations.push(db.from("learning_attempts").upsert(attemptRows,{onConflict:"account_id,client_event_id",ignoreDuplicates:true}));
    if(sessionRows.length)operations.push(db.from("learning_sessions").upsert(sessionRows,{onConflict:"account_id,client_session_id"}));
    if(reviewRows.length)operations.push(db.from("review_items").upsert(reviewRows,{onConflict:"account_id,question_id"}));
    if(lessonRows.length)operations.push(db.from("lesson_completions").upsert(lessonRows,{onConflict:"account_id,access_key"}));
    if(assignmentRows.length)operations.push(db.from("assignment_results").upsert(assignmentRows,{onConflict:"assignment_id,student_id"}));
    const results=await Promise.all(operations),failed=results.find(r=>r.error);if(failed?.error)throw failed.error;
    return reply(req,{ok:true,deprecated:true,authoritative_mastery_service:"mastery-evidence",client_mastery_ignored:Array.isArray(payload.mastery)&&payload.mastery.length>0,synced:{attempts:attemptRows.length,sessions:sessionRows.length,review:reviewRows.length,lessons:lessonRows.length,assignment_results:assignmentRows.length}});
  }catch(error){console.error(error);return reply(req,{ok:false,error:{message:error instanceof Error?error.message:"Sync failed"}},400)}
});
