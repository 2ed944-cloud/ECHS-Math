import test from 'node:test';
import assert from 'node:assert/strict';
import katex from '../lesson-runtime/node_modules/katex/dist/katex.mjs';
import {createLessonDraft,addSlide} from '../../js/lesson-studio/draft-model.mjs';
import {compareLessonVersions,VERSION_DIFF_LIMITS} from '../../js/lesson-studio/version-diff.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const original=()=>createLessonDraft({lessonId:'80000000-0000-4000-8000-000000000001',courseVersionId:'80000000-0000-4000-8000-000000000002',catalog:{unit_id:'legacy:ap:unit:1',topic_id:'legacy:ap:topic:1.7'},title:'Original saved lesson',objective:'Explain the original example.',skill:'teacher:explain',summary:'Original comparison fixture.'});
const compare=(before,after,notesBefore='',notesAfter='')=>compareLessonVersions({before:{document:before,private_notes:notesBefore},after:{document:after,private_notes:notesAfter},mathEngine:katex});
const changes=value=>value.sections.flatMap(section=>section.changes);
const media=()=>({
  image:{asset_id:'80000000-0000-4000-8000-000000000011',alt:'Original graph.',decorative:false,caption:'Original caption',description:'Original image description'},
  video:{provider:'youtube',video_id:'AbCdEf123_-',title:'Original video',start_seconds:3,transcript:'Original transcript'},
  resource:{asset_id:'80000000-0000-4000-8000-000000000012',title:'Original resource',description:'Original resource description'},
  table:{caption:'Recorded values',columns:[{id:'input',label:'Input'},{id:'output',label:'Output'}],rows:[{id:'first',cells:[[{type:'text',text:'2'}],[{type:'text',text:'4'}]]},{id:'second',cells:[[{type:'text',text:'3'}],[{type:'math',source:{mode:'tex',tex:'x^2'},spoken:'x squared'}]]}],row_header:false}
});
const withBlock=(type,content,version=1)=>{const value=original();value.slides[0].blocks.push({id:'compared',type,version,content});return value;};

test('revision counters and object-key or independent mark ordering alone produce no content change',()=>{
  const before=original();before.slides[0].blocks[0].content.paragraphs[0].children[0].marks=['strong','em'];
  const after=copy(before);after.document_version=9;after.publication.revision=9;after.slides[0].blocks[0].content.paragraphs[0].children[0].marks=['em','strong'];
  after.accessibility={summary:after.accessibility.summary,language:after.accessibility.language};
  const result=compare(before,after);assert.equal(result.changed,false);assert.equal(result.contentChanged,false);assert.deepEqual(result.sections,[]);
  const split=copy(after),text=split.slides[0].blocks[0].content.paragraphs[0].children[0].text;
  split.slides[0].blocks[0].content.paragraphs[0].children=[{type:'text',text:text.slice(0,8),marks:['strong','em']},{type:'text',text:text.slice(8),marks:['em','strong']}];
  assert.equal(compare(before,split).changed,false);
});

test('comparison validates closed projections before getters, malformed math, injected markup or foreign identity can be read',()=>{
  const document=original();let calls=0;
  const getter={document,get private_notes(){calls++;return 'PRIVATE_NOTES';}};
  assert.throws(()=>compareLessonVersions({before:getter,after:{document,private_notes:''},mathEngine:katex}),{code:'invalid_version_comparison'});
  const nested=copy(document);Object.defineProperty(nested.slides[0],'title',{enumerable:true,get(){calls++;return 'Original';}});
  assert.throws(()=>compare(document,nested));assert.equal(calls,0);
  for(const key of ['lesson_id','course_version_id','unit_id','topic_id','slug']){const other=copy(document);other[key]=key.endsWith('_id')&&key!=='unit_id'&&key!=='topic_id'?'80000000-0000-4000-8000-000000000099':'different';assert.throws(()=>compare(document,other));}
  const hostile=copy(document);hostile.title='<img src=x onerror=alert(1)>';assert.throws(()=>compare(document,hostile));
  const math=withBlock('math',{tex:'\\frac{',spoken:'Incomplete fraction',display:true});assert.throws(()=>compare(document,math));
  assert.throws(()=>compareLessonVersions({before:{document,private_notes:'',history:[]},after:{document,private_notes:''},mathEngine:katex}));
  assert.throws(()=>compareLessonVersions({before:{document,private_notes:''},after:{document,private_notes:''}}));
  const hooked=copy(document);hooked.toJSON=()=>{calls++;return document;};assert.throws(()=>compare(document,hooked));assert.equal(calls,0);
});

test('slide insertion and removal identify stable IDs without falsely moving or changing surviving content',()=>{
  const before=addSlide(original(),{title:'Original second slide'}),after=addSlide(before,{title:'Inserted first',afterId:'slide-1'});
  const result=compare(before,after);assert.equal(result.summary.slidesAdded,1);assert.equal(result.summary.slidesMoved,0);assert.equal(result.summary.blocksAdded,1);assert.equal(result.summary.blocksChanged,0);
  const removed=compare(after,before);assert.equal(removed.summary.slidesRemoved,1);assert.equal(removed.summary.slidesMoved,0);assert.equal(removed.summary.blocksRemoved,1);
});

test('slide and block reorders and cross-slide moves are structural changes rather than positional text replacements',()=>{
  const before=addSlide(original(),{title:'Second slide'});before.slides[0].blocks.push({id:'extra',type:'rich-text',version:1,content:copy(before.slides[0].blocks[0].content)});
  const reordered=copy(before);reordered.slides.reverse();reordered.slides[1].blocks.reverse();
  const result=compare(before,reordered);assert.equal(result.summary.slidesMoved,2);assert.equal(result.summary.blocksMoved,2);assert.equal(result.summary.blocksChanged,0);
  const moved=copy(before);moved.slides[1].blocks.push(moved.slides[0].blocks.pop());const other=compare(before,moved);
  assert.equal(other.summary.blocksMoved,1);assert.equal(other.summary.blocksAdded,0);assert.equal(other.summary.blocksRemoved,0);assert.equal(other.summary.blocksChanged,0);
});

test('lesson metadata, objectives by ID, accessibility, contexts and layouts are comprehensively compared',()=>{
  const before=original();before.objectives.push({id:'teacher:second',text:'Second objective'});
  const after=copy(before);after.title='Updated title';after.accessibility.language='ar';after.accessibility.summary='Updated summary';after.skills.push('teacher:justify');after.variants.contexts.push('qatar');after.slides[0].title='Updated slide';after.slides[0].layout='three-panel';after.objectives.reverse();after.objectives[0].text='Updated second objective';after.objectives.push({id:'teacher:third',text:'Third objective'});
  const labels=changes(compare(before,after)).map(change=>change.label);
  for(const label of ['Title','Language','Accessible summary','Skills','Contexts','Slide title','Layout','Objective teacher:second','Objective teacher:third'])assert.ok(labels.includes(label),label);
  assert.ok(changes(compare(before,after)).filter(change=>change.kind==='moved').length===2);
});

test('rich text retains paragraph/list structure, formatting, link destinations and literal mathematics in readable descriptions',()=>{
  const body={nodes:[{type:'paragraph',children:[{type:'text',text:'Explore ',marks:['strong']},{type:'link',href:'https://example.org/original',children:[{type:'text',text:'the example'}]},{type:'math',source:{mode:'tex',tex:'x^2'},spoken:'x squared'}]},{type:'list',style:'ordered',items:[{type:'list-item',children:[{type:'text',text:'Explain the reasoning.'}]}]}]};
  const before=withBlock('rich-text',body,2),after=copy(before);after.slides[0].blocks[1].content.nodes[0].children[1].href='https://example.org/updated';after.slides[0].blocks[1].content.nodes[1].style='unordered';
  const entry=changes(compare(before,after))[0];assert.match(entry.before,/\[bold\]/);assert.match(entry.before,/1\. Explain/);assert.match(entry.after,/• Explain/);assert.match(entry.after,/https:\/\/example.org\/updated/);assert.match(entry.before,/x squared/);assert.match(entry.before,/TeX expression: x\^2/);
});

test('math source mode, expression, spoken description, display and explicit content versions remain distinct',()=>{
  const before=withBlock('math',{tex:'x',spoken:'x',display:false}),after=copy(before);
  after.slides[0].blocks[1]={id:'compared',type:'math',version:2,content:{source:{mode:'visual',expression:{kind:'symbol',name:'x'}},spoken:'x',display:false}};
  assert.ok(changes(compare(before,after)).some(change=>change.label==='Block format'));
  const changed=copy(after);changed.slides[0].blocks[1].content={source:{mode:'tex',tex:'x^2'},spoken:'x squared',display:true};
  assert.deepEqual(changes(compare(after,changed)).map(change=>change.label),['Expression source','Spoken description','Equation display']);
  assert.equal(before.slides[0].blocks[1].version,1);
});

test('callout kind/title/body and legacy reference source/anchor/hash/summary remain explicit without embedding source HTML',()=>{
  const before=withBlock('callout',{kind:'note',title:'Original note',body:original().slides[0].blocks[0].content}),after=copy(before);
  after.slides[0].blocks[1].content={kind:'warning',title:'Updated note',body:{paragraphs:[{type:'paragraph',children:[{type:'text',text:'Updated explanation'}]}]}};
  assert.deepEqual(changes(compare(before,after)).map(change=>change.label),['Callout kind','Callout title','Callout body']);
  const legacy=withBlock('legacy-embedded',{source:'lessons/ap-calculus/unit-1/lesson-1-1.html',anchor:'intro',sha256:'a'.repeat(64),summary:'Original reference'}),updated=copy(legacy);
  updated.slides[0].blocks[1].content={source:'lessons/ap-calculus/unit-1/lesson-1-2.html',anchor:'explain',sha256:'b'.repeat(64),summary:'Updated reference'};
  assert.equal(changes(compare(legacy,updated)).length,4);
});

test('all image, video and resource fields have readable semantic changes with no opaque JSON dump',()=>{
  for(const [type,value] of Object.entries(media()).filter(([type])=>type!=='table')){
    const before=withBlock(type,value),after=copy(before),content=after.slides[0].blocks[1].content;
    for(const key of Object.keys(content)){
      if(key==='provider')continue;
      if(key==='asset_id')content[key]='80000000-0000-4000-8000-000000000099';else if(key==='video_id')content[key]='BcDeFg234_-';else if(key==='start_seconds')content[key]=10;else if(key==='decorative')content[key]=true;else content[key]='Updated '+key;
    }
    if(type==='image')content.alt='';
    const result=compare(before,after);assert.equal(changes(result).length,Object.keys(value).length-(type==='video'?1:0));
    assert.ok(changes(result).every(change=>typeof change.label==='string'&&change.label.length>0));assert.equal(JSON.stringify(result).includes('"asset_id"'),false);
  }
});

test('table columns and rows track stable IDs: reorders do not falsely modify cells',()=>{
  const before=withBlock('table',media().table),after=copy(before),table=after.slides[0].blocks[1].content;
  table.columns.reverse();table.rows.reverse();table.rows.forEach(row=>row.cells.reverse());
  const result=compare(before,after),entries=changes(result);assert.equal(entries.length,4);assert.ok(entries.every(entry=>entry.kind==='moved'));
  const changed=copy(after),current=changed.slides[0].blocks[1].content;current.caption='Updated values';current.row_header=true;current.columns[0].label='Squared result';current.rows[0].cells[1]=[{type:'text',text:'5'}];
  const labels=changes(compare(after,changed)).map(change=>change.label);for(const expected of ['Table caption','First column is a row header','Column output label','Row second, column Input'])assert.ok(labels.includes(expected),expected);
});

test('table added and removed rows or columns include their values and formatting',()=>{
  const before=withBlock('table',media().table),after=copy(before),table=after.slides[0].blocks[1].content;
  table.columns.push({id:'comment',label:'Reason'});table.rows.forEach(row=>row.cells.push([{type:'text',text:'New explanation',marks:['em']}]));table.rows.push({id:'third',cells:[[{type:'text',text:'4'}],[{type:'text',text:'16'}],[{type:'text',text:'New row'}]]});
  const additions=changes(compare(before,after));assert.ok(additions.some(change=>change.label==='Column Reason'&&change.after.includes('[italic]')));assert.ok(additions.some(change=>change.label==='Row third'&&change.after.includes('16')));
  assert.ok(changes(compare(after,before)).every(change=>change.kind==='removed'));
});

test('private notes compare exactly in a separate section without affecting content-change identity',()=>{
  const document=original(),result=compare(document,document,'PRIVATE teacher text','PRIVATE teacher text ');
  assert.equal(result.changed,true);assert.equal(result.contentChanged,false);assert.equal(result.notesChanged,true);assert.equal(result.sections.length,1);assert.equal(result.sections[0].kind,'private-notes');assert.equal(result.sections[0].changes[0].after,'PRIVATE teacher text ');
  assert.equal(JSON.stringify(document).includes('PRIVATE'),false);
});

test('large changes are explicitly bounded without changing the comparison truth or mutating source versions',()=>{
  const before=original();before.slides=[];
  for(let n=0;n<120;n++)before.slides.push({id:'slide-'+n,title:'Original '+n,layout:'single',blocks:[{id:'block-'+n,type:'math',version:1,content:{tex:'x',spoken:'x',display:false}}]});
  const after=copy(before);after.slides.forEach(slide=>{slide.title='Updated '+slide.title;slide.layout='two-column';slide.blocks[0].content.spoken='A'.repeat(4000);});
  const source=JSON.stringify(after),result=compare(before,after,'PRIVATE'.repeat(2000),'OTHER'.repeat(2000));
  assert.equal(result.changed,true);assert.equal(result.summary.truncated,true);assert.ok(result.summary.omittedChanges>0);assert.ok(result.summary.shownChanges<=VERSION_DIFF_LIMITS.changes);assert.ok(result.sections.some(section=>section.kind==='private-notes'));
  for(const entry of changes(result))for(const value of [entry.before,entry.after])if(value!==null)assert.ok(value.length<=VERSION_DIFF_LIMITS.text);
  const publicText=result.sections.filter(section=>section.kind!=='private-notes').flatMap(section=>section.changes).reduce((total,entry)=>total+(entry.before?.length||0)+(entry.after?.length||0),0);assert.ok(publicText<=VERSION_DIFF_LIMITS.totalText);
  assert.equal(JSON.stringify(after),source);assert.ok(Object.isFrozen(result));assert.ok(Object.isFrozen(result.sections));assert.ok(JSON.stringify(result).length<200000);
});
