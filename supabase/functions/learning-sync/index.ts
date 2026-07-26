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

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
  try{
    const current=await session(req);
    if(!current||current.role!=="student")return reply(req,{ok:false,error:{message:"Student sign-in is required"}},401);
    if(req.method!=="POST")return reply(req,{ok:false,error:{message:"Method not allowed"}},405);
    const payload=await req.json() as {attempts?:Record<string,unknown>[];sessions?:Record<string,unknown>[];mastery?:Record<string,unknown>[];review?:Record<string,unknown>[]};
    const attempts=(payload.attempts??[]).slice(-10000),sessions=(payload.sessions??[]).slice(-1000),mastery=(payload.mastery??[]).slice(-5000),review=(payload.review??[]).slice(-5000);
    const attemptRows=await Promise.all(attempts.map(async(row,index)=>{
      const questionId=String(row.question_id??row.questionId??"");
      const clientId=String(row.event_id??row.client_event_id??row.id??await hash(JSON.stringify([questionId,row.at,row.response,index])));
      return{organization_id:current.organization_id,account_id:current.account_id,client_event_id:clientId,question_id:questionId,course:row.course??null,unit:row.unit??null,topic:row.topic??null,correct:Boolean(row.correct),response:row.response==null?null:String(row.response),mode:row.mode??"practice",bank_code:row.bank_code??row.bankCode??null,assignment_id:row.assignment_id??row.assignmentId??null,occurred_at:String(row.occurred_at??row.at??new Date().toISOString()),payload:row};
    })).then(rows=>rows.filter(row=>row.question_id));
    const sessionRows=sessions.map(row=>({organization_id:current.organization_id,account_id:current.account_id,client_session_id:String(row.client_session_id??row.clientSessionId??row.id??crypto.randomUUID()),mode:String(row.mode??row.type??"practice"),course:row.course??null,unit:row.unit??null,topic:row.topic??null,assignment_id:row.assignment_id??row.assignmentId??null,correct:number(row.correct),total:number(row.total??row.graded??row.answered),duration_seconds:number(row.duration_seconds??row.durationSeconds??(number(row.durationMs)/1000)),started_at:String(row.started_at??row.startedAt??new Date().toISOString()),completed_at:row.completed_at??row.completedAt??row.endedAt??null,payload:row}));
    const masteryRows=mastery.map(row=>({organization_id:current.organization_id,account_id:current.account_id,skill_key:String(row.skill_key??row.key??""),course:row.course??null,unit:row.unit??null,topic:row.topic??null,title:row.title??null,score:Math.max(0,Math.min(100,number(row.score))),attempts:number(row.attempts),correct:number(row.correct),evidence:Math.max(0,Math.min(1,number(row.evidence,Math.min(number(row.attempts)/8,1)))),updated_at:String(row.updated_at??row.updatedAt??new Date().toISOString())})).filter(row=>row.skill_key);
    const reviewRows=review.map(row=>({organization_id:current.organization_id,account_id:current.account_id,question_id:String(row.question_id??row.questionId??row.id??""),course:row.course??null,unit:row.unit??null,topic:row.topic??null,status:row.status??(row.unresolved===false?"recovered":"open"),due_at:String(row.due_at??row.dueAt??new Date().toISOString()),interval_days:number(row.interval_days??row.intervalDays??row.box,1),wrong_count:number(row.wrong_count??row.wrongCount??(row.unresolved?1:0)),correct_recovery_count:number(row.correct_recovery_count??row.correctRecoveryCount??row.correct),payload:row,updated_at:new Date().toISOString()})).filter(row=>row.question_id);
    const assignmentRows=sessionRows.filter(row=>row.assignment_id).map(row=>({assignment_id:row.assignment_id,student_id:current.account_id,status:row.completed_at?"submitted":"in_progress",score:row.total?Math.round(row.correct/row.total*100):null,correct:row.correct,total:row.total,duration_seconds:row.duration_seconds,started_at:row.started_at,submitted_at:row.completed_at,payload:row.payload,updated_at:new Date().toISOString()}));
    const operations=[];
    if(attemptRows.length)operations.push(db.from("learning_attempts").upsert(attemptRows,{onConflict:"account_id,client_event_id",ignoreDuplicates:true}));
    if(sessionRows.length)operations.push(db.from("learning_sessions").upsert(sessionRows,{onConflict:"account_id,client_session_id"}));
    if(masteryRows.length)operations.push(db.from("mastery_records").upsert(masteryRows,{onConflict:"account_id,skill_key"}));
    if(reviewRows.length)operations.push(db.from("review_items").upsert(reviewRows,{onConflict:"account_id,question_id"}));
    if(assignmentRows.length)operations.push(db.from("assignment_results").upsert(assignmentRows,{onConflict:"assignment_id,student_id"}));
    const results=await Promise.all(operations),failed=results.find(r=>r.error);if(failed?.error)throw failed.error;
    return reply(req,{ok:true,synced:{attempts:attemptRows.length,sessions:sessionRows.length,mastery:masteryRows.length,review:reviewRows.length,assignment_results:assignmentRows.length}});
  }catch(error){console.error(error);return reply(req,{ok:false,error:{message:error instanceof Error?error.message:"Sync failed"}},400)}
});
