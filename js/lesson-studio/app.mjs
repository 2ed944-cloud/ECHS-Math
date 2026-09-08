import katex from '../../lessons/ib-math-ai/unit-1/assets/js/katex.js';
import {createStudioClient} from './api-client.mjs';
import {createLessonDraft,addSlide,duplicateSlide,renameSlide,moveSlide,removeSlide,restoreRemovedSlide,updateSlide} from './draft-model.mjs';
import {createDraftSession} from './draft-session.mjs';
import {renderSlidePreview,renderLessonPreview} from './preview.mjs';

const $=id=>document.getElementById(id);
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let client=null,session=null,classes=[],classContext=null,library=[],selectedSlide=null,deleted=null;
let epoch=0,locked=false,invalid=false,discardAction=null,pendingCreate=null;
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
  invalid=true;epoch++;session?.dispose();session=null;client?.dispose();client=null;
  classes=[];classContext=null;library=[];selectedSlide=null;deleted=null;discardAction=null;pendingCreate=null;
  for(const dialog of document.querySelectorAll('dialog'))if(dialog.open)dialog.close();
  for(const control of document.querySelectorAll('input,textarea,select'))control.value='';
  for(const id of ['slide-canvas','preview-slides','slide-list','lesson-list','class-select','catalog-select','course-version-select'])$(id).replaceChildren();
  for(const id of ['studio-identity','lesson-heading','preview-heading','new-heading','course-status','library-status','edit-error','create-error','save-message','slide-count','save-status'])$(id).textContent='';
  $('workspace').hidden=true;$('new-lesson').disabled=true;showGate(message);
}
function busy(value){locked=value;$('new-lesson').disabled=value||!classContext?.current_assignment;
  $('workspace').inert=value;$('workspace').setAttribute('aria-busy',String(value));
  $('class-select').disabled=value;$('create-lesson').disabled=value;$('pin-course').disabled=value;
  for(const button of $('lesson-list').querySelectorAll('button'))button.disabled=value;
}
function setValue(id,value){const control=$(id);if(document.activeElement!==control)control.value=value;}
function snapshot(){return session?.snapshot();}
function selected(){return snapshot()?.document.slides.find(slide=>slide.id===selectedSlide);}
function editableText(slide){
  const block=slide?.blocks.find(item=>item.type==='rich-text');
  const editable=Boolean(block&&block.content.paragraphs.every(p=>p.children.every(c=>c.type==='text'&&!c.marks?.length)));
  return {block,editable,value:block?block.content.paragraphs.map(p=>p.children.map(c=>c.type==='math'?c.spoken:c.text).join('')).join('\n\n'):''};
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
    state.status==='offline'?'Your edits are kept in this open tab. Reconnect and retry before closing it.':
    state.status==='invalid'?'Some content needs attention before it can be saved.':'Saving failed. Your edits are kept in this open tab. Retry to check the server before saving again.';
  $('retry-save').hidden=state.status==='conflict'||state.status==='invalid';
  $('reload-draft').hidden=!['conflict','offline','error'].includes(state.status);
  $('save-now').disabled=!state.dirty||state.status==='saving'||needsAttention;
}
function renderEditor(state){
  if(invalid||!session)return;assertActive();
  const lesson=state.document;
  if(!lesson.slides.some(slide=>slide.id===selectedSlide))selectedSlide=lesson.slides[0].id;
  const index=lesson.slides.findIndex(slide=>slide.id===selectedSlide),slide=lesson.slides[index];
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
  try{renderSlidePreview({root:$('slide-canvas'),document:lesson,slideIndex:index,mathEngine:katex});}
  catch{$('slide-canvas').replaceChildren(text('p','This slide needs valid content before it can be previewed.'));}
  renderLibrary();
}
function selectSlide(id){
  if(locked)return;
  try{assertActive();if(!commitFields())return;selectedSlide=id;$('edit-error').textContent='';renderEditor(snapshot());}
  catch(error){if(!invalid)$('edit-error').textContent=plainError(error);}
}
function changeDocument(transform){
  if(!session||locked)return;
  const priorSlide=selectedSlide,priorDeleted=deleted;
  try{assertActive();const before=snapshot().document,next=transform(before);session.editDocument(next);$('edit-error').textContent='';renderEditor(snapshot());}
  catch(error){if(!invalid){selectedSlide=priorSlide;deleted=priorDeleted;$('edit-error').textContent='Check the slide content and document limits. Titles and text must be nonempty plain text without HTML.';renderStatus(snapshot());}}
}
function commitField(id){
  if(!session||locked)return true;
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
    if(id==='private-notes'){if($(id).value!==snapshot().privateNotes)session.editNotes($(id).value);}
    else if(next!==original)session.editDocument(next);
    $(id).removeAttribute('aria-invalid');$('edit-error').textContent='';return true;
  }catch(error){if(!invalid){$(id).setAttribute('aria-invalid','true');$('edit-error').textContent='Check this field. Required text cannot be blank or contain HTML.';}return false;}
}
function commitFields(){for(const id of ['slide-title','slide-layout','slide-text','private-notes'])if(!commitField(id))return false;return true;}
async function canLeave(){
  if(pendingCreate){$('library-status').textContent='Check the pending lesson creation before changing classes or lessons.';return false;}
  if(!session)return true;if(!commitFields())return false;
  if(snapshot().dirty)await session.flush();
  if(invalid)return false;
  if(snapshot().dirty){$('library-status').textContent='Save or resolve this draft before opening another lesson.';return false;}
  return true;
}
function attachRecord(record){
  assertActive();session?.dispose();selectedSlide=record.head.document.slides[0].id;deleted=null;
  session=createDraftSession({client,record,mathEngine:katex,delayMs:800,isCurrent:()=>!invalid&&Boolean(client),onChange:state=>{if(!invalid&&session)renderEditor(state);}});
  renderEditor(snapshot());$('library-status').textContent='';
}
function clearWorkspace(){session?.dispose();session=null;selectedSlide=null;deleted=null;$('workspace').hidden=true;$('empty-state').hidden=false;
  for(const id of ['slide-canvas','slide-list','preview-slides'])$(id).replaceChildren();for(const id of ['slide-title','slide-text','private-notes'])$(id).value='';
}
async function openLesson(id){
  if(locked||snapshot()?.record.lesson.id===id)return;
  if(!await canLeave())return;busy(true);const stamp=++epoch;
  try{const record=await client.get(id);if(!current(stamp))return;attachRecord(record);}
  catch(error){if(current(stamp))$('library-status').textContent=plainError(error);}
  finally{if(current(stamp))busy(false);}
}
async function chooseClass(id){
  if(locked)return;
  const previous=classContext?.class.id||'';
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
  if(locked||!classContext?.current_assignment)return;
  if(pendingCreate){$('new-lesson-dialog').showModal();return;}
  if(!await canLeave())return;
  assertActive();const used=new Set(library.map(item=>item.access_key));
  const choices=classContext.catalog.filter(item=>!used.has(item.access_key));
  if(!choices.length){$('library-status').textContent='Every lesson location already has a draft. Open an existing lesson to edit it.';return;}
  $('create-form').reset();$('create-error').textContent='';setCreatePending(false);
  $('catalog-select').replaceChildren(...choices.map(item=>{const option=text('option',`${item.topic} · ${item.title}`);option.value=item.access_key;return option;}));
  $('new-title').value=choices[0].title;$('new-lesson-dialog').showModal();$('new-title').focus();
}
function setCreatePending(value){
  for(const control of $('create-form').querySelectorAll('input,textarea,select'))control.disabled=value;
  $('create-lesson').textContent=value?'Check saved lesson':'Create lesson';
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
  event.preventDefault();if(locked||!classContext)return;const stamp=epoch;busy(true);
  try{
    assertActive();
    if(!pendingCreate){
      const catalog=classContext.catalog.find(item=>item.access_key===$('catalog-select').value);
      if(!catalog)throw new Error('Invalid lesson location.');const id=crypto.randomUUID();
      const skill=$('new-skill').value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'teaching-focus';
      const document=createLessonDraft({lessonId:id,courseVersionId:classContext.current_assignment.course_version_id,catalog,
        title:$('new-title').value.trim(),objective:$('new-objective').value.trim(),skill:`teacher:${id}:skill:${skill}`,summary:$('new-summary').value.trim()});
      pendingCreate={submitted:false,rejected:false,payload:{class_id:classContext.class.id,course_version_id:classContext.current_assignment.course_version_id,access_key:catalog.access_key,document,private_notes:'',expected_revision:0}};
    }
    setCreatePending(true);const record=await createOrReconcile(pendingCreate);
    if(!current(stamp))return;pendingCreate=null;setCreatePending(false);
    if(!library.some(item=>item.id===record.lesson.id))library.push(record.lesson);
    $('new-lesson-dialog').close();$('create-form').reset();attachRecord(record);
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
    renderLessonPreview({root:$('preview-slides'),document:lesson,mathEngine:katex});$('preview-dialog').showModal();
  }catch(error){if(!invalid)$('edit-error').textContent='Check the lesson content before previewing.';}
}
async function reloadDraft(){
  if(!session)return;const active=session;
  discardAction=async()=>{try{await active.discardAndReload();if(session===active&&!invalid){deleted=null;selectedSlide=null;renderEditor(snapshot());}}catch(error){if(!invalid)$('save-message').textContent=plainError(error);}};
  $('discard-dialog').showModal();$('keep-edits').focus();
}
for(const id of ['slide-title','slide-layout','slide-text','private-notes']){
  $(id).addEventListener('change',()=>{if(commitField(id)&&session)renderEditor(snapshot());});
  if(id!=='slide-layout')$(id).addEventListener('input',()=>commitField(id));
}
for(const [id,action] of [['add-slide','add'],['duplicate-slide','duplicate'],['delete-slide','delete'],['undo-delete','undo'],['move-slide-up','up'],['move-slide-down','down']])$(id).addEventListener('click',()=>slideAction(action));
$('class-select').addEventListener('change',event=>chooseClass(event.target.value));
$('new-lesson').addEventListener('click',()=>showCreate().catch(error=>{if(!invalid)$('library-status').textContent=plainError(error);}));
$('cancel-create').addEventListener('click',()=>{$('new-lesson-dialog').close();if(!pendingCreate)$('create-form').reset();});
$('catalog-select').addEventListener('change',()=>{$('new-title').value=classContext.catalog.find(item=>item.access_key===$('catalog-select').value)?.title||'';});
$('create-form').addEventListener('submit',createLesson);$('pin-form').addEventListener('submit',pinCourse);
$('save-now').addEventListener('click',async()=>{if(commitFields())await session?.flush();});
$('retry-save').addEventListener('click',async()=>{if(commitFields())await session?.retry();});
$('reload-draft').addEventListener('click',reloadDraft);
$('keep-edits').addEventListener('click',()=>{discardAction=null;$('discard-dialog').close();});
$('discard-edits').addEventListener('click',async()=>{const action=discardAction;discardAction=null;$('discard-dialog').close();await action?.();});
$('discard-dialog').addEventListener('cancel',()=>{discardAction=null;});
$('preview-lesson').addEventListener('click',preview);$('close-preview').addEventListener('click',()=>{$('preview-dialog').close();$('preview-slides').replaceChildren();});
$('preview-dialog').addEventListener('close',()=>{$('preview-slides').replaceChildren();$('preview-heading').textContent='';});
window.addEventListener('beforeunload',event=>{if(pendingCreate||(session&&(snapshot().dirty||document.querySelector('[aria-invalid="true"]')))){event.preventDefault();event.returnValue='';}});
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
