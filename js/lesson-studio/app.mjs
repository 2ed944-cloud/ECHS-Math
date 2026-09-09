import katex from '../../lessons/ib-math-ai/unit-1/assets/js/katex.js';
import {createStudioClient,supportsStudioContentV2,supportsDraftRecovery} from './api-client.mjs';
import {createLessonDraft,addSlide,duplicateSlide,renameSlide,moveSlide,removeSlide,restoreRemovedSlide,updateSlide} from './draft-model.mjs';
import {createDraftSession} from './draft-session.mjs';
import {createDraftBackup} from './draft-backup.mjs';
import {openHistoryDialog} from './history-dialog.mjs';
import {openLessonPresentation} from './presentation.mjs';
import {isIB13ImportTarget} from './ib13-import-target.mjs';
import {renderSlidePreview,renderLessonPreview,disposeLessonPreview} from './preview.mjs';
import {createMathEditor} from './math-editor.mjs';
import {createRichTextEditor} from './rich-text-editor.mjs';
import {createMediaEditor} from './media-editor.mjs';
import {supportsLessonMedia,LESSON_MEDIA_TYPES} from '../lesson-runtime/asset-contract.mjs';
import {addBlock,insertBlock,removeBlock,moveBlock,updateBlock,restoreRemovedBlock,convertBlockToV2} from './block-model.mjs';

const $=id=>document.getElementById(id);
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let client=null,session=null,classes=[],classContext=null,library=[],selectedSlide=null,deleted=null;
let epoch=0,locked=false,invalid=false,discardAction=null,pendingCreate=null;
let blockEditor=null,editorKey='',editorJSON='',editorInvalid=false,selectedBlock=null,removedBlock=null;
let mediaInsert=null;
let backup=null,backupEpoch=0,backupState='unavailable',recoveryChoice=null,checkpointBusy=false;
let composing=false;
let historyDialog=null;
let presentationView=null;
let importView=null,importSelection=null,importModules=null;
const plainError=error=>({conflict:'Another editor changed this draft. Keep your edits or reload the server version.',
  sign_in_required:'Sign in with an active teacher or school administrator account.',
  session_changed:'Your school session changed. Sign in again to continue.',
  forbidden:'Your account cannot open this workspace.',
  network_error:'The school server could not be reached. Check your connection and try again.'}[error?.code]||'The action could not be completed. Your current edits are still here.');
const text=(tag,value)=>{const element=document.createElement(tag);element.textContent=value;return element;};
const current=stamp=>!invalid&&client&&stamp===epoch;
function assertActive(){if(invalid||!client)throw new Error('Studio is closed.');client.assertCurrent();}
function showGate(message,{retry=false}={}){
  $('studio-app').hidden=true;$('studio-gate').hidden=false;
  const heading=text('h2','Lesson Studio'),description=text('p',message),link=text('a','Sign in to ECHS');
  link.href=new URL('login.html?next='+encodeURIComponent(new URL('lesson-studio.html',location.href).href),location.href).href;
  $('studio-gate').replaceChildren(heading,description,link);
  if(retry){const button=text('button','Try again');button.addEventListener('click',()=>location.reload());$('studio-gate').append(document.createTextNode(' '),button);}
}
function closeStudio(message='Your school session changed. Sign in again to continue.'){
  invalid=true;epoch++;
  importView?.dispose();importView=null;importSelection=null;composing=false;
  $('create-form').inert=false;
  presentationView?.dispose();presentationView=null;
  historyDialog?.dispose();historyDialog=null;
  disposeBackup();
  closeMediaInsert();
  disposeLessonPreview($('slide-canvas'));disposeLessonPreview($('preview-slides'));
  disposeBlockEditor();selectedBlock=null;removedBlock=null;
  session?.dispose();session=null;client?.dispose();client=null;
  classes=[];classContext=null;library=[];selectedSlide=null;deleted=null;discardAction=null;pendingCreate=null;
  for(const dialog of document.querySelectorAll('dialog'))if(dialog.open)dialog.close();
  for(const control of document.querySelectorAll('input,textarea,select'))control.value='';
  for(const id of ['slide-canvas','preview-slides','slide-list','lesson-list','class-select','catalog-select','course-version-select','block-select','block-editor'])$(id).replaceChildren();
  for(const id of ['studio-identity','lesson-heading','preview-heading','new-heading','course-status','library-status','edit-error','create-error','save-message','slide-count','save-status','backup-status','ib13-import-selection'])$(id).textContent='';
  $('ib13-import-option').hidden=true;
  $('workspace').hidden=true;$('new-lesson').disabled=true;showGate(message);
}
function busy(value){locked=value;$('new-lesson').disabled=value||!classContext?.current_assignment;
  $('workspace').inert=value||unsupportedDocument();$('workspace').setAttribute('aria-busy',String(value));
  $('class-select').disabled=value;$('create-lesson').disabled=value||composing;$('pin-course').disabled=value;
  for(const button of $('lesson-list').querySelectorAll('button'))button.disabled=value;
  renderImportOption();
}
function setValue(id,value){const control=$(id);if(document.activeElement!==control)control.value=value;}
function snapshot(){return session?.snapshot();}
function selected(){return snapshot()?.document.slides.find(slide=>slide.id===selectedSlide);}
function editableText(slide){
  const block=slide?.blocks.find(item=>item.id===selectedBlock&&item.type==='rich-text'&&item.version===1)||(!selectedBlock?slide?.blocks.find(item=>item.type==='rich-text'&&item.version===1):null);
  const editable=Boolean(block&&block.content.paragraphs.every(p=>p.children.every(c=>c.type==='text'&&!c.marks?.length)));
  return {block,editable,value:block?block.content.paragraphs.map(p=>p.children.map(c=>c.type==='math'?c.spoken:c.text).join('')).join('\n\n'):''};
}
const canContentV2=()=>supportsStudioContentV2(classContext?.authoring_capabilities);
const canMedia=()=>supportsLessonMedia(classContext?.media_capabilities);
const mediaType=type=>LESSON_MEDIA_TYPES.includes(type);
const blockEditable=block=>Boolean(block&&(mediaType(block.type)?canMedia():['rich-text','math','callout'].includes(block.type)&&canContentV2()));
const unsupportedDocument=()=>Boolean(snapshot()?.document.slides.some(slide=>slide.blocks.some(block=>mediaType(block.type)?!canMedia():block.version>1&&!canContentV2())));
function disposeBlockEditor(){
  const editor=blockEditor;blockEditor=null;editorKey='';editorJSON='';editorInvalid=false;
  editor?.dispose();$('block-editor').replaceChildren();$('block-error').textContent='';
}
function closeMediaInsert(){
  const insertion=mediaInsert;mediaInsert=null;insertion?.editor?.dispose();
  if($('media-insert-dialog').open)$('media-insert-dialog').close();
  $('media-insert-editor').replaceChildren();$('media-insert-error').textContent='';
}
function openMediaInsert(type){
  if(locked||!session||!canMedia()||!mediaType(type)||!commitFields()||selected().blocks.length>=40)return;
  assertActive();closeMediaInsert();
  const insertion={lessonId:snapshot().record.lesson.id,slideId:selectedSlide,afterId:selectedBlock,editor:null};mediaInsert=insertion;
  const stillHere=()=>mediaInsert===insertion&&!invalid&&session&&snapshot().record.lesson.id===insertion.lessonId&&selectedSlide===insertion.slideId;
  $('media-insert-heading').textContent=`Add ${{image:'image',video:'video',table:'table',resource:'PDF resource'}[type]}`;
  insertion.type=type;
  insertion.editor=createMediaEditor({root:$('media-insert-editor'),type,mathEngine:katex,
    onChange:()=>{if(stillHere())$('media-insert-error').textContent='';},
    onInvalid:()=>{if(stillHere())$('media-insert-error').textContent='Complete the required content before inserting it.';},
    uploadAsset:async(file,options)=>{if(!stillHere())throw new Error('This insertion has closed.');const asset=await client.uploadAsset(insertion.lessonId,file,options);if(!stillHere())throw new Error('This insertion has closed.');return asset;}});
  $('media-insert-dialog').showModal();insertion.editor.focus();
}
function confirmMediaInsert(){
  const insertion=mediaInsert;
  if(!insertion||locked||!session||!canMedia())return;
  try{
    assertActive();if(snapshot().record.lesson.id!==insertion.lessonId||selectedSlide!==insertion.slideId)throw new Error('The lesson changed.');
    const content=insertion.editor.getValue(),before=snapshot().document,slide=selected();
    const next=insertBlock(before,slide.id,{type:insertion.type,version:1,content,afterId:insertion.afterId},{mathEngine:katex});
    const added=next.slides.find(item=>item.id===slide.id).blocks.find(item=>!slide.blocks.some(old=>old.id===item.id));
    session.editDocument(next);selectedBlock=added.id;closeMediaInsert();renderEditor(snapshot());
  }catch{if(mediaInsert===insertion)$('media-insert-error').textContent='Complete this content and wait for any upload to finish before inserting it.';}
}
function previewAssetResolver(){
  const active=session,lessonId=snapshot()?.record.lesson.id;
  return async(assetId,options)=>{
    assertActive();if(session!==active)throw new Error('This preview has closed.');
    const result=await client.loadAsset(lessonId,assetId,options);
    assertActive();if(session!==active)throw new Error('This preview has closed.');return result;
  };
}
function renderBlocks(state,slide){
  const block=slide.blocks.find(item=>item.id===selectedBlock),index=slide.blocks.indexOf(block),allowed=canContentV2();
  const readOnly=unsupportedDocument();$('workspace').inert=locked||readOnly;
  if(readOnly)$('library-status').textContent='This draft uses content that the current server cannot edit. It is shown read-only until the compatible service is available.';
  $('block-select').replaceChildren(...slide.blocks.map((item,i)=>{const option=text('option',`${i+1}. ${{'rich-text':'Text',math:'Mathematics',callout:'Callout',image:'Image',video:'Video',table:'Table',resource:'PDF resource','legacy-embedded':'Existing lesson reference'}[item.type]||'Content'}`);option.value=item.id;return option;}));
  $('block-select').value=selectedBlock;
  for(const id of ['add-text-block','add-math-block','add-callout-block'])$(id).disabled=!allowed||slide.blocks.length>=40;
  $('move-block-up').disabled=!blockEditable(block)||index===0;$('move-block-down').disabled=!blockEditable(block)||index===slide.blocks.length-1;
  $('delete-block').disabled=!blockEditable(block)||slide.blocks.length===1;$('undo-delete-block').disabled=!blockEditable(removedBlock?.block)||removedBlock?.slideId!==slide.id;
  for(const type of LESSON_MEDIA_TYPES)$(`add-${type}-block`).disabled=!canMedia()||slide.blocks.length>=40;
  $('media-capability').textContent=canMedia()?'Add private images and PDFs, accessible tables and videos.':'Media tools will be available when the school service confirms support.';
  $('content-capability').textContent=allowed?'Add and edit formatted text, links and accessible mathematics.':'Additional content editors will be available when the school service confirms support. Existing plain text can still be edited.';
  $('upgrade-block').hidden=!allowed||block.version!==1||!['rich-text','math','callout'].includes(block.type);
  $('legacy-text-group').hidden=block.version!==1||block.type!=='rich-text';
  if(!blockEditable(block)||(!mediaType(block.type)&&block.version!==2)){if(blockEditor)disposeBlockEditor();return;}
  const key=`${state.record.lesson.id}/${slide.id}/${block.id}/${block.type}/${block.version}`,json=JSON.stringify(block.content);
  if(blockEditor&&key===editorKey){if(json!==editorJSON&&!editorInvalid){editorJSON=json;blockEditor.setValue(block.content);}return;}
  disposeBlockEditor();editorKey=key;editorJSON=json;
  const stillHere=()=>!invalid&&session&&editorKey===key&&snapshot().record.lesson.id===state.record.lesson.id;
  const invalidContent=()=>{if(!stillHere())return;editorInvalid=true;$('block-error').textContent='Complete all required fields and correct the highlighted content.';renderStatus(snapshot());};
  const changed=content=>{
    if(!stillHere()||locked||composing)return;
    try{assertActive();const next=updateBlock(snapshot().document,slide.id,block.id,{content},{mathEngine:katex});editorJSON=JSON.stringify(content);editorInvalid=false;$('block-error').textContent='';session.editDocument(next,{group:`block:${slide.id}:${block.id}`});}
    catch{invalidContent();}
  };
  if(mediaType(block.type))blockEditor=createMediaEditor({root:$('block-editor'),type:block.type,value:block.content,mathEngine:katex,onChange:changed,onInvalid:invalidContent,
    uploadAsset:async(file,options)=>{if(!stillHere())throw new Error('This editor has closed.');const asset=await client.uploadAsset(state.record.lesson.id,file,options);if(!stillHere())throw new Error('This editor has closed.');return asset;}});
  else if(block.type==='math')blockEditor=createMathEditor({root:$('block-editor'),value:block.content,mathEngine:katex,onChange:changed,onInvalid:invalidContent});
  else if(block.type==='rich-text')blockEditor=createRichTextEditor({root:$('block-editor'),content:block.content,mathEngine:katex,onChange:changed,onInvalid:invalidContent});
  else if(block.type==='callout'){
    const kindLabel=text('label','Callout style'),kind=document.createElement('select'),titleLabel=text('label','Callout title'),title=document.createElement('input'),body=document.createElement('div');
    kind.id='callout-kind';kindLabel.htmlFor=kind.id;title.id='callout-title';titleLabel.htmlFor=title.id;title.maxLength=240;title.required=true;
    for(const value of ['note','definition','warning','example'])kind.append(Object.assign(text('option',value[0].toUpperCase()+value.slice(1)),{value}));
    kind.value=block.content.kind;title.value=block.content.title;$('block-editor').append(kindLabel,kind,titleLabel,title,body);
    let rich;
    const value=()=>{if(!title.value.trim())throw new Error('A title is required.');return {kind:kind.value,title:title.value,body:rich.getValue()};};
    const emit=()=>{try{changed(value());}catch{invalidContent();}};
    rich=createRichTextEditor({root:body,content:block.content.body,mathEngine:katex,onChange:emit,onInvalid:invalidContent});
    title.addEventListener('input',emit);kind.addEventListener('change',emit);
    blockEditor={getValue:value,setValue(content){kind.value=content.kind;title.value=content.title;rich.setValue(content.body);},focus(){title.focus();},dispose(){title.removeEventListener('input',emit);kind.removeEventListener('change',emit);rich.dispose();$('block-editor').replaceChildren();}};
  }
}
function blockAction(action){
  const permitted=['rich-text','math','callout','upgrade'].includes(action)?canContentV2():blockEditable(action==='undo'?removedBlock?.block:selected()?.blocks.find(item=>item.id===selectedBlock));
  if(locked||!permitted||!commitFields())return;
  changeDocument(lesson=>{
    const slide=lesson.slides.find(item=>item.id===selectedSlide),index=slide.blocks.findIndex(item=>item.id===selectedBlock);
    if(['rich-text','math','callout'].includes(action)){
      const next=addBlock(lesson,slide.id,{type:action,afterId:selectedBlock});selectedBlock=next.slides.find(item=>item.id===slide.id).blocks.find(item=>!slide.blocks.some(old=>old.id===item.id)).id;return next;
    }
    if(action==='upgrade'){const converted=convertBlockToV2(slide.blocks[index],{mathEngine:katex});return updateBlock(lesson,slide.id,selectedBlock,{version:converted.version,content:converted.content},{mathEngine:katex});}
    if(action==='delete'){
      const next=removeBlock(lesson,slide.id,selectedBlock);removedBlock={slideId:slide.id,block:structuredClone(slide.blocks[index]),index};selectedBlock=next.slides.find(item=>item.id===slide.id).blocks[Math.min(index,slide.blocks.length-2)].id;return next;
    }
    if(action==='undo'&&removedBlock?.slideId===slide.id){
      const next=restoreRemovedBlock(lesson,slide.id,{block:removedBlock.block,index:removedBlock.index});selectedBlock=next.slides.find(item=>item.id===slide.id).blocks.find(item=>!slide.blocks.some(old=>old.id===item.id)).id;removedBlock=null;return next;
    }
    return moveBlock(lesson,slide.id,selectedBlock,index+(action==='up'?-1:1));
  });
}
function renderLibrary(){
  const active=snapshot()?.record.lesson.id;
  const nodes=library.map(lesson=>{
    const title=classContext?.catalog.find(item=>item.access_key===lesson.access_key)?.title||'Lesson draft';
    const button=text('button',title);button.type='button';button.dataset.lessonId=lesson.id;
    button.setAttribute('aria-pressed',String(lesson.id===active));button.disabled=locked;
    button.addEventListener('click',()=>openLesson(lesson.id));return button;
  });$('lesson-list').replaceChildren(...nodes);
}
function renderStatus(state){
  const labels={saved:'Saved',editing:'Unsaved changes',saving:'Saving…',offline:'Not saved · offline',conflict:'Save conflict',invalid:'Check your edits',error:'Save needs attention'};
  $('save-status').textContent=labels[state.status]||'Unsaved changes';$('save-status').dataset.state=state.status;
  const needsAttention=['offline','conflict','invalid','error'].includes(state.status);
  $('save-alert').hidden=!needsAttention;
  $('save-message').textContent=state.status==='conflict'?'Another editor changed this draft. Your edits are kept here. Reloading will replace them with the server draft.':
    state.status==='offline'?'Reconnect and retry to check the server before saving. The device backup status below shows whether accepted edits can be recovered after reopening.':
    state.status==='invalid'?'Some content needs attention before it can be saved.':'Saving failed. Your edits are kept in this open tab. Retry to check the server before saving again.';
  $('retry-save').hidden=state.status==='conflict'||state.status==='invalid';
  $('reload-draft').hidden=!['conflict','offline','error'].includes(state.status);
  $('save-now').disabled=!state.dirty||state.status==='saving'||needsAttention;
  $('undo-edit').disabled=!state.canUndo||editorInvalid||composing;
  $('redo-edit').disabled=!state.canRedo||editorInvalid||composing;
  $('device-backups').disabled=!backup;
  $('version-history').disabled=composing||editorInvalid;
  $('present-lesson').disabled=composing||editorInvalid;
  if(editorInvalid){$('save-status').textContent='Check block content';$('save-now').disabled=true;}
}
function renderEditor(state){
  if(invalid||!session)return;assertActive();
  const lesson=state.document;
  if(!lesson.slides.some(slide=>slide.id===selectedSlide))selectedSlide=lesson.slides[0].id;
  const index=lesson.slides.findIndex(slide=>slide.id===selectedSlide),slide=lesson.slides[index];
  if(!slide.blocks.some(block=>block.id===selectedBlock))selectedBlock=slide.blocks[0].id;
  $('workspace').hidden=false;$('empty-state').hidden=true;$('lesson-heading').textContent=lesson.title;
  const focusedSlide=document.activeElement?.closest('#slide-list button')?.dataset.slideId;
  $('slide-list').replaceChildren(...lesson.slides.map((item,i)=>{
    const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.dataset.slideId=item.id;
    const number=text('span',String(i+1).padStart(2,'0'));number.className='slide-number';number.setAttribute('aria-hidden','true');
    button.append(number,text('span',item.title));button.setAttribute('aria-label',`Slide ${i+1}: ${item.title}`);
    button.setAttribute('aria-current',String(item.id===selectedSlide));
    button.addEventListener('click',()=>selectSlide(item.id));li.append(button);return li;
  }));
  if(focusedSlide)$('slide-list').querySelector(`[data-slide-id="${focusedSlide}"]`)?.focus();
  $('slide-count').textContent=`SLIDE ${index+1} OF ${lesson.slides.length}`;
  setValue('slide-title',slide.title);setValue('slide-layout',slide.layout);
  const editable=editableText(slide);setValue('slide-text',editable.value);$('slide-text').disabled=!editable.editable;
  $('text-help').textContent=editable.editable?'Plain text for this slide. Changes save automatically.':'This block contains formatting or mathematics. Its content is preserved in this Studio stage.';
  setValue('private-notes',state.privateNotes);
  $('move-slide-up').disabled=index===0;$('move-slide-down').disabled=index===lesson.slides.length-1;
  $('delete-slide').disabled=lesson.slides.length===1;$('add-slide').disabled=lesson.slides.length>=120;$('duplicate-slide').disabled=lesson.slides.length>=120;
  $('undo-delete').disabled=!deleted;renderStatus(state);
  try{renderSlidePreview({root:$('slide-canvas'),document:lesson,slideIndex:index,mathEngine:katex,resolveAsset:previewAssetResolver()});}
  catch{$('slide-canvas').replaceChildren(text('p','This slide needs valid content before it can be previewed.'));}
  renderBlocks(state,slide);
  renderLibrary();
}
function selectSlide(id){
  if(locked)return;
  try{assertActive();if(!commitFields())return;selectedSlide=id;$('edit-error').textContent='';renderEditor(snapshot());}
  catch(error){if(!invalid)$('edit-error').textContent=plainError(error);}
}
function changeDocument(transform){
  if(!session||locked)return;
  const priorSlide=selectedSlide,priorDeleted=deleted,priorBlock=selectedBlock,priorRemovedBlock=removedBlock;
  try{assertActive();const before=snapshot().document,next=transform(before);session.editDocument(next);$('edit-error').textContent='';renderEditor(snapshot());}
  catch(error){if(!invalid){selectedSlide=priorSlide;deleted=priorDeleted;selectedBlock=priorBlock;removedBlock=priorRemovedBlock;$('edit-error').textContent='Check the slide content and document limits. Titles and text must be nonempty plain text without HTML.';renderStatus(snapshot());}}
}
function commitField(id){
  if(composing)return true;
  if(!session||locked||unsupportedDocument())return true;
  const slide=selected();if(!slide)return false;
  try{
    assertActive();const original=snapshot().document;let next=original;
    if(id==='slide-title'&&$(id).value!==slide.title)next=renameSlide(next,slide.id,$(id).value.trim());
    if(id==='slide-layout'&&$(id).value!==slide.layout)next=updateSlide(next,slide.id,{layout:$(id).value});
    if(id==='slide-text'){
      const editable=editableText(slide);
      if(editable.editable&&$(id).value!==editable.value){
        const value=$(id).value.trim();if(!value)throw new Error('Text is required.');
        const blocks=slide.blocks.map(block=>block.id===editable.block.id?{...block,content:{paragraphs:[{type:'paragraph',children:[{type:'text',text:value}]}]}}:block);
        next=updateSlide(next,slide.id,{blocks});
      }
    }
    if(id==='private-notes'){if($(id).value!==snapshot().privateNotes)session.editNotes($(id).value,{group:id});}
    else if(next!==original)session.editDocument(next,{group:id==='slide-layout'?undefined:`${selectedSlide}:${id}`});
    $(id).removeAttribute('aria-invalid');$('edit-error').textContent='';return true;
  }catch(error){if(!invalid){$(id).setAttribute('aria-invalid','true');$('edit-error').textContent='Check this field. Required text cannot be blank or contain HTML.';}return false;}
}
function commitFields(){
  if(blockEditor){try{
    if(locked||unsupportedDocument())return false;
    assertActive();const content=blockEditor.getValue(),block=selected()?.blocks.find(item=>item.id===selectedBlock);
    if(!block)throw new Error('Choose a block.');
    const json=JSON.stringify(content),next=json!==JSON.stringify(block.content)?updateBlock(snapshot().document,selectedSlide,block.id,{content},{mathEngine:katex}):null;
    editorInvalid=false;editorJSON=json;$('block-error').textContent='';
    if(next)session.editDocument(next);
  }catch{editorInvalid=true;$('block-error').textContent='Complete or correct this block before continuing.';return false;}}
  if(editorInvalid)return false;
  for(const id of ['slide-title','slide-layout','slide-text','private-notes'])if(!commitField(id))return false;return true;
}
async function canLeave(){
  if(mediaInsert){$('media-insert-error').textContent='Insert or cancel this content before opening another lesson.';return false;}
  if(pendingCreate){$('library-status').textContent='Check the pending lesson creation before changing classes or lessons.';return false;}
  if(!session)return true;if(!commitFields())return false;
  const active=session;
  busy(true);
  try{if(snapshot().dirty)await active.flush();}
  finally{if(!invalid&&session===active)busy(false);}
  if(invalid||session!==active||!commitFields())return false;
  if(snapshot().dirty){$('library-status').textContent='Save or resolve this draft before opening another lesson.';return false;}
  return true;
}
function backupStatus(value){
  backupState=value.status;
  const labels={ready:'Device backup ready',saving:'Updating device backup…',saved:'Encrypted device backup updated',warning:'Some device backups could not be read',error:'Device backup unavailable · keep this tab open until the server saves',unavailable:'Device backup unavailable · server saving remains available'};
  $('backup-status').textContent=labels[value.status]||'';
  $('backup-status').dataset.state=value.status;
}
function disposeBackup(){
  backupEpoch++;backup?.dispose();backup=null;checkpointBusy=false;
  recoveryChoice?.(null);recoveryChoice=null;
  $('recovery-list').replaceChildren();$('recovery-message').textContent='';
  if($('recovery-dialog').open)$('recovery-dialog').close();
}
async function storeCheckpoint(state=snapshot(),active=session){
  const device=backup;
  if(!device||!active||active!==session||invalid||checkpointBusy)return false;
  try{
    if(state.dirty||state.status==='saving')return await device.write(active.checkpoint());
    await device.clear();return true;
  }catch{if(device===backup&&!invalid)backupStatus({status:'error'});return false;}
}
function chooseRecovery(candidates,device,stamp){
  if(!candidates.length)return Promise.resolve(null);
  return new Promise(resolve=>{
    const finish=value=>{if(recoveryChoice!==finish)return;recoveryChoice=null;$('recovery-dialog').close();$('recovery-list').replaceChildren();resolve(value);};
    recoveryChoice=finish;$('recovery-message').textContent='These encrypted drafts belong to your account and this lesson. Recovering compares them with the current server version before saving.';
    const items=candidates.map(candidate=>{
      const row=document.createElement('li'),description=text('p',`${candidate.checkpoint.document.title} · ${new Date(candidate.updated_at).toLocaleString()} · base revision ${candidate.checkpoint.base.lesson.head_revision}`);
      const recover=text('button','Recover this draft'),remove=text('button','Delete this device backup');recover.type=remove.type='button';
      recover.addEventListener('click',()=>{if(device===backup&&stamp===backupEpoch&&!invalid)finish(candidate);});
      remove.addEventListener('click',async()=>{recover.disabled=remove.disabled=true;try{const removed=await device.remove(candidate.branch_id);if(device!==backup||stamp!==backupEpoch||invalid)return;if(removed===false)throw new Error('Backup removal failed');row.remove();if(!$('recovery-list').children.length)finish(null);}catch{if(device===backup&&!invalid){recover.disabled=remove.disabled=false;$('recovery-message').textContent='The device backup could not be deleted. It has been retained.';}}});
      row.append(description,recover,remove);return row;
    });
    $('recovery-list').replaceChildren(...items);$('recovery-dialog').showModal();$('keep-server-draft').focus();
  });
}
async function prepareBackup(record){
  disposeBackup();backupStatus({status:'unavailable'});
  if(!supportsDraftRecovery(classContext?.recovery_capabilities))return null;
  const stamp=backupEpoch,activeClient=client;
  const valid=()=>!invalid&&client===activeClient&&stamp===backupEpoch;
  try{
    let key=await client.recoveryKey(record.lesson.id);if(!valid())return null;
    const device=await createDraftBackup({key,indexedDB:window.indexedDB,crypto:window.crypto,mathEngine:katex,isCurrent:()=>{if(!valid())return false;activeClient.assertCurrent();return true;},onStatus:status=>{if(valid())backupStatus(status);}});
    key=null;if(!valid()){device.dispose();return null;}backup=device;
    const candidates=await device.list();if(!valid())return null;
    return await chooseRecovery(candidates,device,stamp);
  }catch{if(valid())backupStatus({status:'error'});return null;}
}
async function attachRecord(record){
  assertActive();disposeBlockEditor();session?.dispose();selectedSlide=record.head.document.slides[0].id;deleted=null;selectedBlock=null;removedBlock=null;
  session=null;
  const stamp=epoch,candidate=await prepareBackup(record);if(!current(stamp))return;
  session=createDraftSession({client,record,mathEngine:katex,delayMs:800,isCurrent:()=>!invalid&&Boolean(client),
    beforeSave:checkpoint=>backup?.write(checkpoint),
    onChange:state=>{if(!invalid&&session){renderEditor(state);void storeCheckpoint(state);}}});
  let recoveryError=false;
  if(candidate){
    checkpointBusy=true;
    try{
      // Refresh after the teacher chooses; the dialog may have been open while another editor saved.
      const fresh=await client.get(record.lesson.id);if(!current(stamp))return;
      session.dispose();session=createDraftSession({client,record:fresh,mathEngine:katex,delayMs:800,isCurrent:()=>!invalid&&Boolean(client),beforeSave:checkpoint=>backup?.write(checkpoint),onChange:state=>{if(!invalid&&session){renderEditor(state);void storeCheckpoint(state);}}});
      session.restoreCheckpoint(candidate.checkpoint);
      const device=backup;
      if(!snapshot().dirty||await device.write(session.checkpoint())){if(current(stamp)&&device===backup)await device.remove(candidate.branch_id);}
    }catch{recoveryError=true;}
    finally{checkpointBusy=false;}
  }
  if(!current(stamp))return;
  renderEditor(snapshot());$('library-status').textContent=recoveryError?'This backup could not be recovered. It remains on this device; reopen it after reconnecting.':'';
}
function clearWorkspace(){disposeBackup();closeMediaInsert();disposeLessonPreview($('slide-canvas'));disposeLessonPreview($('preview-slides'));disposeBlockEditor();session?.dispose();session=null;selectedSlide=null;deleted=null;selectedBlock=null;removedBlock=null;$('workspace').hidden=true;$('empty-state').hidden=false;
  for(const id of ['slide-canvas','slide-list','preview-slides'])$(id).replaceChildren();for(const id of ['slide-title','slide-text','private-notes'])$(id).value='';
}
async function openLesson(id){
  if(locked||snapshot()?.record.lesson.id===id)return;
  if(!await canLeave())return;busy(true);const stamp=++epoch;
  try{const record=await client.get(id);if(!current(stamp))return;await attachRecord(record);}
  catch(error){if(current(stamp))$('library-status').textContent=plainError(error);}
  finally{if(current(stamp))busy(false);}
}
async function chooseClass(id){
  if(locked)return;
  const previous=classContext?.class.id||'';
  if(pendingCreate&&id!==pendingCreate.payload.class_id){$('class-select').value=previous;$('library-status').textContent='Check the pending lesson creation before changing classes. Open New lesson to verify its saved result.';return;}
  if(!await canLeave()){$('class-select').value=previous;return;}
  busy(true);const stamp=++epoch;
  try{
    if(!id){clearWorkspace();classContext=null;library=[];$('pin-form').hidden=true;$('course-status').textContent='';renderLibrary();return;}
    const [context,result]=await Promise.all([client.context(id),client.list(id)]);
    if(!current(stamp))return;clearWorkspace();classContext=context;library=result.lessons;
    $('class-select').value=id;
    const course=context.course_versions.find(item=>item.id===context.current_assignment?.course_version_id);
    $('course-status').textContent=course?`${course.record?.title||course.course_code} · ${course.version_key}`:'No curriculum version selected for this class.';
    const admin=client.actor().role==='admin';$('pin-form').hidden=Boolean(context.current_assignment)||!admin;
    $('course-version-select').replaceChildren(...context.course_versions.map(item=>{const option=text('option',`${item.record?.title||item.course_code} · ${item.version_key}`);option.value=item.id;return option;}));
    $('empty-state').textContent=context.current_assignment?'Choose a lesson draft or create one for this class.':admin?'Select this class’s curriculum version before creating a lesson.':'A school administrator must select this class’s curriculum version before a new lesson can be created.';
    $('library-status').textContent=library.length?'':context.current_assignment?'No drafts in this class yet.':'';renderLibrary();
  }catch(error){if(current(stamp)){$('class-select').value=previous;$('library-status').textContent=plainError(error);}}
  finally{if(current(stamp))busy(false);}
}
async function showCreate(){
  if(locked||composing||!classContext?.current_assignment)return;
  if(pendingCreate){$('new-lesson-dialog').showModal();return;}
  if(!await canLeave())return;
  assertActive();const used=new Set(library.map(item=>item.access_key));
  const choices=classContext.catalog.filter(item=>!used.has(item.access_key));
  if(!choices.length){$('library-status').textContent='Every lesson location already has a draft. Open an existing lesson to edit it.';return;}
  $('create-form').reset();importSelection=null;$('create-error').textContent='';setCreatePending(false);
  $('catalog-select').replaceChildren(...choices.map(item=>{const option=text('option',`${item.topic} · ${item.title}`);option.value=item.access_key;return option;}));
  $('new-title').value=choices[0].title;renderImportOption();$('new-lesson-dialog').showModal();$('new-title').focus();
}
function importTarget(){
  const catalog=classContext?.catalog.find(item=>item.access_key===$('catalog-select').value);
  const assignment=classContext?.current_assignment;
  const course=classContext?.course_versions.find(item=>item.id===assignment?.course_version_id);
  return !invalid&&assignment?.state==='active'&&course?.status==='active'&&!course.is_placeholder&&
    classContext?.class.course_key==='ib-math-ai'&&canContentV2()&&canMedia()&&
    isIB13ImportTarget({courseVersionId:assignment.course_version_id,catalog})?catalog:null;
}
function renderImportOption(){
  const eligible=Boolean(importTarget());$('ib13-import-option').hidden=!eligible;
  $('review-ib13-import').disabled=!eligible||locked||composing||Boolean(pendingCreate);
  $('clear-ib13-import').disabled=locked||composing||Boolean(pendingCreate);
  $('clear-ib13-import').hidden=!importSelection;
  $('ib13-import-selection').textContent=importSelection?
    `${importSelection.summary.nativeSlides} editable slides selected; ${importSelection.summary.referenceSlides} slides retained as references to the original lesson.`:
    'Review the existing lesson before choosing which teaching content to import.';
}
function loadImportModules(){
  if(!importModules)importModules=Promise.all([import('./ib13-import-model.mjs'),import('./import-dialog.mjs')]).catch(error=>{importModules=null;throw error;});
  return importModules;
}
async function reviewIB13Import(){
  if(locked||composing||pendingCreate||!importTarget())return;
  const stamp=epoch,activeClient=client,catalog=importTarget(),assignment=classContext.current_assignment;
  const classId=classContext.class.id;busy(true);$('create-form').inert=true;
  try{
    assertActive();const [model,viewModule]=await loadImportModules();
    if(!current(stamp)||!$('new-lesson-dialog').open)return;
    assertActive();if(importTarget()?.access_key!==catalog.access_key)throw new Error('Import location changed.');
    const id=crypto.randomUUID();
    const baseDocument=createLessonDraft({lessonId:id,courseVersionId:assignment.course_version_id,catalog,
      title:$('new-title').value.trim()||catalog.title,objective:$('new-objective').value.trim()||'Review the selected geometric-sequence teaching content.',
      skill:`teacher:${id}:skill:geometric-structure`,summary:$('new-summary').value.trim()||'Preview of reviewed IB geometric-sequence explanations and preserved lesson references.'});
    const view=viewModule.openIB13ImportDialog({dialog:$('ib13-import-dialog'),baseDocument,mathEngine:katex,
      selectedSlideIds:importSelection?.selectedSlideIds,
      isCurrent:()=>{if(!current(stamp)||client!==activeClient||!$('new-lesson-dialog').open)return false;try{activeClient.assertCurrent();return true;}catch{closeStudio();return false;}}});
    importView=view;const selection=await view.closed;if(importView===view)importView=null;
    if(!current(stamp)||!$('new-lesson-dialog').open||!selection)return;
    assertActive();if(importTarget()?.access_key!==catalog.access_key)throw new Error('Import location changed.');
    const {summary}=model.createIB13Import({baseDocument,selectedSlideIds:selection.selectedSlideIds,mathEngine:katex});
    importSelection=Object.freeze({classId,assignmentId:assignment.id,accessKey:catalog.access_key,
      selectedSlideIds:Object.freeze([...summary.selectedSlideIds]),summary:Object.freeze({...summary})});
  }catch(error){if(current(stamp))$('create-error').textContent=error?.code?plainError(error):'The import preview could not be opened. Check the lesson details and reload Studio if its resources are unavailable.';}
  finally{if(current(stamp)){$('create-form').inert=false;busy(false);if($('new-lesson-dialog').open)$('review-ib13-import').focus();}}
}
function setCreatePending(value){
  for(const control of $('create-form').querySelectorAll('input,textarea,select'))control.disabled=value;
  $('create-lesson').textContent=value?'Check saved lesson':'Create lesson';
  renderImportOption();
}
async function createOrReconcile(attempt){
  const id=attempt.payload.document.lesson_id;
  if(attempt.submitted){
    try{return await client.get(id);}catch(error){if(error.status!==404)throw error;}
  }
  attempt.submitted=true;
  try{return await client.create(attempt.payload);}
  catch(error){
    if(error.code==='invalid_request'){attempt.rejected=true;throw error;}
    if(!error.status||error.status>=500||error.status===409){
      try{return await client.get(id);}catch(readError){
        if(readError.status===404&&error.status===409){attempt.rejected=true;throw error;}
        throw readError;
      }
    }
    attempt.rejected=true;throw error;
  }
}
async function createLesson(event){
  event.preventDefault();if(locked||composing||!classContext)return;const stamp=epoch;busy(true);
  try{
    assertActive();
    if(!pendingCreate){
      const catalog=classContext.catalog.find(item=>item.access_key===$('catalog-select').value);
      if(!catalog)throw new Error('Invalid lesson location.');const id=crypto.randomUUID();
      const skill=$('new-skill').value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'teaching-focus';
      let document=createLessonDraft({lessonId:id,courseVersionId:classContext.current_assignment.course_version_id,catalog,
        title:$('new-title').value.trim(),objective:$('new-objective').value.trim(),skill:`teacher:${id}:skill:${skill}`,summary:$('new-summary').value.trim()});
      if(importSelection){
        if(!importTarget()||importSelection.classId!==classContext.class.id||importSelection.assignmentId!==classContext.current_assignment.id||importSelection.accessKey!==catalog.access_key)throw new Error('The import selection no longer matches this class and lesson.');
        const [model]=await loadImportModules();if(!current(stamp))return;assertActive();
        document=model.createIB13Import({baseDocument:document,selectedSlideIds:importSelection.selectedSlideIds,mathEngine:katex}).document;
      }
      pendingCreate={submitted:false,rejected:false,payload:{class_id:classContext.class.id,course_version_id:classContext.current_assignment.course_version_id,access_key:catalog.access_key,document,private_notes:'',expected_revision:0}};
    }
    setCreatePending(true);const record=await createOrReconcile(pendingCreate);
    if(!current(stamp))return;pendingCreate=null;setCreatePending(false);
    if(!library.some(item=>item.id===record.lesson.id))library.push(record.lesson);
    $('new-lesson-dialog').close();$('create-form').reset();importSelection=null;renderImportOption();await attachRecord(record);
  }catch(error){if(current(stamp)){
    if(pendingCreate?.rejected){pendingCreate=null;setCreatePending(false);}
    if(!pendingCreate&&error.status===409){
      try{const result=await client.list(classContext.class.id);if(!current(stamp))return;library=result.lessons;renderLibrary();}catch{}
      if(current(stamp))$('create-error').textContent='A draft already exists for this lesson location. Close this dialog and open it from the lesson list.';
      return;
    }
    $('create-error').textContent=pendingCreate?'The creation result is not yet confirmed. Check the saved lesson before making another attempt. Your entries are kept here.':error?.code?plainError(error):'Check the required fields. Use plain text without HTML.';
  }}
  finally{if(current(stamp))busy(false);}
}
async function pinCourse(event){
  event.preventDefault();if(locked||!classContext)return;const stamp=epoch,id=classContext.class.id;busy(true);
  try{assertActive();await client.pin(id,{course_version_id:$('course-version-select').value,expected_assignment_id:classContext.current_assignment?.id||null,reason:$('pin-reason').value.trim()});
    if(!current(stamp))return;busy(false);await chooseClass(id);
  }catch(error){if(current(stamp))$('library-status').textContent=plainError(error);}
  finally{if(current(stamp))busy(false);}
}
function slideAction(action){
  if(!commitFields())return;
  changeDocument(lesson=>{
    if(action==='add'||action==='duplicate'){
      const next=action==='add'?addSlide(lesson,{title:'New slide',afterId:selectedSlide}):duplicateSlide(lesson,selectedSlide);
      selectedSlide=next.slides.find(item=>!lesson.slides.some(old=>old.id===item.id)).id;return next;
    }
    if(action==='delete'){const prior=selectedSlide,index=lesson.slides.findIndex(item=>item.id===prior),next=removeSlide(lesson,selectedSlide);deleted={slide:structuredClone(lesson.slides[index]),index};selectedSlide=next.slides[Math.min(index,next.slides.length-1)].id;return next;}
    if(action==='undo'&&deleted){
      const next=restoreRemovedSlide(lesson,deleted);selectedSlide=next.slides.find(item=>!lesson.slides.some(old=>old.id===item.id)).id;
      deleted=null;return next;
    }
    const index=lesson.slides.findIndex(item=>item.id===selectedSlide);return moveSlide(lesson,selectedSlide,index+(action==='up'?-1:1));
  });
}
function preview(){
  if(!commitFields())return;
  try{assertActive();const lesson=snapshot().document;$('preview-heading').textContent=lesson.title;
    renderLessonPreview({root:$('preview-slides'),document:lesson,mathEngine:katex,resolveAsset:previewAssetResolver()});$('preview-dialog').showModal();
  }catch(error){if(!invalid)$('edit-error').textContent='Check the lesson content before previewing.';}
}
function historyAction(action){
  if(locked||composing||!session||unsupportedDocument()||!commitFields())return;
  try{assertActive();disposeBlockEditor();deleted=null;removedBlock=null;session[action]();renderEditor(snapshot());}
  catch{if(!invalid)$('edit-error').textContent='This edit could not be restored. Your current draft is retained.';}
}
async function showDeviceBackups(){
  if(locked||!session||!backup||!await canLeave())return;
  const id=snapshot().record.lesson.id,stamp=epoch;busy(true);
  try{const record=await client.get(id);if(current(stamp))await attachRecord(record);}
  catch(error){if(current(stamp))$('library-status').textContent=plainError(error);}
  finally{if(current(stamp))busy(false);}
}
async function showVersionHistory(){
  if(locked||composing||!session||!await canLeave()||composing)return;
  const stamp=epoch,activeClient=client;let restoreFocus=false;busy(true);
  try{
    assertActive();
    const opened=openHistoryDialog({dialog:$('history-dialog'),client,record:snapshot().record,mathEngine:katex,
      isCurrent:()=>current(stamp)&&client===activeClient,resolveAsset:previewAssetResolver()});
    historyDialog=opened;
    const fresh=await opened.closed;
    if(historyDialog===opened)historyDialog=null;
    if(current(stamp)){if(fresh){await attachRecord(fresh);restoreFocus=true;}else closeStudio('This workspace is no longer available to your account. Sign in again to verify access.');}
  }catch(error){if(current(stamp))$('library-status').textContent=plainError(error);}
  finally{if(current(stamp)){busy(false);if(restoreFocus)$('version-history').focus();}}
}
async function reloadDraft(){
  if(!session)return;const active=session;
  discardAction=async()=>{try{busy(true);const result=await active.discardAndReload();if(session===active&&!invalid&&result.status==='saved'&&!result.dirty){disposeBlockEditor();deleted=null;removedBlock=null;selectedBlock=null;selectedSlide=null;renderEditor(snapshot());}}catch(error){if(!invalid)$('save-message').textContent=plainError(error);}finally{if(!invalid)busy(false);}};
  $('discard-dialog').showModal();$('keep-edits').focus();
}
async function presentLesson(){
  if(locked||composing||!session||!await canLeave()||composing)return;
  const stamp=epoch,activeClient=client,id=snapshot().record.lesson.id;let restoreFocus=false;busy(true);
  try{
    assertActive();const fresh=await client.get(id);if(!current(stamp))return;
    disposeLessonPreview($('slide-canvas'));$('slide-canvas').replaceChildren();
    const opened=openLessonPresentation({dialog:$('presentation-dialog'),document:fresh.head.document,mathEngine:katex,
      isCurrent:()=>{if(!current(stamp)||client!==activeClient)return false;try{activeClient.assertCurrent();return true;}catch{closeStudio();return false;}},resolveAsset:previewAssetResolver()});
    presentationView=opened;await opened.closed;if(presentationView===opened)presentationView=null;
    if(!current(stamp))return;
    try{const latest=await client.get(id);if(current(stamp)){await attachRecord(latest);restoreFocus=true;}}
    catch{if(current(stamp))closeStudio('Presentation closed. Reconnect and sign in to verify the current lesson before editing.');}
  }catch(error){if(current(stamp)){if([401,403,404].includes(error?.status))closeStudio('This lesson is no longer available to your account. Sign in again to verify access.');else{renderEditor(snapshot());$('library-status').textContent=plainError(error);}}}
  finally{if(current(stamp)){busy(false);if(restoreFocus)$('present-lesson').focus();}}
}
for(const id of ['slide-title','slide-layout','slide-text','private-notes']){
  $(id).addEventListener('change',()=>{if(commitField(id)&&session)renderEditor(snapshot());});
  if(id!=='slide-layout')$(id).addEventListener('input',()=>commitField(id));
}
for(const [id,action] of [['add-slide','add'],['duplicate-slide','duplicate'],['delete-slide','delete'],['undo-delete','undo'],['move-slide-up','up'],['move-slide-down','down']])$(id).addEventListener('click',()=>slideAction(action));
for(const [id,action] of [['add-text-block','rich-text'],['add-math-block','math'],['add-callout-block','callout'],['upgrade-block','upgrade'],['move-block-up','up'],['move-block-down','down'],['delete-block','delete'],['undo-delete-block','undo']])$(id).addEventListener('click',()=>blockAction(action));
for(const type of LESSON_MEDIA_TYPES)$(`add-${type}-block`).addEventListener('click',()=>openMediaInsert(type));
$('confirm-media-insert').addEventListener('click',confirmMediaInsert);
$('cancel-media-insert').addEventListener('click',closeMediaInsert);
$('media-insert-dialog').addEventListener('cancel',event=>{event.preventDefault();closeMediaInsert();});
$('block-select').addEventListener('change',event=>{if(locked||!commitFields()){event.target.value=selectedBlock;return;}selectedBlock=event.target.value;disposeBlockEditor();renderEditor(snapshot());});
$('class-select').addEventListener('change',event=>chooseClass(event.target.value));
$('new-lesson').addEventListener('click',()=>showCreate().catch(error=>{if(!invalid)$('library-status').textContent=plainError(error);}));
$('cancel-create').addEventListener('click',()=>{$('new-lesson-dialog').close();if(!pendingCreate){$('create-form').reset();importSelection=null;renderImportOption();}});
$('new-lesson-dialog').addEventListener('cancel',()=>{if(!pendingCreate){importSelection=null;renderImportOption();}});
$('catalog-select').addEventListener('change',()=>{if(locked||pendingCreate)return;importSelection=null;$('new-title').value=classContext.catalog.find(item=>item.access_key===$('catalog-select').value)?.title||'';renderImportOption();});
$('review-ib13-import').addEventListener('click',reviewIB13Import);
$('clear-ib13-import').addEventListener('click',()=>{if(!locked&&!composing&&!pendingCreate){importSelection=null;renderImportOption();}});
$('create-form').addEventListener('submit',createLesson);$('pin-form').addEventListener('submit',pinCourse);
$('save-now').addEventListener('click',async()=>{if(commitFields())await session?.flush();});
$('undo-edit').addEventListener('click',()=>historyAction('undo'));
$('redo-edit').addEventListener('click',()=>historyAction('redo'));
$('device-backups').addEventListener('click',showDeviceBackups);
$('version-history').addEventListener('click',showVersionHistory);
$('present-lesson').addEventListener('click',presentLesson);
$('keep-server-draft').addEventListener('click',()=>recoveryChoice?.(null));
$('recovery-dialog').addEventListener('cancel',event=>{event.preventDefault();recoveryChoice?.(null);});
document.addEventListener('compositionstart',()=>{composing=true;$('create-lesson').disabled=true;renderImportOption();if(session)renderStatus(snapshot());});
document.addEventListener('compositionend',()=>{composing=false;$('create-lesson').disabled=locked;renderImportOption();if(session&&!locked){commitFields();renderStatus(snapshot());}});
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.isComposing||event.altKey||!(event.ctrlKey||event.metaKey)||document.querySelector('dialog[open]')||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  const key=event.key.toLowerCase();if(key!=='z'&&!(key==='y'&&!event.shiftKey))return;
  if(!session||locked)return;event.preventDefault();historyAction(key==='y'||event.shiftKey?'redo':'undo');
});
window.addEventListener('online',()=>{if(!invalid&&session&&snapshot().status==='offline'&&!editorInvalid&&!composing)void session.retry();});
$('retry-save').addEventListener('click',async()=>{if(commitFields())await session?.retry();});
$('reload-draft').addEventListener('click',reloadDraft);
$('keep-edits').addEventListener('click',()=>{discardAction=null;$('discard-dialog').close();});
$('discard-edits').addEventListener('click',async()=>{const action=discardAction;discardAction=null;$('discard-dialog').close();await action?.();});
$('discard-dialog').addEventListener('cancel',()=>{discardAction=null;});
$('preview-lesson').addEventListener('click',preview);$('close-preview').addEventListener('click',()=>{$('preview-dialog').close();$('preview-slides').replaceChildren();});
$('preview-dialog').addEventListener('close',()=>{disposeLessonPreview($('preview-slides'));$('preview-slides').replaceChildren();$('preview-heading').textContent='';});
window.addEventListener('beforeunload',event=>{if(historyDialog?.hasPending()||mediaInsert||pendingCreate||editorInvalid||(session&&(snapshot().dirty||document.querySelector('[aria-invalid="true"]')))){event.preventDefault();event.returnValue='';}});
window.addEventListener('pagehide',()=>closeStudio('Reopen Lesson Studio to verify your school session.'));
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

async function initialize(){
  try{
    client=createStudioClient({institution:window.ECHSInstitution,window,fetch:window.fetch.bind(window),mathEngine:katex,onInvalidSession:()=>closeStudio()});
    await client.initialize();if(invalid)return;const stamp=epoch,context=await client.context();if(!current(stamp))return;
    classes=context.classes;$('studio-identity').textContent=client.actor().display_name||'School '+client.actor().role;
    $('class-select').replaceChildren(Object.assign(text('option','Choose a class'),{value:''}),...classes.map(item=>Object.assign(text('option',item.name),{value:item.id})));
    $('studio-gate').hidden=true;$('studio-app').hidden=false;
    if(!classes.length)$('empty-state').textContent='There are no classes assigned to this account. A school administrator can manage class access.';
    const params=new URLSearchParams(location.search),classId=params.get('class'),lessonId=params.get('lesson');
    if(classId&&uuidPattern.test(classId)&&classes.some(item=>item.id===classId))await chooseClass(classId);
    else if(classes.length===1)await chooseClass(classes[0].id);
    if(lessonId&&uuidPattern.test(lessonId)&&library.some(item=>item.id===lessonId))await openLesson(lessonId);
  }catch(error){if(!invalid){closeStudio(plainError(error));showGate(plainError(error),{retry:true});}}
}
initialize();
