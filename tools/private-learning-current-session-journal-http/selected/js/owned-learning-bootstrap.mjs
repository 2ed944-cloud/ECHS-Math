// Isolated current-session controller. No active entry or cloud adoption.
import {openOwnedLearningStore,ENGINE_CONTRACT,SyncJournalError} from './owned-learning-store.mjs';
import {MUTATIONS,QUERIES} from '../question-bank/js/learning-transition.mjs';
import {createHeldLearningTransport} from './owned-learning-transport.mjs';
import {createCurrentSessionJournalBridge} from './current-session-journal-bridge.mjs';

export function createOwnedLearning({institution,onChange=()=>{},onEffects=()=>{},events=globalThis,
  documentEvents=globalThis.document,channelFactory=name=>typeof BroadcastChannel==='function'?new BroadcastChannel(name):null,...storeOptions}={}){
  if(typeof onChange!=='function'||typeof onEffects!=='function'||typeof channelFactory!=='function')throw new TypeError('Invalid controller callbacks');
  let active=null,opening=null,generation=0,disposed=false,status='initializing',code=null,channel=null,notification=0;
  const listeners=new Set(),lifetime=new AbortController();
  const fail=reason=>{throw new SyncJournalError(reason)};
  const ownership=()=>Object.freeze({contract:ENGINE_CONTRACT,status,generation,revision:active?.revision??null,error:code,sync:Object.freeze({status:'held',reason:'versioned_sync_required'})});
  function notify(){const ticket=++notification,state=ownership();try{onChange(state)}catch{}for(const fn of [...listeners]){if(ticket!==notification)break;try{fn(state)}catch{}}}
  function guardOwner(entry){if(disposed)fail('disposed');if(!entry||active!==entry||entry.ticket!==generation)fail('owner_changed');entry.store.binding();return entry}
  function guard(entry){guardOwner(entry);if(entry.stale)fail('projection_stale');return entry}
  function announce(entry){
    guardOwner(entry);const owner=entry.store.binding();
    try{channel?.postMessage({contract:ENGINE_CONTRACT,organization_id:owner.organization_id,account_id:owner.account_id,
      incarnation_id:owner.incarnation_id,adoption_epoch:owner.adoption_epoch,revision:entry.revision})}catch{}
  }
  async function refresh(entry){
    if(disposed||!entry||active!==entry||entry.ticket!==generation)fail('owner_changed');entry.store.binding();
    if(entry.refreshing)return entry.refreshing;
    entry.stale=true;status='refreshing';
    const task=Promise.resolve().then(async()=>{try{
      const view=await entry.store.refresh();
      if(disposed||active!==entry||entry.ticket!==generation)fail('owner_changed');entry.store.binding();
      entry.revision=view.revision;entry.stale=false;status='ready';code=null;notify();guard(entry);return ownership();
    }catch(error){if(!disposed&&active===entry){status='unavailable';code=error.code||'storage_error';notify()}throw error}
    finally{if(entry.refreshing===task)entry.refreshing=null}});
    entry.refreshing=task;notify();return task;
  }
  function makeHandle(entry){
    const perform=async intent=>{
      guard(entry);const receipt=await entry.store.commit(intent);guardOwner(entry);entry.revision=entry.store.projection().revision;
      // A concurrent same-owner view refresh cannot undo this known commit or
      // hide its retry identity. Private callbacks still require the same owner.
      notify();guardOwner(entry);announce(entry);guardOwner(entry);
      if(!receipt.duplicate&&receipt.effects.length){try{onEffects(receipt.effects)}catch{}}
      guardOwner(entry);return receipt;
    };
    const handle={contract:ENGINE_CONTRACT,signal:entry.store.signal,binding:()=>{guard(entry);return entry.store.binding()},
      prepare(method,args=[]){guard(entry);return entry.store.prepare(method,args)},commit:perform,
      refresh:()=>refresh(entry),snapshot:()=>{guard(entry);return entry.store.projection()},
      async lookup(id){guard(entry);const result=await entry.store.lookup(id);guard(entry);return result},
      async pending(options){guard(entry);const result=await entry.store.snapshot(options);guard(entry);return result},
      releasePending(sent){guard(entry);entry.store.releaseSnapshot(sent)},
      query(method,args=[],options={}){guard(entry);return entry.store.query(method,args,options)},
      async installRemoteContext(options){guard(entry);const result=await entry.store.installRemoteContext(options);guard(entry);return result},
      async materializeNext(){guard(entry);const result=await entry.store.materializeNext();guard(entry);return result},
      async deliverNext(options){guard(entry);const result=await entry.store.deliverNext(options);guard(entry);return result},
    };
    for(const method of QUERIES)handle[method]=(...args)=>handle.query(method,args);
    for(const method of MUTATIONS.filter(name=>name!=='initialize'))handle[method]=(...args)=>perform(handle.prepare(method,args));
    handle.practice=flow=>perform(handle.prepare('practice',[flow]));
    handle.sync=createHeldLearningTransport({assertCurrent:()=>guard(entry)}).send;
    return Object.freeze(handle);
  }
  async function ready(){
    if(disposed)fail('disposed');
    if(active){const entry=active;if(entry.stale)await refresh(entry);guard(entry);return entry.handle}
    if(opening)return opening.promise;
    const entry={ticket:++generation,promise:null};opening=entry;status='initializing';code=null;
    entry.promise=Promise.resolve().then(async()=>{
      let store,bridge;
      try{
        if(disposed||generation!==entry.ticket)fail('owner_changed');
        bridge=await createCurrentSessionJournalBridge({institution,signal:lifetime.signal});
        entry.bridge=bridge;
        if(disposed||generation!==entry.ticket)fail('owner_changed');
        bridge.authority.capture();
        store=await openOwnedLearningStore({...storeOptions,authority:bridge.authority,externalSignal:bridge.signal,
          observationPort:bridge.observationPort,deliveryPort:bridge.deliveryPort,onInvalidate:reason=>{
          if(disposed||generation!==entry.ticket)return;
          active=null;generation++;status='invalidated';code=reason.code;
          // Invalidate before callbacks or bridge disposal can reenter ready().
          bridge.dispose();notify();
        }});
        if(disposed||generation!==entry.ticket)fail('owner_changed');
        // Opening observes existing data only. No initialize command, legacy
        // import, remote context installation or delivery is implicit in ready().
        store.binding();const next={store,bridge,ticket:entry.ticket,revision:store.projection().revision,stale:false,refreshing:null,handle:null};
        next.handle=makeHandle(next);active=next;status='ready';code=null;notify();guard(next);return next.handle;
      }catch(error){store?.dispose();bridge?.dispose();if(!disposed&&!active&&generation===entry.ticket){status='unavailable';code=error.code||'unavailable';notify()}throw error}
      finally{if(opening===entry)opening=null}
    });
    // Publish the shared promise before callbacks can synchronously reenter ready().
    notify();return entry.promise;
  }
  function refreshCurrent(){const found=active;if(found)refresh(found).catch(()=>{})}
  function visible(){if(documentEvents?.visibilityState!=='hidden')refreshCurrent()}
  try{channel=channelFactory('echs-owned-learning-journal-notify-v1');if(channel)channel.onmessage=event=>{
    try{
      const value=event.data,entry=active;if(!entry||disposed||!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return;
      const names=['contract','organization_id','account_id','incarnation_id','adoption_epoch','revision'];
      const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(value);
      if(keys.length!==names.length||keys.some(key=>!names.includes(key))||names.some(key=>!descriptors[key]||!Object.hasOwn(descriptors[key],'value')))return;
      const data=Object.fromEntries(names.map(key=>[key,descriptors[key].value]));
      if(data.contract!==ENGINE_CONTRACT||!Number.isSafeInteger(data.revision)||data.revision<1)return;
      guardOwner(entry);const owner=entry.store.binding();
      if(['organization_id','account_id','incarnation_id','adoption_epoch'].some(key=>data[key]!==owner[key])||data.revision<=entry.revision)return;
      refresh(entry).catch(()=>{});
    }catch{}
  }}catch{}
  events?.addEventListener?.('focus',refreshCurrent);documentEvents?.addEventListener?.('visibilitychange',visible);
  return Object.freeze({contract:ENGINE_CONTRACT,ready,ownership,
    capture(){guard(active);return active.handle},
    subscribe(listener){if(typeof listener!=='function')throw new TypeError('Listener required');if(disposed)fail('disposed');listeners.add(listener);return()=>listeners.delete(listener)},
    dispose(){if(disposed)return;disposed=true;generation++;const prior=active;active=null;status='disposed';code='disposed';lifetime.abort();prior?.store.dispose();prior?.bridge.dispose();opening?.bridge?.dispose();
      events?.removeEventListener?.('focus',refreshCurrent);documentEvents?.removeEventListener?.('visibilitychange',visible);try{channel?.close()}catch{}channel=null;notify();listeners.clear();onChange=()=>{};onEffects=()=>{};
    },
  });
}
