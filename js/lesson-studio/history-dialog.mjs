import {createHistorySession} from './history-session.mjs';
import {compareLessonVersions,renderVersionDiff} from './version-diff.mjs';
import {renderLessonPreview,disposeLessonPreview} from './preview.mjs';

const element=(doc,tag,text,attributes={})=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));return node;};
const versionDate=value=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString():'Date unavailable';
const project=value=>({document:value.document,private_notes:value.private_notes});
const CHECKS={curriculum:'Curriculum alignment checked',mathematics:'Mathematics and solutions checked',accessibility:'Accessibility checked',rights:'Publication rights checked',student_safe:'Student content contains no private material'};

/** Authenticated staff modal. All writes retain the existing server workflow. */
export function openHistoryDialog({dialog,client,record,isCurrent,mathEngine,resolveAsset}={}){
  if(!dialog?.ownerDocument||typeof dialog.showModal!=='function'||!client||typeof isCurrent!=='function')throw new TypeError('A verified staff history dialog is required.');
  const doc=dialog.ownerDocument,el=(tag,text,attrs)=>element(doc,tag,text,attrs);
  let controller=null,closed=false,resolveClose,diffView=null,diffKey='',mutationAttempted=false,operation=null,confirmation=null;
  const finished=new Promise(resolve=>{resolveClose=resolve;});
  const heading=el('h2','Version history',{id:'history-heading'}),closeButton=el('button','Back to editor',{id:'close-history',type:'button'});
  const top=el('div',undefined,{class:'dialog-heading'});top.append(heading,closeButton);
  const workflow=el('p','',{id:'history-workflow',role:'status'}),notice=el('p','Published versions keep their history. Restoring creates a new draft and leaves the current publication available.',{class:'field-help'});
  const deliveryNote=el('p','Publishing makes an approved version available for student delivery. This lesson’s current student page keeps its existing content until it is connected to the published version.',{class:'field-help'});
  const error=el('p','',{id:'history-error',role:'alert'}),status=el('p','',{id:'history-status',role:'status','aria-live':'polite'});
  const tools=el('div',undefined,{class:'history-actions'}),refreshButton=el('button','Refresh history',{id:'refresh-history',type:'button'}),checkButton=el('button','Check server state',{id:'check-history-state',type:'button'}),retryButton=el('button','Retry unchanged action',{id:'retry-history-action',type:'button'});
  const requestButton=el('button','Request review',{id:'request-lesson-review',type:'button'}),approveButton=el('button','Review and approve',{id:'approve-lesson-version',type:'button'}),publishButton=el('button','Publish approved version',{id:'publish-lesson-version',type:'button'}),withdrawButton=el('button','Withdraw publication',{id:'withdraw-lesson-publication',type:'button'});
  tools.append(refreshButton,checkButton,retryButton,requestButton,approveButton,publishButton,withdrawButton);
  const grid=el('div',undefined,{class:'history-grid'}),listPane=el('section',undefined,{'aria-label':'Saved versions'}),list=el('ol',undefined,{id:'history-versions'}),more=el('button','Load older versions',{id:'history-load-more',type:'button'});
  listPane.append(el('h3','Saved versions'),list,more);
  const detail=el('section',undefined,{'aria-labelledby':'history-selection-title'}),selectionTitle=el('h3','Select a version',{id:'history-selection-title'}),selectedActions=el('div',undefined,{class:'history-actions'});
  const restoreButton=el('button','Restore as new draft',{id:'restore-lesson-version',type:'button'}),previewButton=el('button','Preview selected version',{id:'preview-history-version',type:'button'}),hidePreview=el('button','Close version preview',{id:'close-history-preview',type:'button'});
  selectedActions.append(restoreButton,previewButton,hidePreview);
  const comparison=el('div',undefined,{id:'history-comparison'}),preview=el('div',undefined,{id:'history-version-preview'});preview.hidden=true;hidePreview.hidden=true;
  detail.append(selectionTitle,selectedActions,comparison,preview);grid.append(listPane,detail);
  const events=el('section',undefined,{'aria-labelledby':'history-events-heading'}),eventList=el('ol',undefined,{id:'history-events'});events.append(el('h3','Recent review and publication events',{id:'history-events-heading'}),eventList);
  const confirm=el('form',undefined,{id:'history-confirmation'});confirm.hidden=true;
  const confirmTitle=el('h3','',{id:'history-confirmation-title'}),confirmHelp=el('p','',{id:'history-confirmation-help'}),checkFields=el('fieldset'),checkLegend=el('legend','Independent review declarations');checkFields.append(checkLegend);
  const checkInputs={};for(const [name,label]of Object.entries(CHECKS)){const wrap=el('label',undefined,{class:'history-check'}),input=el('input',undefined,{type:'checkbox','data-review-check':name});checkInputs[name]=input;wrap.append(input,doc.createTextNode(label));checkFields.append(wrap);}
  const reasonLabel=el('label','',{for:'history-action-comment'}),reason=el('textarea','',{id:'history-action-comment',rows:3,maxlength:2000});
  const confirmButton=el('button','Confirm',{id:'confirm-history-action',type:'submit'}),cancelButton=el('button','Cancel',{id:'cancel-history-action',type:'button'});
  confirm.append(confirmTitle,confirmHelp,checkFields,reasonLabel,reason,confirmButton,cancelButton);
  dialog.replaceChildren(top,workflow,notice,deliveryNote,status,error,tools,confirm,grid,events);dialog.setAttribute('aria-labelledby','history-heading');

  function current(){if(closed)return false;try{if(isCurrent()===true){client.assertCurrent();return true;}}catch{}dispose();return false;}
  function hideVersionPreview(){disposeLessonPreview(preview);preview.replaceChildren();preview.hidden=true;hidePreview.hidden=true;}
  function cancelConfirmation(){confirmation=null;confirm.hidden=true;reason.value='';for(const input of Object.values(checkInputs))input.checked=false;}
  function clearPrivateDOM(){cancelConfirmation();for(const node of [...dialog.querySelectorAll('*')]){if('value'in node)node.value='';if('checked'in node)node.checked=false;node.replaceChildren();}dialog.replaceChildren();}
  function dispose(){if(closed)return;closed=true;controller?.dispose();diffView?.dispose();hideVersionPreview();dialog.removeEventListener('cancel',cancelEvent);if(dialog.open)dialog.close();clearPrivateDOM();record=null;confirmation=null;resolveClose(null);}
  function render(state){
    if(state.status==='disposed'){dispose();return;}
    if(!current()||!state.record)return;
    const active=['loading','selecting','acting'].includes(state.status),pending=Boolean(state.pending);
    const blocked=active||pending||state.status==='conflict';
    dialog.setAttribute('aria-busy',String(active));closeButton.disabled=active;
    for(const button of tools.querySelectorAll('button'))button.disabled=active;
    requestButton.disabled=blocked||state.record.lesson.workflow_state!=='draft';
    approveButton.disabled=blocked||!state.canApprove||state.selected?.version.id!==state.record.head.id;
    approveButton.textContent=`Review current version ${state.record.head.version_number}`;
    publishButton.disabled=blocked||state.record.lesson.workflow_state!=='approved';
    withdrawButton.disabled=blocked||!state.record.lesson.active_publication_id;
    checkButton.hidden=!pending;retryButton.hidden=state.status!=='retryable';
    refreshButton.textContent=pending?'Use current server state':'Refresh history';
    workflow.textContent=`Current version ${state.record.head.version_number} · ${state.record.lesson.workflow_state} · revision ${state.record.lesson.head_revision}${state.record.lesson.active_publication_id?' · Publication available':''}`;
    const states={ready:'History is up to date.',loading:'Reading version history…',selecting:'Reading saved version…',acting:'Applying the selected action…',uncertain:'The action result is unknown. Check the server before retrying.',retryable:'The server is unchanged. You may retry the same action.',conflict:'The server changed. Review its current state before choosing another action.',error:'History needs attention.'};
    status.textContent=states[state.status]||'';
    error.textContent=state.error?.message||'';
    if(state.record.lesson.workflow_state==='review'&&!state.canApprove&&!state.error)status.textContent+=' A different authorized staff member must review this version.';
    if(state.canApprove&&state.selected?.version.id!==state.record.head.id)status.textContent+=' Select the current saved version to preview and review it.';
    const focusId=doc.activeElement?.dataset?.versionId;
    list.replaceChildren(...state.versions.map(version=>{
      const row=el('li'),button=el('button',`Version ${version.version_number}${version.id===state.record.head.id?' · Current draft':''}`,{type:'button','data-version-id':version.id,'aria-current':String(state.selected?.version.id===version.id)});
      button.disabled=active;button.addEventListener('click',()=>{cancelConfirmation();void run(()=>controller.select(version.id));});
      row.append(button,el('small',versionDate(version.created_at)+(version.restored_from_version_id?' · Restored copy':'')));return row;
    }));
    if(focusId)list.querySelector(`[data-version-id="${focusId}"]`)?.focus();
    more.disabled=active||!state.nextBefore||state.historyLimitReached;more.hidden=!state.nextBefore;
    if(state.historyLimitReached)status.textContent+=' The history list has reached its display limit.';
    const selected=state.selected?.version;
    selectionTitle.textContent=selected?`Version ${selected.version_number} compared with current version ${state.record.head.version_number}`:'Select a saved version to compare';
    restoreButton.disabled=blocked||!selected||selected.id===state.record.head.id;previewButton.disabled=active||!selected;
    const key=selected?`${selected.id}/${state.record.head.id}`:'';
    if(key!==diffKey){diffKey=key;diffView?.dispose();diffView=null;comparison.replaceChildren();hideVersionPreview();
      if(selected)try{diffView=renderVersionDiff({root:comparison,comparison:compareLessonVersions({before:project(selected),after:project(state.record.head),mathEngine}),includePrivateNotes:true});}
      catch{comparison.append(el('p','This version could not be compared safely. Its stored content has not been changed.'));}
    }
    const rows=[...state.record.reviews.map(row=>({...row,kind:row.event_type==='approved'?'Review approved':'Review requested',source:row.version_id})),...state.record.publications.map(row=>({...row,kind:row.event_type==='published'?'Published':'Publication withdrawn',source:row.source_version_id}))].sort((a,b)=>b.revision-a.revision);
    eventList.replaceChildren(...rows.map(row=>{const item=el('li',`${row.kind} · revision ${row.revision} · ${versionDate(row.created_at)}`);if(row.comment||row.reason)item.append(el('p',row.comment||row.reason));return item;}));
    if(!rows.length)eventList.append(el('li','No review or publication events yet.'));
    for(const input of confirm.querySelectorAll('input,textarea,button'))input.disabled=active;
    confirmButton.disabled=blocked;
  }
  async function run(work){if(!current()||operation)return;operation=Promise.resolve().then(work);try{await operation;}catch{if(current())error.textContent='The request could not be completed. Check the current server state before retrying.';}finally{operation=null;if(current())render(controller.snapshot());}}
  function startConfirmation(action){
    if(!current()||operation)return;const state=controller.snapshot();if(state.pending||state.status==='conflict')return;
    if(action==='approve'&&(!state.canApprove||state.selected?.version.id!==state.record.head.id))return;
    cancelConfirmation();
    confirmation={action,versionId:state.selected?.version.id,headId:state.record.head.id,revision:state.record.lesson.head_revision};
    confirm.hidden=false;checkFields.hidden=action!=='approve';reasonLabel.hidden=reason.hidden=!['approve','unpublish'].includes(action);reason.required=!reason.hidden;reason.maxLength=action==='unpublish'?1000:2000;reasonLabel.textContent=action==='unpublish'?'Reason for withdrawal':'Review comment';
    for(const input of Object.values(checkInputs))input.required=action==='approve';
    const title={restore:'Restore this saved version?',approve:'Approve this version for publication?',publish:'Publish the approved version?',unpublish:'Withdraw the current publication?'};
    confirmTitle.textContent=action==='approve'?`Approve current version ${state.record.head.version_number} at revision ${state.record.lesson.head_revision}?`:action==='publish'?`Publish approved version ${state.record.head.version_number}?`:title[action];confirmHelp.textContent=action==='restore'?'This creates a new draft from the selected version, including its private teacher notes. Existing versions and the current publication remain unchanged.':action==='approve'?'Confirm each review check yourself. The server requires a reviewer different from the lesson and current version creators.':action==='publish'?'The approved version will become the current institutional publication. Earlier publication history remains available.':'Future authorized delivery will stop. Previously downloaded or displayed content cannot be recalled, and publication history remains available.';
    confirmButton.textContent={restore:'Restore as new draft',approve:'Confirm independent approval',publish:'Publish approved version',unpublish:'Withdraw publication'}[action];
    confirm.scrollIntoView({block:'nearest'});(action==='approve'?Object.values(checkInputs)[0]:reason.hidden?confirmButton:reason).focus();
  }
  async function close(){
    if(!current()||operation)return;
    if(mutationAttempted||controller.snapshot().pending){await run(()=>controller.refresh());if(!current()||controller.snapshot().status!=='ready')return;}
    const fresh=controller.snapshot().record;controller.dispose();diffView?.dispose();hideVersionPreview();closed=true;dialog.removeEventListener('cancel',cancelEvent);dialog.close();clearPrivateDOM();record=null;confirmation=null;resolveClose(fresh);
  }
  const cancelEvent=event=>{event.preventDefault();void close();};dialog.addEventListener('cancel',cancelEvent);
  closeButton.addEventListener('click',()=>void close());cancelButton.addEventListener('click',cancelConfirmation);
  refreshButton.addEventListener('click',()=>{cancelConfirmation();void run(()=>controller.refresh());});
  const reconcile=options=>run(async()=>{await controller.reconcile(options);if(current()&&controller.snapshot().status==='ready')cancelConfirmation();});
  checkButton.addEventListener('click',()=>void reconcile());retryButton.addEventListener('click',()=>void reconcile({retry:true}));
  more.addEventListener('click',()=>void run(()=>controller.loadMore()));
  requestButton.addEventListener('click',()=>{cancelConfirmation();mutationAttempted=true;void run(()=>controller.act('requestReview',{}));});
  for(const [button,action]of [[restoreButton,'restore'],[approveButton,'approve'],[publishButton,'publish'],[withdrawButton,'unpublish']])button.addEventListener('click',()=>startConfirmation(action));
  confirm.addEventListener('submit',event=>{
    event.preventDefault();if(!current()||!confirmation||operation||!confirm.reportValidity())return;
    const chosen=confirmation,state=controller.snapshot();
    if(chosen.headId!==state.record.head.id||chosen.revision!==state.record.lesson.head_revision){cancelConfirmation();error.textContent='The current version changed. Review it and choose the action again.';return;}
    const payload=chosen.action==='restore'?{version_id:chosen.versionId}:chosen.action==='approve'?{checks:Object.fromEntries(Object.entries(checkInputs).map(([key,input])=>[key,input.checked])),comment:reason.value.trim()}:chosen.action==='unpublish'?{reason:reason.value.trim()}:{};
    mutationAttempted=true;void run(async()=>{await controller.act(chosen.action,payload);if(current()&&controller.snapshot().status==='ready')cancelConfirmation();});
  });
  previewButton.addEventListener('click',()=>{if(!current()||operation)return;const selected=controller.snapshot().selected?.version;if(!selected)return;hideVersionPreview();try{renderLessonPreview({root:preview,document:selected.document,mathEngine,resolveAsset});preview.hidden=false;hidePreview.hidden=false;preview.scrollIntoView({block:'nearest'});}catch{error.textContent='This version preview is unavailable.';}});
  hidePreview.addEventListener('click',hideVersionPreview);
  try{controller=createHistorySession({client,record,isCurrent:current,onChange:render,mathEngine});dialog.showModal();render(controller.snapshot());void run(()=>controller.refresh());}
  catch{dispose();throw new Error('Version history could not be opened for this account.');}
  return Object.freeze({closed:finished,dispose,hasPending:()=>!closed&&Boolean(operation||confirmation||controller?.snapshot().pending)});
}
