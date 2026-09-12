// Isolated current-session adapter. No default client, store open, or adoption.
import {MAX_BYTES,readWire} from './journal/wire.mjs';
import {parseProtocolWire,validateRequest,validateReply} from './journal/contract.mjs';

export const BRIDGE_CONTRACT='echs.current-session-journal-bridge.v1';
const CANONICAL_KEYS=['kind','organization_id','account_id','role','status','expires_at','session_id','epoch'];
const OWNER_KEYS=[...CANONICAL_KEYS,'incarnation_id','adoption_epoch','revoked'];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const JSON_TYPE=/^application\/json(?:\s*;\s*charset=utf-8)?$/i;
const WAIT_MS=10000;
const signalAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
const addEvent=EventTarget.prototype.addEventListener,removeEvent=EventTarget.prototype.removeEventListener;
const CODES=new Set(['invalid_input','owner_unavailable','owner_changed','configuration_unavailable','disposed','shared_deadline','verification_failed','cancelled','request_deadline','invalid_request','request_owner','not_ready','request_failed','invalid_response','state_unavailable','state_owner','authority_unavailable','initialization_failed']);
export class CurrentSessionJournalError extends Error{
 constructor(code){code=CODES.has(code)?code:'invalid_input';super('Current-session journal unavailable: '+code);this.name='CurrentSessionJournalError';this.code=code;}
}
const fail=code=>{throw new CurrentSessionJournalError(code)};
function isAborted(signal){try{if(!(signal instanceof AbortSignal))fail('invalid_input');return signalAborted.call(signal)}catch{fail('invalid_input')}}
const listenAbort=(signal,listener)=>addEvent.call(signal,'abort',listener,{once:true});
const unlistenAbort=(signal,listener)=>removeEvent.call(signal,'abort',listener);
function safeCode(error,fallback){try{const d=Object.getOwnPropertyDescriptor(error,'code');return error instanceof CurrentSessionJournalError&&d&&Object.hasOwn(d,'value')&&CODES.has(d.value)?d.value:fallback}catch{return fallback}}
function data(value,keys,exact=true){
 try{
 if(!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('invalid_input');
 const descriptors=Object.getOwnPropertyDescriptors(value),names=Reflect.ownKeys(value);
 if(exact&&(names.length!==keys.length||names.some(key=>!keys.includes(key))))fail('invalid_input');
 const out={};for(const key of keys){const d=descriptors[key];if(!d||!Object.hasOwn(d,'value'))fail('invalid_input');out[key]=d.value;}return out;
 }catch{fail('invalid_input')}
}
function canonicalIdentity(value){
 const row=data(value,CANONICAL_KEYS);
 if(row.kind!=='account'||typeof row.organization_id!=='string'||!UUID.test(row.organization_id)||typeof row.account_id!=='string'||!UUID.test(row.account_id)||row.role!=='student'||row.status!=='active'||
  !Number.isSafeInteger(row.expires_at)||row.expires_at<=Date.now()||!Number.isSafeInteger(row.epoch)||row.epoch<0||
  typeof row.session_id!=='string'||! /^[A-Za-z0-9_-]{16,128}$/.test(row.session_id))fail('owner_unavailable');
 return Object.freeze(row);
}
const same=(a,b,keys)=>keys.every(key=>a[key]===b[key]);
function cancelBody(response){try{void response?.body?.cancel().catch(()=>{})}catch{}}
function endpoint(value){
 const cfg=data(value,['enabled','api_base'],false);
 if(Object.hasOwn(value,'configuration_error'))fail('configuration_unavailable');
 if(cfg.enabled!==true||typeof cfg.api_base!=='string'||cfg.api_base.length>2048||/[?#]/.test(cfg.api_base))fail('configuration_unavailable');
 let url;try{url=new URL(cfg.api_base)}catch{fail('configuration_unavailable')}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['/functions/v1','/functions/v1/'].includes(url.pathname)||
  cfg.api_base!==url.href)fail('configuration_unavailable');
 return url.origin+'/functions/v1';
}

/** Canonical shared work is only waited on; owned native requests are cancelled. */
export async function createCurrentSessionJournalBridge(options){
 let selected,externalSignal,selectedFetch;
 try{
  selected=data(options,['institution'],false);
  const names=Reflect.ownKeys(options);if(names.some(name=>!['institution','signal','fetchImpl'].includes(name)))fail('invalid_input');
  const optional=key=>Object.hasOwn(options,key)?data(options,[key],false)[key]:undefined;
  externalSignal=optional('signal')??null;selectedFetch=optional('fetchImpl');
 }catch{fail('invalid_input')}
 const fetchImpl=selectedFetch===undefined?globalThis.fetch:selectedFetch;
 if(externalSignal!==null)isAborted(externalSignal);if(typeof fetchImpl!=='function')fail('invalid_input');
 const institution=data(selected.institution,['ownerAuthority','config','token'],false);
 const canonical=data(institution.ownerAuthority,['capture','verify','subscribe']);
 if([...Object.values(canonical),institution.config,institution.token].some(fn=>typeof fn!=='function'))fail('invalid_input');
 let original=null,owner=null,base=null,token=null,reason=null,unsubscribe=null,expiryTimer=null;
 const controller=new AbortController(),listeners=new Set(),requests=new Set();
 function stop(code){
  if(reason)return;reason=code;token=null;clearTimeout(expiryTimer);expiryTimer=null;
  const unlisten=unsubscribe;unsubscribe=null;try{unlisten?.()}catch{}
  if(externalSignal)unlistenAbort(externalSignal,externalAbort);
  controller.abort(new CurrentSessionJournalError(code));
  for(const request of [...requests])request.end(code);
  const callbacks=[...listeners];listeners.clear();
  for(const callback of callbacks){try{callback(Object.freeze({code}))}catch{}}
 }
 const externalAbort=()=>stop('disposed');
 function alive(){if(reason)fail(reason)}
 function current(){
  alive();let captured;
  try{captured=canonicalIdentity(canonical.capture.call(institution.ownerAuthority))}catch{stop('owner_changed');fail('owner_changed')}
  alive();if(!original||!same(captured,original,CANONICAL_KEYS)){stop('owner_changed');fail('owner_changed')}
  return original;
 }
 function armExpiry(){
  alive();const left=original.expires_at-Date.now();if(left<=0){stop('owner_changed');fail('owner_changed')}
  expiryTimer=setTimeout(()=>{try{current();armExpiry()}catch{}},Math.min(left,60000));
 }
 async function shared(call){
  current();const started=performance.now();let pending;
  try{pending=Promise.resolve(call());pending.catch(()=>{});current()}catch(error){if(pending)pending.catch(()=>{});throw error}
  let timer,abort;
  const ended=new Promise((_,reject)=>{
   abort=()=>reject(new CurrentSessionJournalError(reason||'disposed'));
   controller.signal.addEventListener('abort',abort,{once:true});if(controller.signal.aborted)abort();
   timer=setTimeout(()=>reject(new CurrentSessionJournalError('shared_deadline')),WAIT_MS);
  });
  try{const value=await Promise.race([pending,ended]);current();if(performance.now()-started>=WAIT_MS)fail('shared_deadline');return value}
  finally{clearTimeout(timer);controller.signal.removeEventListener('abort',abort)}
 }
 async function verifyCanonical(){
  const proof=data(await shared(()=>canonical.verify.call(institution.ownerAuthority,original)),['contract','verified','identity']);
  const verified=canonicalIdentity(proof.identity);current();
  if(proof.contract!=='echs.owner-authority.v1'||proof.verified!==true||!same(verified,original,CANONICAL_KEYS))fail('verification_failed');
 }
 function freshToken(){
  current();const value=institution.token.call(selected.institution);current();
  if(typeof value!=='string'||! /^[\x21-\x7e]{1,4096}$/.test(value)||token!==null&&value!==token){stop('owner_changed');fail('owner_changed')}
  return value;
 }
 function ticket(signal){
  current();if(isAborted(signal))fail('cancelled');
  const owned=new AbortController(),deadline=performance.now()+WAIT_MS;let timer,closed=false,rejectStop,response;
  const stopped=new Promise((_,reject)=>{rejectStop=reject});stopped.catch(()=>{});
  const end=code=>{
   if(closed)return;closed=true;clearTimeout(timer);unlistenAbort(signal,abort);controller.signal.removeEventListener('abort',abort);
   requests.delete(item);owned.abort(new CurrentSessionJournalError(code));cancelBody(response);rejectStop(new CurrentSessionJournalError(code));
  };
  const abort=()=>end(reason||'cancelled');
  const item={end,signal:owned.signal,stopped,attach(value){response=value;if(closed)cancelBody(value)},check(){current();if(performance.now()>=deadline){end('request_deadline');fail('request_deadline')}if(closed)fail('cancelled')}};
  requests.add(item);
  try{
   listenAbort(signal,abort);controller.signal.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>end('request_deadline'),WAIT_MS);if(isAborted(signal)||controller.signal.aborted)abort();
  }catch{end('invalid_input');fail('invalid_input')}
  return item;
 }
 async function raw(route,requestRaw,signal,discovery=false){
  current();if(!['state','heads','operation','apply'].includes(route)||typeof requestRaw!=='string')fail('invalid_request');
  let request;
  try{request=parseProtocolWire(route,requestRaw).value;validateRequest(route,request)}catch{fail('invalid_request')}
  current();if(route==='state'){if(requestRaw!=='{}')fail('invalid_request')}
  else if(!owner||request.incarnation_id!==owner.incarnation_id||request.adoption_epoch!==owner.adoption_epoch)fail('request_owner');
  if(!discovery&&!owner)fail('not_ready');
  let owned;try{owned=ticket(signal)}catch(error){fail(safeCode(error,'invalid_input'))}
  try{
   const currentToken=freshToken();owned.check();
   // All endpoint/body/header values are private immutable primitives. Request
   // construction is followed by a capture check before native dispatch.
   const nativeRequest=new Request(base+'/learning-journal/'+route,{method:'POST',headers:{'authorization':'Bearer '+currentToken,'content-type':'application/json; charset=utf-8','accept':'application/json'},body:requestRaw,signal:owned.signal,redirect:'error',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
   owned.check();let pending;
   try{pending=Promise.resolve(fetchImpl(nativeRequest))}catch{fail('request_failed')}
   const received=pending.then(response=>{owned.attach(response);owned.check();return response});received.catch(()=>{});
   owned.check();const response=await Promise.race([received,owned.stopped]);owned.check();
   if(!(response instanceof Response)||response.redirected)fail('invalid_response');
   owned.check();return response;
  }catch(error){owned.end('request_failed');fail(safeCode(error,'request_failed'))}
  // A successful native Response keeps its controller and deadline until the
  // caller aborts after body consumption (as both unchanged T3 ports do).
 }
 async function state(){
  const reading=new AbortController(),started=performance.now();let response;
  const cancel=()=>reading.abort();controller.signal.addEventListener('abort',cancel,{once:true});if(controller.signal.aborted)cancel();
  const timer=setTimeout(cancel,WAIT_MS);
  try{
   response=await raw('state','{}',reading.signal,true);current();
   if(response.status!==200||!JSON_TYPE.test(response.headers.get('content-type')||'')||response.headers.has('content-encoding')&&response.headers.get('content-encoding')!=='identity')fail('state_unavailable');
   const length=response.headers.get('content-length');if(length!==null&&(!/^(0|[1-9][0-9]*)$/.test(length)||Number(length)>MAX_BYTES))fail('state_unavailable');
   const remaining=WAIT_MS-(performance.now()-started);if(remaining<=0)fail('request_deadline');
   const replyRaw=await readWire(response.body,{signal:reading.signal,timeoutMs:remaining});current();
   let value;try{value=parseProtocolWire('state',replyRaw,{reply:true}).value;validateReply('state',{},value)}catch{fail('state_unavailable')}
   current();if(value.organization_id!==original.organization_id||value.account_id!==original.account_id)fail('state_owner');
   if(owner&&(value.incarnation_id!==owner.incarnation_id||value.adoption_epoch!==owner.adoption_epoch))fail('owner_changed');
   return value;
  }finally{clearTimeout(timer);controller.signal.removeEventListener('abort',cancel);reading.abort();cancelBody(response)}
 }
 const authority=Object.freeze({
  capture(){current();if(!owner)fail('not_ready');return owner},
  async verify(captured){
   try{
    current();const input=data(captured,OWNER_KEYS);if(!owner||!same(input,owner,OWNER_KEYS))fail('owner_changed');current();
    await verifyCanonical();current();await state();current();
    return Object.freeze({contract:'echs.journal-owner-authority.v1',verified:true,identity:owner});
   }catch(error){stop(safeCode(error,'verification_failed'));fail(reason)}
  },
  subscribe(listener){current();if(typeof listener!=='function')fail('invalid_input');listeners.add(listener);current();return()=>listeners.delete(listener)}
 });
 const port=(routes)=>Object.freeze({[routes.includes('apply')?'deliver':'read']:async input=>{
  const values=data(input,['route','requestRaw','signal']);current();if(!routes.includes(values.route))fail('invalid_request');
  return raw(values.route,values.requestRaw,values.signal);
 }});
 try{
  // This subscription precedes capture and every asynchronous operation. An
  // initial canonical capture may establish its first epoch synchronously.
  unsubscribe=canonical.subscribe.call(institution.ownerAuthority,()=>{if(original)stop('owner_changed')});
  if(typeof unsubscribe!=='function')fail('authority_unavailable');
  if(reason){const cleanup=unsubscribe;unsubscribe=null;cleanup();alive()}
  if(externalSignal){listenAbort(externalSignal,externalAbort);if(isAborted(externalSignal))externalAbort()}alive();
  original=canonicalIdentity(canonical.capture.call(institution.ownerAuthority));current();token=freshToken();armExpiry();
  await verifyCanonical();current();
  const configuration=await shared(()=>institution.config.call(selected.institution));base=endpoint(configuration);current();freshToken();
  const observed=await state();current();
  owner=Object.freeze({...original,incarnation_id:observed.incarnation_id,adoption_epoch:observed.adoption_epoch,revoked:false});current();
  return Object.freeze({contract:BRIDGE_CONTRACT,authority,observationPort:port(['state','heads','operation']),deliveryPort:port(['apply']),signal:controller.signal,dispose:()=>stop('disposed')});
 }catch(error){stop(safeCode(error,'initialization_failed'));fail(reason)}
}
