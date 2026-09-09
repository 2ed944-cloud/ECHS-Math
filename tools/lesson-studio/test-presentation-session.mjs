import test from 'node:test';
import assert from 'node:assert/strict';
import katex from '../../lessons/ib-math-ai/unit-1/assets/js/katex.js';
import {createPresentationSession} from '../../js/lesson-studio/presentation-session.mjs';
import {createLessonDraft} from '../../js/lesson-studio/draft-model.mjs';
import {assertLessonDocument} from '../../js/lesson-runtime/schema.mjs';

const clone=value=>structuredClone(value);
function block(id,text='Explain the next step.'){return {id,type:'rich-text',version:1,content:{paragraphs:[{type:'paragraph',children:[{type:'text',text}]}]}};}
function lesson(){
  const value=createLessonDraft({lessonId:'10000000-0000-4000-8000-000000000001',courseVersionId:'10000000-0000-4000-8000-000000000002',
    catalog:{unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7'},title:'Original classroom example',
    objective:'Explain the selected limit procedure.',skill:'teacher:reason',summary:'A three-slide presentation fixture.'});
  value.slides=[
    {id:'first',title:'Choose a procedure',layout:'single',blocks:[block('first-question'),block('first-reasoning'),block('first-conclusion')]},
    {id:'second',title:'Check another representation',layout:'two-column',blocks:[block('second-question'),block('second-reasoning')]},
    {id:'third',title:'Summarize the explanation',layout:'single',blocks:[block('third-conclusion')]}
  ];return value;
}
const create=(document=lesson(),options={})=>createPresentationSession({document,mathEngine:katex,...options});

test('starts with no revealed blocks and exposes only the agreed presentation projection',()=>{
  const changes=[],session=create(lesson(),{onChange:value=>changes.push(value)});
  assert.deepEqual(session.snapshot(),{status:'ready',slideIndex:0,slideId:'first',title:'Original classroom example',slideTitle:'Choose a procedure',
    totalSlides:3,totalBlocks:3,revealedCount:0,canNext:true,canPrevious:false,canReveal:true,
    slides:[{id:'first',title:'Choose a procedure'},{id:'second',title:'Check another representation'},{id:'third',title:'Summarize the explanation'}],resetToken:0});
  assert.equal(changes.length,0);assert.ok(Object.isFrozen(session));
});

test('clones and deeply freezes canonical data without freezing the callers draft',()=>{
  const source=lesson(),original=clone(source),session=create(source),stored=session.document();
  assert.notEqual(stored,source);assert.deepEqual(stored,original);assert.equal(Object.isFrozen(source),false);
  for(const value of [stored,stored.slides,stored.slides[0],stored.slides[0].blocks,stored.slides[0].blocks[0].content.paragraphs[0].children[0]])assert.ok(Object.isFrozen(value));
  source.title='Later draft edit';source.slides[0].blocks[0].content.paragraphs[0].children[0].text='Later content';
  assert.deepEqual(session.document(),original);assert.throws(()=>{stored.title='Illegal mutation';},TypeError);
  const snapshot=session.snapshot();assert.throws(()=>{snapshot.slides[0].title='Illegal mutation';},TypeError);
  assert.equal(session.snapshot().title,original.title);
});

test('navigation has explicit zero-based bounds and never wraps at either edge',()=>{
  const changes=[],session=create(lesson(),{onChange:value=>changes.push(value)});
  session.previous();assert.equal(changes.length,0);session.jump(2);assert.equal(session.snapshot().slideId,'third');assert.equal(session.snapshot().canNext,false);
  session.next();assert.equal(changes.length,1);session.jump(0);assert.equal(session.snapshot().canPrevious,false);
  for(const bad of [-1,3,0.5,NaN,Infinity,'1',null,undefined,{},1n])assert.throws(()=>session.jump(bad),RangeError);
  assert.equal(session.snapshot().slideIndex,0);assert.equal(changes.length,2);session.jump(0);assert.equal(changes.length,2);
});

test('reveals exactly one block and retains independent progress when moving between slides',()=>{
  const session=create();session.reveal();session.reveal();assert.equal(session.snapshot().revealedCount,2);
  session.next();assert.equal(session.snapshot().revealedCount,0);session.reveal();assert.equal(session.snapshot().revealedCount,1);
  session.jump(2);session.reveal();assert.equal(session.snapshot().canReveal,false);session.reveal();assert.equal(session.snapshot().revealedCount,1);
  session.previous();assert.equal(session.snapshot().revealedCount,1);session.previous();assert.equal(session.snapshot().revealedCount,2);
  session.reveal();assert.equal(session.snapshot().canReveal,false);assert.equal(session.snapshot().totalBlocks,3);
});

test('reset always issues a cleanup token and only clears the current slide count',()=>{
  const changes=[],session=create(lesson(),{onChange:value=>changes.push(value)});
  session.reset();assert.equal(session.snapshot().resetToken,1);assert.equal(changes.length,1);
  session.reveal();session.next();session.reveal();session.reset();assert.equal(session.snapshot().revealedCount,0);assert.equal(session.snapshot().resetToken,2);
  session.reset();assert.equal(session.snapshot().resetToken,3);session.previous();assert.equal(session.snapshot().revealedCount,1);
  assert.equal(session.snapshot().resetToken,3);assert.equal(session.document().document_version,1);assert.equal(session.document().publication.revision,1);
});

test('exhausted reveal and unchanged navigation do not trigger extra renders',()=>{
  const changes=[],session=create(lesson(),{onChange:value=>changes.push(value)});session.jump(2);session.reveal();const before=changes.length;
  session.reveal();session.next();session.jump(2);assert.equal(changes.length,before);
  assert.equal(session.snapshot().revealedCount,1);
});

test('all state operations leave the original saved document byte-equivalent',()=>{
  const source=lesson(),before=JSON.stringify(source),session=create(source);
  session.reveal();session.next();session.reveal();session.reveal();session.reset();session.jump(2);session.reveal();session.previous();
  assert.equal(JSON.stringify(source),before);assert.equal(JSON.stringify(session.document()),before);
});

test('disposal clears data and metadata and every later operation remains safely inert',()=>{
  const changes=[],session=create(lesson(),{onChange:value=>changes.push(value)});session.reveal();session.dispose();const length=changes.length;
  assert.deepEqual(session.snapshot(),{status:'disposed',slideIndex:-1,slideId:null,title:'',slideTitle:'',totalSlides:0,totalBlocks:0,
    revealedCount:0,canNext:false,canPrevious:false,canReveal:false,slides:[],resetToken:0});
  for(const method of ['next','previous','reveal','reset'])assert.equal(session[method]().status,'disposed');
  assert.equal(session.jump('bad').status,'disposed');assert.equal(session.document(),null);session.dispose();assert.equal(changes.length,length);
});

test('every accessor and state operation fails closed when the current scope changes',()=>{
  for(const method of ['snapshot','document','next','previous','jump','reveal','reset']){
    let active=true;const changes=[],session=create(lesson(),{isCurrent:()=>active,onChange:value=>changes.push(value)});session.reveal();active=false;
    const result=method==='jump'?session.jump(1):session[method]();assert.equal(method==='document'?result===null:result.status==='disposed',true,method);
    assert.equal(changes.length,1);assert.equal(session.document(),null);
  }
});

test('false, throwing and nonboolean guards cannot retain a ready presentation',()=>{
  for(const isCurrent of [()=>false,()=>{throw new Error('PRIVATE SESSION DETAILS');},()=>1,()=>Promise.resolve(true)]){
    const session=create(lesson(),{isCurrent});assert.equal(session.snapshot().status,'disposed');assert.equal(session.document(),null);
  }
});

test('callback errors cannot corrupt state and scope loss during notification is detected before returning',()=>{
  const throwing=create(lesson(),{onChange:()=>{throw new Error('Renderer error');}});assert.equal(throwing.reveal().revealedCount,1);
  let active=true;const closed=create(lesson(),{isCurrent:()=>active,onChange:()=>{active=false;}});assert.equal(closed.reveal().status,'disposed');assert.equal(closed.document(),null);
});

test('rejects record envelopes, teacher notes and authority or presentation fields in documents',()=>{
  const source=lesson();assert.throws(()=>create({ok:true,contract:'echs.lesson.store.v1',head:{document:source,private_notes:'PRIVATE'}}));
  for(const mutate of [value=>value.private_notes='PRIVATE',value=>value.teacher_notes='PRIVATE',value=>value.slides[0].teacherOnly=true,
    value=>value.slides[0].revealCount=1,value=>value.slides[0].blocks[0].type='teacher-note',value=>value.authorized=true,
    value=>value.publication.status='published',value=>value.publication.audience='public',value=>value.publication.audience='teacher',value=>value.publication.revision=2]){
    const value=lesson();mutate(value);assert.throws(()=>create(value));
  }
});

test('closed JSON validation rejects accessors, hidden keys, cycles, prototypes and sparse data before invocation',()=>{
  let called=0;const values=[];
  const getter=lesson();Object.defineProperty(getter,'title',{enumerable:true,get(){called++;return 'PRIVATE';}});values.push(getter);
  const nested=lesson();Object.defineProperty(nested.slides[0].blocks[0].content,'paragraphs',{enumerable:true,get(){called++;return [];}});values.push(nested);
  const serializer=lesson();serializer.toJSON=()=>{called++;return lesson();};values.push(serializer);
  const hidden=lesson();Object.defineProperty(hidden,'private_notes',{value:'PRIVATE',enumerable:false});values.push(hidden);
  const cyclic=lesson();cyclic.slides[0].loop=cyclic;values.push(cyclic);
  const inherited=lesson();Object.setPrototypeOf(inherited,{private_notes:'PRIVATE'});values.push(inherited);
  const symbol=lesson();symbol[Symbol('private_notes')]='PRIVATE';values.push(symbol);
  const sparse=lesson();delete sparse.slides[1];values.push(sparse);
  for(const value of values)assert.throws(()=>create(value));assert.equal(called,0);
});

test('enforces existing slide and block maxima without inventing a smaller presentation format',()=>{
  const many=lesson();many.slides=Array.from({length:120},(_,index)=>({id:`slide-${index}`,title:`Slide ${index+1}`,layout:'single',blocks:[block(`block-${index}`)]}));
  const session=create(many);session.jump(119);assert.equal(session.snapshot().totalSlides,120);assert.equal(session.snapshot().canNext,false);
  many.slides.push({id:'extra-slide',title:'Too many',layout:'single',blocks:[block('extra-block')]});assert.throws(()=>create(many));
  const blocks=lesson();blocks.slides[0].blocks=Array.from({length:40},(_,index)=>block(`forty-${index}`));const full=create(blocks);for(let index=0;index<50;index++)full.reveal();
  assert.equal(full.snapshot().revealedCount,40);assert.equal(full.snapshot().canReveal,false);blocks.slides[0].blocks.push(block('forty-one'));assert.throws(()=>create(blocks));
});

test('rejects deep data and enforces1MiB compact UTF-8 independently of the general schema limit',()=>{
  const deep=lesson();let branch=deep;for(let index=0;index<30;index++)branch=branch.extra={};assert.throws(()=>create(deep));
  const large=lesson();large.slides[0].blocks=Array.from({length:6},(_,index)=>({id:`large-${index}`,type:'rich-text',version:1,
    content:{paragraphs:Array.from({length:50},()=>({type:'paragraph',children:[{type:'text',text:'x'.repeat(4000)}]}))}}));
  assertLessonDocument(large,{mathEngine:katex});assert.ok(new TextEncoder().encode(JSON.stringify(large)).length>1024*1024);assert.throws(()=>create(large));
  const unicode=lesson();unicode.slides[0].blocks=Array.from({length:4},(_,index)=>({id:`unicode-${index}`,type:'rich-text',version:1,
    content:{paragraphs:Array.from({length:50},()=>({type:'paragraph',children:[{type:'text',text:'ع'.repeat(3000)}]}))}}));
  assert.ok(JSON.stringify(unicode).length<1024*1024);assert.ok(new TextEncoder().encode(JSON.stringify(unicode)).length>1024*1024);assert.throws(()=>create(unicode));
});

test('requires actual strict pinned mathematics and validates v1 and visual v2 math',()=>{
  for(const mathEngine of [undefined,null,{version:'0.16.22',renderToString:katex.renderToString},{version:'0.16.27'}])assert.throws(()=>create(lesson(),{mathEngine}));
  const math=lesson();math.slides[0].blocks.push({id:'equation',type:'math',version:1,content:{tex:'\\frac{x^2-1}{x-1}',spoken:'The quotient of x squared minus1 and x minus1.',display:true}});
  assert.equal(create(math).snapshot().totalBlocks,4);
  for(const tex of ['\\frac{','\\href{https://example.test}{private}','\\htmlClass{secret}{x}']){const value=clone(math);value.slides[0].blocks.at(-1).content.tex=tex;assert.throws(()=>create(value));}
  const visual=clone(math);visual.slides[0].blocks.at(-1).version=2;visual.slides[0].blocks.at(-1).content={source:{mode:'visual',expression:{kind:'fraction',numerator:{kind:'number',value:'1'},denominator:{kind:'symbol',name:'x'}}},spoken:'One divided by x.',display:true};
  assert.equal(create(visual).document().slides[0].blocks.at(-1).version,2);
  visual.slides[0].blocks.at(-1).content.source.expression.denominator.name='arbitrary\\TeX';assert.throws(()=>create(visual));
});

test('presentation operations cannot call network, storage or timers',()=>{
  const source=lesson(),properties=['fetch','localStorage','sessionStorage','indexedDB','setTimeout','setInterval'],original=new Map(properties.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const forbidden=()=>{throw new Error('Presentation attempted an external side effect.');};
  try{
    for(const key of properties)Object.defineProperty(globalThis,key,{configurable:true,get:forbidden});
    const session=create(source);session.reveal();session.next();session.reset();session.jump(2);session.previous();session.snapshot();session.document();session.dispose();
  }finally{for(const [key,descriptor]of original){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
