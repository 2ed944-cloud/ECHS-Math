// Deliberate P1 hold. No fetch, status fabrication, queue deletion or legacy upload.
export function createHeldLearningTransport({assertCurrent}={}){
  if(typeof assertCurrent!=='function')throw new TypeError('Captured owner guard required');
  return Object.freeze({async send(){assertCurrent();return Object.freeze({status:'held',reason:'versioned_sync_required',uploaded:0,acknowledged:0})}});
}
