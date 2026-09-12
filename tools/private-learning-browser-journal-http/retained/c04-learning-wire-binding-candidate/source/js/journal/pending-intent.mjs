import {need} from './wire.mjs';
import {CONTRACT,closed,canonical,parseProtocolWire,validateRequest,validateReply} from './contract.mjs';

const PENDING='echs.learning.pending-intent.v1';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function owner(value){closed(value,['organization_id','account_id','incarnation_id','adoption_epoch']);for(const key of ['organization_id','account_id','incarnation_id'])need(typeof value[key]==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value[key]),'owner');need(value.adoption_epoch===1,'owner');return value;}
function apply(raw){const value=parseProtocolWire('apply',raw).value;validateRequest('apply',value);return value;}
function pending(value){
 closed(value,['contract','owner','raw','state','receipt']);need(value.contract===PENDING&&['pending','acknowledged'].includes(value.state),'pending-intent');owner(value.owner);
 const request=apply(value.raw);need(request.incarnation_id===value.owner.incarnation_id&&request.adoption_epoch===value.owner.adoption_epoch,'intent-binding');
 need(value.state==='pending'?value.receipt===null:typeof value.receipt==='string','intent-receipt');return request;
}

// Pure data constructor. A future browser adapter MUST durably store this exact
// raw intent before sending and atomically persist an accepted transition.
export function createPendingIntent(raw,activeOwner){
 const result={contract:PENDING,owner:{...owner(activeOwner)},raw,state:'pending',receipt:null};pending(result);return freeze(result);
}
export function operationLookup(intent){const request=pending(intent);return JSON.stringify({contract:CONTRACT,incarnation_id:request.incarnation_id,adoption_epoch:request.adoption_epoch,operation_id:request.operation_id});}

// No network, database, IndexedDB or mutation: failed/ambiguous delivery returns
// the very same intent object. A 200 response proposes a transition only after
// binding checks; callers still have to commit that transition durably.
export function acknowledgeIntent(intent,{route,requestRaw,status,replyRaw,activeOwner}){
 try{
  const original=pending(intent);owner(activeOwner);need(canonical(activeOwner)===canonical(intent.owner),'owner-changed');
  need(status===200,'not-ack');need(route==='apply'||route==='operation','ack-route');
  need(requestRaw===(route==='apply'?intent.raw:operationLookup(intent)),'sent-intent-changed');
  const request=parseProtocolWire(route,requestRaw).value;validateRequest(route,request);
  const data=parseProtocolWire(route,replyRaw,{reply:true}).value;
  const expectedReceipt=intent.receipt===null?null:parseProtocolWire('apply',intent.receipt,{reply:true}).value;
  validateReply(route,request,data,{intent:original,expectedReceipt});
  need(route==='apply'||data.found===true,'operation-unknown');
  // Lookup carries identity, not the original opaque values. A first receipt
  // cannot establish their equality from a PostgreSQL-normalized hash alone.
  // Recover a lost ACK by replaying the exact raw apply intent; SQL then checks
  // the stored normalized request before returning its immutable receipt.
  need(route==='apply'||intent.state==='acknowledged','apply-replay-required');
  if(intent.state==='acknowledged')return {intent,acknowledged:true,reason:'already-acknowledged'};
  return {intent:freeze({...intent,state:'acknowledged',receipt:canonical(data.receipt)}),acknowledged:true,reason:'receipt-validated'};
 }catch{return {intent,acknowledged:false,reason:'pending-retained'};}
}
