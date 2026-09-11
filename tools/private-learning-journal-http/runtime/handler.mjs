import {JournalError,need,readWire,parseWire,MAX_BYTES} from './wire.mjs';
import {ROUTES,parseProtocolWire,validateRequest,validateReply} from './contract.mjs';

export const PATHS=Object.freeze(Object.fromEntries(Object.keys(ROUTES).map(route=>['/functions/v1/learning-journal/'+route,route])));
const JSON_TYPE=/^application\/json(?:\s*;\s*charset=utf-8)?$/i;
const SQL_ERRORS=Object.freeze({
 '28000':[401,'session-unavailable'],'42501':[403,'actor-unavailable'],
 '55000':[409,'owner-unavailable'],'22023':[400,'invalid-request'],
 '40001':[409,'journal-conflict'],'23514':[409,'journal-conflict'],
 '54000':[413,'journal-limit'],'57014':[504,'journal-deadline'],
 '55P03':[503,'journal-busy'],'0A000':[503,'journal-unavailable']
});
function cancelBody(response){try{void response?.body?.cancel().catch(()=>{});}catch{}}
function checkBodyHeaders(headers,{upstream=false}={}){
 const status=upstream?502:400;
 need(JSON_TYPE.test(headers.get('content-type')||''),'content-type',status);
 need(!headers.has('content-encoding')||headers.get('content-encoding')==='identity','content-encoding',status);
 const length=headers.get('content-length');
 if(length!==null)need(/^(0|[1-9][0-9]*)$/.test(length)&&Number(length)<=MAX_BYTES,'content-length',upstream?502:413);
}
function serviceConfig({supabaseUrl,serviceKey,allowedOrigins,fetchImpl,deadlineMs=10000}){
 need(typeof supabaseUrl==='string'&&/^https:\/\/[a-z]{20}\.supabase\.co$/.test(supabaseUrl),'service-origin');
 need(typeof serviceKey==='string'&&/^[\x21-\x7e]{1,8192}$/.test(serviceKey),'service-key');
 need(Array.isArray(allowedOrigins)&&allowedOrigins.length>0&&allowedOrigins.length<=8,'origins');
 const origins=new Set();for(const origin of allowedOrigins){const url=new URL(origin);need(url.protocol==='https:'&&url.origin===origin&&!origins.has(origin),'origin');origins.add(origin);}
 need(typeof fetchImpl==='function','fetch-port');need(Number.isInteger(deadlineMs)&&deadlineMs>0&&deadlineMs<=10000,'deadline-config');
 return {supabaseUrl,serviceKey,origins,fetchImpl,deadlineMs};
}
async function tokenHash(request){
 const auth=request.headers.get('authorization')||'';need(/^Bearer [\x21-\x7e]{1,4096}$/.test(auth),'session-unavailable',401);
 const bytes=new TextEncoder().encode(auth.slice(7));try{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}finally{bytes.fill(0);}
}

// No default fetch/env/serve binding: this candidate cannot deploy itself. The
// deployment adapter must explicitly supply a trusted origin, key and fetch.
export function createJournalHandler(options){
 const config=serviceConfig(options);
 return async function journal(request){
  let controller,timer,abort,upstream;
  const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin'};
  const response=(raw,status)=>new Response(raw,{status,headers});
  const failure=(code,status)=>response(JSON.stringify({ok:false,error:{code}}),status);
  try{
   need(request instanceof Request,'native-request');
   const origin=request.headers.get('origin');const allowedOrigin=origin!==null&&config.origins.has(origin);
   if(allowedOrigin)Object.assign(headers,{'access-control-allow-origin':origin,'access-control-allow-headers':'authorization, content-type','access-control-allow-methods':'POST, OPTIONS'});
   const url=new URL(request.url),route=PATHS[url.pathname];need(Object.hasOwn(PATHS,url.pathname)&&!url.search&&!url.hash&&!url.username&&!url.password,'route',404);
   need(origin===null||allowedOrigin,'origin-denied',403);
   if(request.method==='OPTIONS'){
    need(allowedOrigin&&request.headers.get('access-control-request-method')==='POST','preflight',403);
    const wanted=(request.headers.get('access-control-request-headers')||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
    need(wanted.every(x=>x==='authorization'||x==='content-type'),'preflight',403);
    return response(null,204);
   }
   need(request.method==='POST','method',405);checkBodyHeaders(request.headers);
   need(!request.signal.aborted,'cancelled',408);
   controller=new AbortController();let rejectStop;const stopped=new Promise((_,reject)=>{rejectStop=reject;});
   abort=()=>{controller.abort();rejectStop(new JournalError('cancelled',408));};
   request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)abort();
   const started=performance.now();const remaining=()=>{const n=config.deadlineMs-(performance.now()-started);need(n>0,'deadline',504);need(!controller.signal.aborted,'cancelled',408);return n;};
   timer=setTimeout(()=>{rejectStop(new JournalError('deadline',504));controller.abort();},config.deadlineMs);
   const operation=(async()=>{
    const hash=await tokenHash(request);remaining();
    const raw=await readWire(request.body,{signal:controller.signal,timeoutMs:remaining()});
    const payload=parseProtocolWire(route,raw).value;validateRequest(route,payload);remaining();
    const body='{"p_token_hash":'+JSON.stringify(hash)+',"p_payload":'+raw+'}';
    upstream=await config.fetchImpl(config.supabaseUrl+'/rest/v1/rpc/'+ROUTES[route],{
     method:'POST',headers:{'authorization':'Bearer '+config.serviceKey,'apikey':config.serviceKey,'content-type':'application/json; charset=utf-8','accept':'application/json','accept-encoding':'identity'},
     body,signal:controller.signal,redirect:'error',cache:'no-store'
    });
    // A deliberately uncooperative injected fetch may resolve after the outer
    // timeout; dispose that late body without creating any response/ACK.
    if(controller.signal.aborted)cancelBody(upstream);
    remaining();need(upstream instanceof Response&&!upstream.redirected,'upstream-response',502);checkBodyHeaders(upstream.headers,{upstream:true});
    let replyRaw;try{replyRaw=await readWire(upstream.body,{signal:controller.signal,timeoutMs:remaining()});}catch(error){
     if(error instanceof JournalError&&[408,504].includes(error.status))throw error;
     throw new JournalError('invalid-upstream',502);
    }remaining();
    if(upstream.status!==200){
     let mapping;try{const error=parseWire(replyRaw).value;if(error&&typeof error==='object'&&!Array.isArray(error)&&typeof error.code==='string')mapping=SQL_ERRORS[error.code];}catch{}
     const [status,code]=mapping||[502,'upstream-rejected'];throw new JournalError(code,status);
    }
    try{const data=parseProtocolWire(route,replyRaw,{reply:true}).value;validateReply(route,payload,data);}catch{throw new JournalError('invalid-upstream',502);}
    remaining();return response(replyRaw,200);
   })();
   operation.catch(()=>{});return await Promise.race([operation,stopped]);
  }catch(error){
   // Neither upstream SQL diagnostics nor thrown fetch messages reach students.
   if(error instanceof JournalError)return failure(error.code,error.status);
   return failure('journal-unavailable',502);
  }finally{
   clearTimeout(timer);if(abort)request.signal.removeEventListener('abort',abort);controller?.abort();cancelBody(upstream);
  }
 };
}
