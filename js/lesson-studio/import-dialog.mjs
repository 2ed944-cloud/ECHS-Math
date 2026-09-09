import {IB13_REFERENCE} from './ib13-reference.mjs';
import {createIB13Import} from './ib13-import-model.mjs';
import {renderSlidePreview,disposeLessonPreview} from './preview.mjs';

const dialogs=new WeakMap();
const ORIGINAL_SOURCE='lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html';

/** Staff review only. Returns source IDs; saving, publication and authority remain
 * with the parent Studio workflow. No source script, private note or media loads. */
export function openIB13ImportDialog({dialog,baseDocument,mathEngine,isCurrent,selectedSlideIds}={}){
  if(!dialog?.ownerDocument||typeof dialog.showModal!=='function'||typeof isCurrent!=='function')throw new TypeError('A current staff import dialog is required.');
  const doc=dialog.ownerDocument,win=doc.defaultView;
  if(!win||!dialog.isConnected)throw new TypeError('The import dialog must be connected.');
  let disposed=false,resolveClosed,timer,observer,base=null,previewDocument=null,selection=null,previewId=null,previewFailed=false;
  let opener=doc.activeElement;const listeners=[],checkboxes=new Map(),previewButtons=new Map();
  const closed=new Promise(resolve=>{resolveClosed=resolve;});
  const el=(tag,text,attrs={})=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node;};
  const shell=el('div',undefined,{class:'lesson-import-shell'});
  const header=el('header',undefined,{class:'lesson-import-header'}),heading=el('h2','Review IB 1.3 content',{id:'ib13-import-heading',tabindex:-1});
  const cancel=el('button','Cancel import',{id:'ib13-import-cancel',type:'button'});header.append(heading,cancel);
  const description=el('p','Editable slides use fresh wording for the same concepts. Original investigations, questions and calculator activities stay in the original lesson.',{id:'ib13-import-description',class:'lesson-import-description'});
  const original=el('a','Open the original IB 1.3 lesson',{id:'ib13-import-source',target:'_blank',rel:'noopener noreferrer',referrerpolicy:'no-referrer'});
  original.title='Opens the original guarded lesson in a new tab';
  const summary=el('p','',{id:'ib13-import-summary',role:'status','aria-live':'polite','aria-atomic':'true'});
  const tools=el('div',undefined,{class:'lesson-import-tools'}),selectAll=el('button','Select all editable slides',{id:'ib13-import-select-all',type:'button'}),clear=el('button','Clear selection',{id:'ib13-import-clear-selection',type:'button'});
  tools.append(selectAll,clear);
  const body=el('div',undefined,{class:'lesson-import-body'});
  const listSection=el('section',undefined,{'aria-labelledby':'ib13-import-list-heading',class:'lesson-import-ledger'});
  const listHeading=el('h3','All source slides',{id:'ib13-import-list-heading'}),list=el('ol',undefined,{id:'ib13-import-list'});listSection.append(listHeading,list);
  const detail=el('section',undefined,{class:'lesson-import-detail','aria-labelledby':'ib13-import-preview-heading'});
  const previewHeading=el('h3','Choose a source slide',{id:'ib13-import-preview-heading'}),previewStatus=el('p','',{id:'ib13-import-preview-status',class:'lesson-import-preview-status'});
  const preview=el('article',undefined,{id:'ib13-import-preview',class:'lesson-import-preview'});detail.append(previewHeading,previewStatus,preview);
  body.append(listSection,detail);
  const footer=el('footer',undefined,{class:'lesson-import-footer'});
  const publication=el('p','References must be resolved before this draft can be published.',{class:'lesson-import-publication'});
  const error=el('p','',{id:'ib13-import-error',role:'alert'}),use=el('button','Use selected content',{id:'ib13-import-use',type:'button'});
  footer.append(publication,error,use);shell.append(header,description,original,summary,tools,body,footer);
  const api=Object.freeze({closed,dispose:()=>close(null)});
  const on=(target,type,listener)=>{target.addEventListener(type,listener);listeners.push(()=>target.removeEventListener(type,listener));};
  function rawCurrent(){try{return typeof isCurrent==='function'&&isCurrent()===true;}catch{return false;}}
  function current(){if(disposed)return false;if(!rawCurrent()||disposed){close(null);return false;}return true;}
  function clearPreview(){
    disposeLessonPreview(preview);
    for(const node of [...preview.querySelectorAll('*')].reverse())node.replaceChildren();
    preview.replaceChildren();
  }
  function close(result){
    if(disposed)return;disposed=true;
    // Parent authorization checks can call dispose again. Close is marked before
    // asking the parent, and a selection is delivered only to the current owner.
    const authorized=rawCurrent();if(!authorized)result=null;
    win.clearInterval(timer);observer?.disconnect();for(const remove of listeners.splice(0))remove();
    clearPreview();
    for(const node of [...shell.querySelectorAll('*')].reverse()){
      if('value'in node)node.value='';if('checked'in node)node.checked=false;if('disabled'in node)node.disabled=true;
      node.removeAttribute('href');node.replaceChildren();
    }
    shell.replaceChildren();
    if(dialogs.get(dialog)===api){dialogs.delete(dialog);if(dialog.open)dialog.close();dialog.replaceChildren();dialog.removeAttribute('aria-labelledby');dialog.removeAttribute('aria-describedby');}
    selection?.clear();checkboxes.clear();previewButtons.clear();base=null;previewDocument=null;baseDocument=null;selectedSlideIds=null;previewId=null;
    if(authorized&&opener?.isConnected)opener.focus?.();opener=null;isCurrent=null;mathEngine=null;
    resolveClosed(result);
  }
  function showPreview(id){
    if(!current())return;
    const row=IB13_REFERENCE.slides.find(item=>item.id===id);if(!row)return;
    clearPreview();previewId=id;
    for(const [key,button] of previewButtons)button.setAttribute('aria-current',String(key===id));
    previewHeading.textContent=`Source slide ${row.sourceIndex}: ${row.title}`;
    if(row.disposition==='native'){
      previewStatus.textContent=selection.has(id)?'Selected: this content will be editable in the draft.':'Preview only: this slide will remain a reference unless selected.';
      const index=previewDocument.slides.findIndex(slide=>slide.id===id);
      try{renderSlidePreview({root:preview,document:previewDocument,slideIndex:index,mathEngine});previewFailed=false;}
      catch{previewFailed=true;clearPreview();preview.append(el('p','This preview could not be displayed safely. Try previewing the content again, or close the review.'));}
    }else{
      previewStatus.textContent='Kept as a reference to the original lesson.';
      preview.append(el('p',row.reason),el('p','The original lesson retains this activity and its behavior. It is not converted into editable content here.'));
    }
    updateSelection();
  }
  function updateSelection(){
    if(!current())return;
    const count=selection.size,total=IB13_REFERENCE.slides.length;
    for(const [id,checkbox] of checkboxes)checkbox.checked=selection.has(id);
    summary.textContent=`All ${total} source slides are retained: ${count} editable ${count===1?'slide':'slides'} and ${total-count} references.`;
    use.disabled=count===0||previewFailed;clear.disabled=count===0;selectAll.disabled=count===checkboxes.size;
    error.textContent=previewFailed?'The content preview is unavailable. Preview editable content successfully before continuing.':count===0?'Select at least one editable source slide.':'';
    if(previewId){const row=IB13_REFERENCE.slides.find(item=>item.id===previewId);if(row?.disposition==='native')previewStatus.textContent=selection.has(previewId)?'Selected: this content will be editable in the draft.':'Preview only: this slide will remain a reference unless selected.';}
  }
  function confirm(){
    if(!current()||!selection.size||previewFailed)return;
    try{
      const result=createIB13Import({baseDocument:base,selectedSlideIds:[...selection],mathEngine});
      if(!current())return;
      close(Object.freeze({selectedSlideIds:Object.freeze([...result.summary.selectedSlideIds])}));
    }catch{if(current())error.textContent='The selected content could not be validated. Close this review and try again.';}
  }
  try{
    // The model validates the document and selection before this view can replace
    // anything already mounted in the supplied native dialog.
    const all=createIB13Import({baseDocument,mathEngine});
    const initial=selectedSlideIds===undefined?all:createIB13Import({baseDocument,selectedSlideIds,mathEngine});
    base=JSON.parse(JSON.stringify(baseDocument));previewDocument=all.document;
    selection=new Set(initial.summary.selectedSlideIds);baseDocument=null;selectedSlideIds=null;
    if(!rawCurrent()||disposed)throw new Error('The import review is no longer available.');
    if(IB13_REFERENCE.source.path!==ORIGINAL_SOURCE||IB13_REFERENCE.slides.length!==78||previewDocument.slides.length!==78)throw new Error('Unsupported source reference.');
    const repository=new URL('../../',import.meta.url),destination=new URL(ORIGINAL_SOURCE,repository);
    if(destination.origin!==doc.location.origin||destination.pathname!==repository.pathname+ORIGINAL_SOURCE)throw new Error('The original lesson must belong to this site.');
    destination.hash='learn';original.href=destination.href;
    const prior=dialogs.get(dialog);if(dialog.open&&!prior)throw new Error('The dialog is already in use.');prior?.dispose();
    if(!rawCurrent()||disposed)throw new Error('The import review is no longer available.');
    dialogs.set(dialog,api);dialog.classList.add('lesson-import-dialog');dialog.setAttribute('aria-labelledby','ib13-import-heading');dialog.setAttribute('aria-describedby','ib13-import-description');
    for(const row of IB13_REFERENCE.slides){
      const item=el('li',undefined,{'data-import-slide-id':row.id,class:'lesson-import-row'});
      const title=el('span',`${row.sourceIndex}. ${row.title}`,{class:'lesson-import-row-title'});
      if(row.disposition==='native'){
        const label=el('label',undefined,{class:'lesson-import-check'}),checkbox=el('input',undefined,{type:'checkbox','data-import-select':row.id,'aria-describedby':`${row.id}-import-reason`});
        checkbox.checked=selection.has(row.id);checkboxes.set(row.id,checkbox);label.append(checkbox,title);item.append(label);
        on(checkbox,'change',()=>{if(!current())return;if(checkbox.checked)selection.add(row.id);else selection.delete(row.id);updateSelection();});
      }else item.append(title);
      item.append(el('span',row.disposition==='native'?'Editable option':'Original lesson reference',{class:'lesson-import-disposition'}));
      item.append(el('p',row.reason,{id:`${row.id}-import-reason`,class:'lesson-import-reason'}));
      if(row.coverage?.length)item.append(el('p','Concepts: '+row.coverage.join('; '),{class:'lesson-import-coverage'}));
      const button=el('button',row.disposition==='native'?'Preview editable content':'Review reference',{type:'button','data-import-preview':row.id,'aria-current':'false'});
      button.setAttribute('aria-label',`${row.disposition==='native'?'Preview':'Review'} source slide ${row.sourceIndex}: ${row.title}`);
      previewButtons.set(row.id,button);item.append(button);list.append(item);on(button,'click',()=>showPreview(row.id));
    }
    on(cancel,'click',()=>close(null));on(use,'click',confirm);
    on(selectAll,'click',()=>{if(!current())return;selection=new Set(checkboxes.keys());updateSelection();});
    on(clear,'click',()=>{if(!current())return;selection.clear();updateSelection();});
    on(original,'click',event=>{if(!current())event.preventDefault();});
    on(dialog,'cancel',event=>{event.preventDefault();close(null);});
    on(dialog,'close',()=>{if(!dialog.open)close(null);});
    for(const event of ['storage','focus','popstate','echs:institution-signout'])on(win,event,()=>current());
    dialog.replaceChildren(shell);updateSelection();showPreview([...selection][0]);if(!current())throw new Error('The import review is no longer available.');dialog.showModal();heading.focus({preventScroll:true});
    observer=new win.MutationObserver(()=>{if(!dialog.isConnected||!dialog.open)close(null);});observer.observe(doc.documentElement,{childList:true,subtree:true});
    timer=win.setInterval(()=>current(),200);return api;
  }catch(error){close(null);throw error;}
}
