// Raw wire syntax/size guard. The original text is retained for PostgREST;
// parsed numeric projections are never serialized into the SQL request.
export const MAX_BYTES=1048576;
export class JournalError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
export const need=(condition,code,status=400)=>{if(!condition)throw new JournalError(code,status);};
const forbidden=new Set(['__proto__','prototype','constructor','token','access_token','refresh_token','authorization','serviceKey','service_key','password']);
function validString(value){
 for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);need(c!==0,'invalid-unicode');if(c>=0xd800&&c<=0xdbff){const next=value.charCodeAt(++i);need(next>=0xdc00&&next<=0xdfff,'invalid-unicode');}else need(c<0xdc00||c>0xdfff,'invalid-unicode');}return value;
}
export function parseWire(raw,{maxBytes=MAX_BYTES,maxDepth=24,maxNodes=100000}={}){
 need(typeof raw==='string'&&new TextEncoder().encode(raw).length<=maxBytes,'wire-limit',413);
 let i=0,nodes=0;const numbers=[];const ws=()=>{while(raw[i]===' '||raw[i]==='\n'||raw[i]==='\r'||raw[i]==='\t')i++;};
 function string(){const start=i;need(raw[i++]==='"','invalid-json');let escape=false;
  while(i<raw.length){const c=raw[i++];if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c==='"'){try{return validString(JSON.parse(raw.slice(start,i)));}catch(e){if(e instanceof JournalError)throw e;throw new JournalError('invalid-json');}}need(c.charCodeAt(0)>=32,'invalid-json');}throw new JournalError('invalid-json');
 }
 function value(depth,path){need(depth<=maxDepth&&++nodes<=maxNodes,'structure-limit',413);ws();const c=raw[i];
  if(c==='"'){string();return;}
  if(c==='{'){i++;ws();const keys=new Set();if(raw[i]==='}'){i++;return;}for(;;){ws();const key=string();need(!keys.has(key),'duplicate-key');need(!forbidden.has(key),'forbidden-field');keys.add(key);ws();need(raw[i++]===':','invalid-json');value(depth+1,[...path,key]);ws();if(raw[i]==='}'){i++;return;}need(raw[i++ ]===',','invalid-json');}}
  if(c==='['){i++;ws();if(raw[i]===']'){i++;return;}let index=0;for(;;){value(depth+1,[...path,index++]);ws();if(raw[i]===']'){i++;return;}need(raw[i++]===',','invalid-json');}}
  const literal=/^(?:true|false|null)/.exec(raw.slice(i));if(literal){i+=literal[0].length;return;}
  const number=/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(raw.slice(i));need(number,'invalid-json');i+=number[0].length;numbers.push({path,lexeme:number[0]});
 }
 value(1,[]);ws();need(i===raw.length,'invalid-json');let parsed;try{parsed=JSON.parse(raw);}catch{throw new JournalError('invalid-json');}
 return {raw,value:parsed,nodes,numbers};
}
export async function readWire(body,{signal,maxBytes=MAX_BYTES,timeoutMs=10000}={}){
 need(!signal?.aborted,'cancelled',408);need(Number.isFinite(timeoutMs)&&timeoutMs>0,'deadline',504);
 const reader=body?.getReader();need(reader,'empty-body');let timer,total=0,stopped=false,rejectStop;const parts=[];
 const started=performance.now();const check=()=>{need(performance.now()-started<timeoutMs,'deadline',504);need(!stopped,'cancelled',408);};
 const stop=(code='cancelled',status=408)=>{stopped=true;rejectStop?.(new JournalError(code,status));try{void reader.cancel().catch(()=>{});}catch{}};
 const abort=()=>stop();const interrupted=new Promise((_,reject)=>{rejectStop=reject;});signal?.addEventListener('abort',abort,{once:true});
 // Register before reading, then close the already-aborted race as well.
 if(signal?.aborted)abort();
 const operation=(async()=>{for(;;){check();const {done,value}=await reader.read();check();if(done)break;need(value instanceof Uint8Array,'invalid-chunk');total+=value.byteLength;need(total<=maxBytes,'wire-limit',413);if(value.byteLength)parts.push(value.slice());}
  const all=new Uint8Array(total);let offset=0;for(const part of parts){all.set(part,offset);offset+=part.length;}try{let raw;try{raw=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(all);}catch{throw new JournalError('invalid-utf8');}check();return raw;}finally{all.fill(0);}})();operation.catch(()=>{});
 timer=setTimeout(()=>stop('deadline',504),timeoutMs);
 try{return await Promise.race([operation,interrupted]);}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);stop();parts.forEach(x=>x.fill(0));try{reader.releaseLock();}catch{}}
}
