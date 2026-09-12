// Private synthetic /me and config fixture. No production account API or SQL.
const CONFIG='/source/config/institution.json',ME='/functions/v1/account-api/me';
const TOKEN=/^synthetic-journal-http-[a-f0-9]{32}$/;
const UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const ACCOUNT_KEYS=['id','organization_id','role','status','expires_at'];
const fail=()=>{throw new Error('session-fixture-input')};
function data(value,keys){
 try{
  if(!value||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==keys.length)fail();
  const result={};for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!Object.hasOwn(descriptor,'value'))fail();result[key]=descriptor.value;}return result;
 }catch{fail()}
}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
export const SESSION_PATHS=Object.freeze({config:CONFIG,me:ME});
export function createSessionFixture(options){
 const {origin}=data(options,['origin']);let target;
 try{target=new URL(origin)}catch{fail()}
 if(typeof origin!=='string'||target.origin!==origin||target.protocol!=='https:'||target.hostname!=='127.0.0.1'||! /^\d+$/.test(target.port)||Number(target.port)<1||target.pathname!=='/'||target.search||target.hash||target.username||target.password)fail();
 const profiles=new Map();let closed=false;
 const active=()=>{if(closed)throw new Error('session-fixture-closed')};
 function register(value){
  active();const row=data(value,['token','account']),account=data(row.account,ACCOUNT_KEYS);
  if(typeof row.token!=='string'||!TOKEN.test(row.token)||profiles.has(row.token)||profiles.size>=80||
   typeof account.id!=='string'||!UUID.test(account.id)||typeof account.organization_id!=='string'||!UUID.test(account.organization_id)||
   !['student','teacher','parent','admin'].includes(account.role)||account.status!=='active'||typeof account.expires_at!=='string'||
   ! /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(account.expires_at)||!Number.isFinite(Date.parse(account.expires_at))||
   new Date(account.expires_at).toISOString()!==account.expires_at||Date.parse(account.expires_at)<=Date.now()||Date.parse(account.expires_at)>Date.now()+3600000)fail();
  active();profiles.set(row.token,Object.freeze(account));
 }
 function response(request){
  try{
  active();if(!(request instanceof Request))fail();let url;
  try{url=new URL(request.url)}catch{fail()}
  if(url.origin!==origin||url.search||url.hash||url.username||url.password)fail();
  if(![CONFIG,ME].includes(url.pathname))return null;
  if(request.method!=='GET')return json({ok:false,error:{code:'fixture-method'}},405);
  if(url.pathname===CONFIG)return json({enabled:true,api_base:origin+'/functions/v1'});
  const auth=request.headers.get('authorization')||'';
  const found=/^Bearer (synthetic-journal-http-[a-f0-9]{32})$/.exec(auth),account=found?profiles.get(found[1]):null;
  if(!account||Date.parse(account.expires_at)<=Date.now())return json({ok:false,error:{code:'fixture-session'}},401);
  return json({ok:true,account});
  }catch{fail()}
 }
 return Object.freeze({register,response,close(){if(closed)return;closed=true;profiles.clear()}});
}
