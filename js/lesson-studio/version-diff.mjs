import {assertDraftDocument} from './draft-model.mjs';
import {compileMathSource} from '../lesson-runtime/math-expression.mjs';

export const VERSION_DIFF_LIMITS=Object.freeze({changes:200,text:1200,totalText:64000});
const trustedComparisons=new WeakSet();
const identities=['lesson_id','course_version_id','unit_id','topic_id','slug'];
const blockNames={'rich-text':'Text',math:'Mathematics',callout:'Callout',image:'Image',video:'Video',table:'Table',resource:'PDF resource','legacy-embedded':'Legacy reference'};
const copy=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
function invalid(){throw Object.assign(new TypeError('Compare two valid saved drafts from the same lesson.'),{code:'invalid_version_comparison'});}
function projection(value,mathEngine){
  if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value)))invalid();
  const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(descriptors);
  if(keys.length!==2||['document','private_notes'].some(key=>!descriptors[key]||!Object.hasOwn(descriptors[key],'value')||!descriptors[key].enumerable))invalid();
  const document=descriptors.document.value,notes=descriptors.private_notes.value;
  assertDraftDocument(document,{mathEngine});
  if(typeof notes!=='string'||notes.length>20000||notes.includes('\0'))invalid();
  return {document:copy(document),private_notes:notes};
}
// Key order and the order of independent text marks have no semantic meaning.
function normalized(value){
  if(Array.isArray(value)){
    const result=[];
    for(const item of value.map(normalized)){
      const prior=result.at(-1);
      if(item?.type==='text'&&prior?.type==='text'&&JSON.stringify(item.marks||[])===JSON.stringify(prior.marks||[]))prior.text+=item.text;
      else result.push(item);
    }
    return result;
  }
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(key=>key!=='marks'||value.marks.length).map(key=>[key,key==='marks'?[...value[key]].sort():normalized(value[key])]));
  return value;
}
const same=(a,b)=>JSON.stringify(normalized(a))===JSON.stringify(normalized(b));
const position=index=>String(index+1);
const labelFor=block=>blockNames[block.type]+' block '+block.id;
function inlineText(nodes){
  return nodes.map(node=>{
    if(node.type==='text'){
      const marks=node.marks||[],prefix=[marks.includes('strong')?'bold':'',marks.includes('em')?'italic':''].filter(Boolean).join(', ');
      return prefix?'['+prefix+'] '+node.text+' [end formatting]':node.text;
    }
    if(node.type==='link')return 'Link: '+inlineText(node.children)+' (destination: '+node.href+')';
    return mathText(node);
  }).join('');
}
function mathText(content){
  return 'Mathematics: '+content.spoken+'\n'+(content.source?.mode==='visual'?'Visual expression: ':'TeX expression: ')+(content.source?compileMathSource(content.source):content.tex);
}
function richText(content){
  return (content.nodes||content.paragraphs).map(node=>node.type==='paragraph'?inlineText(node.children):node.items.map((item,index)=>(node.style==='ordered'?position(index)+'. ':'• ')+inlineText(item.children)).join('\n')).join('\n\n');
}
function blockText(block){
  const value=block.content;
  switch(block.type){
    case 'rich-text':return richText(value);
    case 'math':return mathText(value)+'\nDisplay: '+(value.display?'display equation':'inline equation');
    case 'callout':return value.kind+': '+value.title+'\n'+richText(value.body);
    case 'image':return 'Asset: '+value.asset_id+'\n'+(value.decorative?'Decorative image':'Alternative text: '+value.alt)+'\nCaption: '+value.caption+'\nDescription: '+value.description;
    case 'video':return 'Provider: '+value.provider+'\nVideo ID: '+value.video_id+'\nTitle: '+value.title+'\nStart: '+value.start_seconds+' seconds\nTranscript: '+value.transcript;
    case 'resource':return 'Asset: '+value.asset_id+'\nTitle: '+value.title+'\nDescription: '+value.description;
    case 'table':return value.caption+'\n'+value.columns.map(column=>column.label).join(' | ')+'\n'+value.rows.map(row=>row.cells.map(inlineText).join(' | ')).join('\n');
    case 'legacy-embedded':return value.summary+'\nSource: '+value.source+(value.anchor?'#'+value.anchor:'')+'\nSource hash: '+value.sha256;
  }
}
function commonPositions(before,after){
  const leftIds=new Set(before.map(value=>value.id)),rightIds=new Set(after.map(value=>value.id));
  return [new Map(before.filter(value=>rightIds.has(value.id)).map((value,index)=>[value.id,index])),new Map(after.filter(value=>leftIds.has(value.id)).map((value,index)=>[value.id,index]))];
}

/** Staff-only descriptive comparison. No state, source conversion, media loading,
 * raw JSON view or public-document export. Revision counters alone are ignored.
 */
export function compareLessonVersions({before,after,mathEngine}={}){
  let left,right;
  try{
    if(!mathEngine||mathEngine.version!=='0.16.27'||typeof mathEngine.renderToString!=='function')invalid();
    left=projection(before,mathEngine);right=projection(after,mathEngine);
    if(identities.some(key=>left.document[key]!==right.document[key]))invalid();
  }catch{invalid();}
  const old=left.document,next=right.document,sections=[],bySection=new Map();
  const counts={slidesAdded:0,slidesRemoved:0,slidesMoved:0,blocksAdded:0,blocksRemoved:0,blocksMoved:0,blocksChanged:0,metadataChanges:0,totalChanges:0,shownChanges:0};
  let textBudget=VERSION_DIFF_LIMITS.totalText,omittedChanges=0,truncatedValues=0,contentChanged=false;
  function excerpt(value){
    if(value===null)return {text:null,truncated:false};
    const text=String(typeof value==='function'?value():value),limit=Math.min(VERSION_DIFF_LIMITS.text,textBudget);
    let result=text.slice(0,limit);if(result&&/[\uD800-\uDBFF]$/.test(result))result=result.slice(0,-1);
    textBudget-=result.length;const truncated=result.length<text.length;if(truncated)truncatedValues++;
    return {text:result,truncated};
  }
  function add(section,kind,label,beforeValue,afterValue,privateChange=false){
    counts.totalChanges++;if(!privateChange)contentChanged=true;
    // Notes have a separate budget and section, so many public content changes
    // cannot silently suppress the fact that private notes also changed.
    if(!privateChange&&(counts.shownChanges>=VERSION_DIFF_LIMITS.changes||textBudget<=0)){omittedChanges++;return;}
    let target=bySection.get(section.id);
    if(!target){target={...section,changes:[]};sections.push(target);bySection.set(section.id,target);}
    const priorBudget=textBudget;if(privateChange)textBudget=2*VERSION_DIFF_LIMITS.text;
    const beforeText=excerpt(beforeValue),afterText=excerpt(afterValue);
    if(privateChange)textBudget=priorBudget;else counts.shownChanges++;
    target.changes.push({kind,label,before:beforeText.text,after:afterText.text,beforeTruncated:beforeText.truncated,afterTruncated:afterText.truncated,truncated:beforeText.truncated||afterText.truncated});
  }
  const metadata={id:'metadata',kind:'metadata',title:'Lesson details'};
  function field(section,label,a,b,display=value=>String(value)){
    if(!same(a,b)){add(section,'changed',label,()=>display(a),()=>display(b));if(section===metadata)counts.metadataChanges++;}
  }
  field(metadata,'Title',old.title,next.title);
  field(metadata,'Language',old.accessibility.language,next.accessibility.language);
  field(metadata,'Accessible summary',old.accessibility.summary,next.accessibility.summary);
  field(metadata,'Skills',[...old.skills].sort(),[...next.skills].sort(),value=>value.join('\n'));
  field(metadata,'Contexts',[...old.variants.contexts].sort(),[...next.variants.contexts].sort(),value=>value.join(', '));
  // The draft validator fixes status/audience, but keep their meaning explicit.
  field(metadata,'Publication status',old.publication.status,next.publication.status);
  field(metadata,'Audience',old.publication.audience,next.publication.audience);
  const objectiveMap=new Map(next.objectives.map(value=>[value.id,value])),oldObjectives=new Map(old.objectives.map(value=>[value.id,value]));
  const [oldObjectiveOrder,newObjectiveOrder]=commonPositions(old.objectives,next.objectives);
  for(const objective of old.objectives){
    const counterpart=objectiveMap.get(objective.id);
    if(!counterpart){add(metadata,'removed','Objective '+objective.id,objective.text,null);counts.metadataChanges++;}
    else{field(metadata,'Objective '+objective.id,objective.text,counterpart.text);
      if(oldObjectiveOrder.get(objective.id)!==newObjectiveOrder.get(objective.id)){add(metadata,'moved','Objective '+objective.id,'Position '+position(old.objectives.indexOf(objective)),'Position '+position(next.objectives.indexOf(counterpart)));counts.metadataChanges++;}}
  }
  for(const objective of next.objectives)if(!oldObjectives.has(objective.id)){add(metadata,'added','Objective '+objective.id,null,objective.text);counts.metadataChanges++;}

  const leftSlides=new Map(old.slides.map((slide,index)=>[slide.id,{slide,index}])),rightSlides=new Map(next.slides.map((slide,index)=>[slide.id,{slide,index}]));
  const [oldSlideOrder,newSlideOrder]=commonPositions(old.slides,next.slides);
  const slideSection=(id)=>({id:'slide:'+id,kind:'slide',title:'Slide: '+(rightSlides.get(id)||leftSlides.get(id)).slide.title,slide_id:id});
  for(const [id,{slide,index}] of leftSlides){
    const counterpart=rightSlides.get(id),section=slideSection(id);
    if(!counterpart){counts.slidesRemoved++;add(section,'removed','Slide',slide.title+' (position '+position(index)+')',null);}
    else{
      if(oldSlideOrder.get(id)!==newSlideOrder.get(id)){counts.slidesMoved++;add(section,'moved','Slide order','Position '+position(index),'Position '+position(counterpart.index));}
      field(section,'Slide title',slide.title,counterpart.slide.title);field(section,'Layout',slide.layout,counterpart.slide.layout,value=>({'single':'Single column','two-column':'Two columns','three-panel':'Three panels'})[value]);
    }
  }
  for(const [id,{slide,index}] of rightSlides)if(!leftSlides.has(id)){counts.slidesAdded++;add(slideSection(id),'added','Slide',null,slide.title+' (position '+position(index)+')');}
  const blocks=document=>new Map(document.slides.flatMap(slide=>slide.blocks.map((block,index)=>[block.id,{block,slide_id:slide.id,index}])));
  const leftBlocks=blocks(old),rightBlocks=blocks(next),blockOrders=new Map();
  for(const [id,{slide}] of leftSlides){const counterpart=rightSlides.get(id);if(!counterpart)continue;
    const stableLeft=slide.blocks.filter(block=>rightBlocks.get(block.id)?.slide_id===id),stableRight=counterpart.slide.blocks.filter(block=>leftBlocks.get(block.id)?.slide_id===id);
    blockOrders.set(id,commonPositions(stableLeft,stableRight));}
  function table(section,a,b){
    field(section,'Table caption',a.caption,b.caption);field(section,'First column is a row header',a.row_header,b.row_header,value=>value?'Yes':'No');
    const ac=new Map(a.columns.map((value,index)=>[value.id,{value,index}])),bc=new Map(b.columns.map((value,index)=>[value.id,{value,index}]));
    const ar=new Map(a.rows.map((value,index)=>[value.id,{value,index}])),br=new Map(b.rows.map((value,index)=>[value.id,{value,index}]));
    const [aco,bco]=commonPositions(a.columns,b.columns),[aro,bro]=commonPositions(a.rows,b.rows);
    const rowText=(row,columns)=>columns.map((column,index)=>column.label+': '+inlineText(row.cells[index])).join('\n');
    for(const [id,{value,index}] of ac){const other=bc.get(id);
      if(!other)add(section,'removed','Column '+value.label,()=>value.label+'\n'+a.rows.map(row=>inlineText(row.cells[index])).join('\n'),null);
      else{field(section,'Column '+id+' label',value.label,other.value.label);if(aco.get(id)!==bco.get(id))add(section,'moved','Column '+other.value.label,'Position '+position(index),'Position '+position(other.index));}}
    for(const [id,{value,index}] of bc)if(!ac.has(id))add(section,'added','Column '+value.label,null,()=>value.label+'\n'+b.rows.map(row=>inlineText(row.cells[index])).join('\n'));
    for(const [id,{value,index}] of ar){const other=br.get(id);
      if(!other)add(section,'removed','Row '+id,()=>rowText(value,a.columns),null);
      else{
        if(aro.get(id)!==bro.get(id))add(section,'moved','Row '+id,'Position '+position(index),'Position '+position(other.index));
        for(const [columnId,{index:oldIndex}] of ac){const column=bc.get(columnId);if(column)field(section,'Row '+id+', column '+column.value.label,value.cells[oldIndex],other.value.cells[column.index],inlineText);}
      }}
    for(const [id,{value}] of br)if(!ar.has(id))add(section,'added','Row '+id,null,()=>rowText(value,b.columns));
  }
  function content(section,a,b){
    field(section,'Block format',a.type+' @'+a.version,b.type+' @'+b.version);
    if(a.type!==b.type||a.version!==b.version){if(!same(a.content,b.content))add(section,'changed','Content',()=>blockText(a),()=>blockText(b));return;}
    const x=a.content,y=b.content;
    if(a.type==='rich-text')field(section,'Text, formatting, links and inline mathematics',x,y,richText);
    else if(a.type==='math'){
      field(section,'Expression source',x.source||{mode:'tex',tex:x.tex},y.source||{mode:'tex',tex:y.tex},value=>(value.mode==='visual'?'Visual expression: ':'TeX expression: ')+compileMathSource(value));
      field(section,'Spoken description',x.spoken,y.spoken);field(section,'Equation display',x.display,y.display,value=>value?'Display equation':'Inline equation');
    }else if(a.type==='callout'){field(section,'Callout kind',x.kind,y.kind);field(section,'Callout title',x.title,y.title);field(section,'Callout body',x.body,y.body,richText);}
    else if(a.type==='table')table(section,x,y);
    else{
      const labels={asset_id:'Asset reference',alt:'Alternative text',decorative:'Decorative image',caption:'Caption',description:'Description',provider:'Video provider',video_id:'Video identifier',title:'Title',start_seconds:'Start time in seconds',transcript:'Transcript',source:'Legacy source',anchor:'Legacy anchor',sha256:'Legacy source hash',summary:'Legacy summary'};
      for(const key of Object.keys(x))field(section,labels[key],x[key],y[key],value=>typeof value==='boolean'?value?'Yes':'No':value);
    }
  }
  for(const [id,oldBlock] of leftBlocks){
    const counterpart=rightBlocks.get(id),target=counterpart||oldBlock;
    const section={id:'block:'+id,kind:'block',title:labelFor(target.block),slide_id:target.slide_id,block_id:id};
    if(!counterpart){counts.blocksRemoved++;add(section,'removed','Block',()=>blockText(oldBlock.block),null);continue;}
    const order=blockOrders.get(oldBlock.slide_id);
    if(oldBlock.slide_id!==counterpart.slide_id||(order&&order[0].get(id)!==order[1].get(id))){counts.blocksMoved++;
      add(section,'moved','Block location',leftSlides.get(oldBlock.slide_id).slide.title+' / position '+position(oldBlock.index),rightSlides.get(counterpart.slide_id).slide.title+' / position '+position(counterpart.index));}
    if(!same(oldBlock.block,counterpart.block)){counts.blocksChanged++;content(section,oldBlock.block,counterpart.block);}
  }
  for(const [id,{block,slide_id}] of rightBlocks)if(!leftBlocks.has(id)){counts.blocksAdded++;add({id:'block:'+id,kind:'block',title:labelFor(block),slide_id,block_id:id},'added','Block',null,()=>blockText(block));}
  const contentTruncatedValues=truncatedValues,notesChanged=left.private_notes!==right.private_notes;
  if(notesChanged)add({id:'private-notes',kind:'private-notes',title:'Private teacher notes'},'changed','Private notes',left.private_notes,right.private_notes,true);
  const changed=contentChanged||notesChanged;
  const countText=contentChanged?counts.totalChanges-(notesChanged?1:0)+' content change'+(counts.totalChanges-(notesChanged?1:0)===1?'':'s'):'No lesson content changes';
  const result=freeze({contract:'echs.lesson.diff.v1',changed,contentChanged,notesChanged,
    summary:{...counts,omittedChanges,truncatedValues,contentTruncatedValues,truncated:omittedChanges>0||truncatedValues>0,text:countText+(notesChanged?'; private teacher notes changed.':'.')},sections});
  trustedComparisons.add(result);return result;
}

/** Notes are omitted from the DOM by default. The host must explicitly enable
 * them only within its current, authorized staff history dialog and dispose it
 * on revocation. The renderer performs no fetching, navigation or state writes.
 */
export function renderVersionDiff({root,comparison,includePrivateNotes=false}={}){
  if(!root?.ownerDocument||typeof root.replaceChildren!=='function'||!trustedComparisons.has(comparison)||typeof includePrivateNotes!=='boolean')invalid();
  const document=root.ownerDocument;
  const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
  const view=element('section','version-diff');view.setAttribute('aria-label','Lesson version comparison');
  view.append(element('h3','version-diff-summary',includePrivateNotes?comparison.summary.text:comparison.contentChanged?'Lesson content changed.':'No lesson content changes.'));
  const shownTruncations=includePrivateNotes?comparison.summary.truncatedValues:comparison.summary.contentTruncatedValues;
  if(comparison.summary.omittedChanges||shownTruncations)view.append(element('p','version-diff-warning','This is a shortened comparison. '+comparison.summary.omittedChanges+' changes are omitted; '+shownTruncations+' values are shortened. The original saved versions remain unchanged.'));
  for(const section of comparison.sections){
    if(section.kind==='private-notes'&&!includePrivateNotes)continue;
    const group=element('section','version-diff-section'+(section.kind==='private-notes'?' version-diff-private':''));group.append(element('h4','',section.title));
    for(const change of section.changes){
      const item=element('div','version-diff-change');item.append(element('h5','',change.label+' — '+change.kind));
      const values=element('dl','version-diff-values');
      for(const [label,value,truncated] of [['Before',change.before,change.beforeTruncated],['After',change.after,change.afterTruncated]]){
        const pair=element('div','version-diff-value');pair.append(element('dt','',label),element('dd','',value===null?'Not present':value===''?truncated?'Text omitted at the comparison limit.':'Empty':value));values.append(pair);
      }
      item.append(values);if(change.truncated)item.append(element('p','version-diff-warning','Text shortened for this comparison.'));group.append(item);
    }
    view.append(group);
  }
  root.replaceChildren(view);
  return Object.freeze({dispose(){view.replaceChildren();view.remove();}});
}
