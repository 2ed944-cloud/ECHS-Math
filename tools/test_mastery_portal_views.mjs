import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import * as policy from '../supabase/functions/_shared/mastery-status.mjs';
const require=createRequire(import.meta.url);
const {parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||fileURLToPath(new URL('../../test-deps/node_modules/linkedom',import.meta.url)));
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const checks=[];async function check(name,run){await run();checks.push(name);}
const raw={score:97,attempts:24,topic:'1.2',level:'Mastered',verified_mastery:true,source:'server',payload:{level:'Mastered',verified:true},confidence:.99};
const course={id:'ap-calculus-ab',title:'AP Calculus AB',shortTitle:'Calculus AB',grade:'G12',units:[{title:'Unit 1: Limits',lessons:[{number:'1.1',title:'Rate of change',url:'lessons/ap-calculus/unit-1/index.html',outcomes:['Interpret rates'],resources:[]},{number:'1.2',title:'Limits',url:'lessons/ap-calculus/unit-1/lesson-1-2.html',outcomes:['Interpret limits'],resources:[]}]}]};
function harness({helper=true,page='lessons'}={}){
  const {document,window}=parseHTML(read('index.html'));
  document.querySelectorAll('script').forEach(node=>node.remove());
  document.body.dataset.platformPage=page==='lessons'?'home':'';document.body.dataset.premiumPage=page==='lessons'?'':page;
  window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.removeAttribute('open');};window.HTMLElement.prototype.scrollIntoView=function(){};
  const values=new Map(),events=[];
  const context=vm.createContext({document,location:{href:'https://fixture.test/ECHS-Math/index.html',search:''},history:{state:null,pushState(){},replaceState(){}},localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))},URL,URLSearchParams,Date,Math,console,setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:fn=>fn(),addEventListener(){},dispatchEvent(){},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},Event:window.Event,MutationObserver:class{observe(){}},matchMedia:()=>({matches:true})});
  context.window=context;context.ECHS_COURSES=[structuredClone(course)];
  context.ECHSLearning={masteryRows:()=>[structuredClone(raw)],summary:()=>({mastered:9,attempts:24,accuracy:90})};
  context.ECHSPortalAccess={normaliseCourseKey:value=>value,courseAllowed:()=>true};
  context.ECHSInstitution={api:async()=>({entries:[]})};
  if(helper)context.ECHSMasteryStatus=policy;
  document.dispatchEvent=event=>(events.push(event),true);
  const ensure=id=>{let node=document.getElementById(id);if(!node){node=document.createElement('div');node.id=id;document.body.append(node);}return node;};
  const run=source=>vm.runInContext(source,context);
  return {context,document,values,events,ensure,run};
}
function expose(source,marker,expression){assert.equal(source.split(marker).length,2);return source.replace(marker,`globalThis.view=${expression};return;\n${marker}`);}
function portal(h){
  const source=read('js/portal.js'),marker='bootstrap().catch(error=>showGate("guest",`Could not load the learning pathway: ${error.message}`));';
  assert.ok(source.includes(marker));h.run(source.replace(marker,''));
  h.run('available=ALL_COURSES;access={authenticated:true,role:"teacher",allCourses:true};state.courseId=ALL_COURSES[0].id;refreshMasteryIndex();renderUnits();updateStats();publishSmartRouteContext();');
}
function drawer(h){h.run(expose(read('js/lesson-portal-overhaul.js'),'  if (document.readyState ===','{statusFor,enhanceCard,openDrawer,prepareWorkspace}'));}
function route(h){Object.defineProperty(h.document,'currentScript',{configurable:true,value:{src:'https://fixture.test/ECHS-Math/js/smart-learning-route.js'}});h.ensure('smartRoute-'+(h.document.body.dataset.premiumPage||'lessons'));h.run(expose(read('js/smart-learning-route.js'),'  ensureStyles();','{renderLessons,renderTeacher,renderAdmin,scheduleSignal,addRouteParams}'));}
function routeContext(){return {access:{authenticated:true,role:'student',dashboard:{counters:{accuracy:90,attempts:24,review_due:0,open_mistakes:0},assignments:[]}},lessons:[{courseId:'ap-calculus-ab',number:'1.1',title:'Rates',url:'lesson-one',completed:true,masteryScore:80,practiceEvidence:{score:80,attempts:10},lessonHref:'https://fixture.test/one',practiceHref:'https://fixture.test/practice?topic=1.1'},{courseId:'ap-calculus-ab',number:'1.2',title:'Limits',url:'lesson-two',completed:false,masteryScore:97,practiceEvidence:structuredClone(raw),lessonHref:'https://fixture.test/two',practiceHref:'https://fixture.test/practice?topic=1.2'}]};}
const content=h=>h.ensure('smartRoute-'+(h.document.body.dataset.premiumPage||'lessons'));
const lane=h=>{const node=content(h).querySelector('.slrPathBadge')?.cloneNode(true);node?.querySelector('i')?.remove();return node?.textContent.trim();};

await check('Portal ignores forged verified flags and legacy mastered summary while preserving completion and route score',()=>{
  const h=harness();portal(h);assert.equal(h.ensure('statQuestions').textContent,'0');
  const cards=[...h.ensure('units').querySelectorAll('.lesson')],target=cards[1];
  assert.equal(target.dataset.score,'97');assert.equal(target.dataset.practiceAttempts,'24');assert.equal(target.dataset.evidenceStatus,'provisional');assert.match(target.querySelector('.lessonCardStatus').textContent,/Practice recorded/);assert.doesNotMatch(target.textContent,/Mastered|Skill mastered|97% mastery/);
  h.run('state.complete=[lessonKey(available[0],0,available[0].units[0].lessons[1])];renderUnits();updateStats();publishSmartRouteContext();');
  const completed=h.ensure('units').querySelectorAll('.lesson')[1];assert.match(completed.querySelector('.lessonCardStatus').textContent,/Completed/);assert.match(completed.textContent,/97% provisional practice/);assert.match(completed.textContent,/Challenge practice/);assert.equal(h.ensure('statReady').textContent,'1');
  const context=h.context.ECHSPortalRouteContext;assert.equal(context.lessons[1].masteryScore,97);assert.equal(context.lessons[1].practiceEvidence.verified_mastery,false);
  assert.equal(new URL(context.lessons[1].lessonHref).searchParams.get('topic'),'1.2');assert.match(context.lessons[1].practiceHref,/mode=adaptive/);
});
await check('Missing helper and missing attempts never turn cached scores into portal mastery; a later helper remains provisional',()=>{
  const h=harness({helper:false});portal(h);assert.equal(h.ensure('statQuestions').textContent,'0');assert.doesNotMatch(h.ensure('units').textContent,/Mastered|97%/);assert.equal(h.ensure('units').querySelectorAll('.lesson')[1].dataset.evidenceStatus,'insufficient');
  h.context.ECHSMasteryStatus=policy;h.run('renderUnits()');assert.match(h.ensure('units').textContent,/Practice recorded/);
  h.context.ECHSLearning.masteryRows=()=>[{...raw,attempts:null}];h.run('refreshMasteryIndex();renderUnits()');assert.doesNotMatch(h.ensure('units').textContent,/Practice recorded|Mastered/);
  h.context.ECHSLearning.masteryRows=()=>[{...raw,score:null}];h.run('refreshMasteryIndex();renderUnits()');drawer(h);const unknown=h.ensure('units').querySelectorAll('.lesson')[1];assert.equal(unknown.dataset.score,'0');assert.equal(unknown.dataset.practiceScore,'');assert.equal(h.context.view.statusFor(unknown).label,'Ready','Numeric route fallback zero is not a recorded zero score');
});
await check('Details drawer clears old enhanced Mastered chrome and keeps completion separate from practice',()=>{
  const h=harness();portal(h);drawer(h);
  const card=h.ensure('units').querySelectorAll('.lesson')[1];card.dataset.calmEnhanced='1';card.dataset.verified='true';card.querySelector('.lessonCardStatus').className='lessonCardStatus mastered';card.querySelector('.lessonCardStatus').textContent='Mastered';
  h.context.view.enhanceCard(card);assert.equal(card.querySelectorAll('.mastered').length,0);assert.match(card.querySelector('.lessonCardStatus').textContent,/Practice recorded/);
  h.context.view.openDrawer(card,{pushHistory:false});assert.match(h.ensure('lessonDrawerStatus').textContent,/Practice recorded/);assert.doesNotMatch(h.ensure('lessonDrawerStatus').textContent,/Mastered/);
  card.dataset.completed='true';assert.equal(h.context.view.statusFor(card).label,'Completed');
  delete h.context.ECHSMasteryStatus;card.dataset.completed='false';assert.equal(h.context.view.statusFor(card).label,'Ready');
});
await check('Real zero practice remains recorded while absent practice remains unavailable in cards and drawer',()=>{
  const h=harness();h.context.ECHSLearning.masteryRows=()=>[{...raw,score:0,attempts:1}];portal(h);drawer(h);
  const card=h.ensure('units').querySelectorAll('.lesson')[1];assert.equal(h.context.view.statusFor(card).label,'Practice recorded');
  h.run('state.complete=[lessonKey(available[0],0,available[0].units[0].lessons[1])];renderUnits();');assert.match(h.ensure('units').textContent,/0% provisional practice/);
});
await check('Smart Route keeps existing support/core/challenge thresholds, counts and destinations without certification claims',async()=>{
  const h=harness();route(h);const context=routeContext(),before=JSON.stringify(context);
  for(const [accuracy,reviews,mistakes,prereq,target,expected,count,difficulty] of [[90,0,0,80,97,'Challenge route','10','hard'],[90,3,0,80,97,'Support route','6','easy'],[90,0,5,80,97,'Support route','6','easy'],[90,0,0,54,97,'Support route','6','easy'],[59,0,0,80,97,'Support route','6','easy'],[74,0,0,80,97,'Core route','8',null],[90,0,0,80,84,'Core route','8',null]]){
    const c=structuredClone(context);Object.assign(c.access.dashboard.counters,{accuracy,review_due:reviews,open_mistakes:mistakes});c.lessons[0].masteryScore=prereq;c.lessons[1].masteryScore=target;
    await h.context.view.renderLessons(c);assert.equal(lane(h),expected);const href=new URL(content(h).querySelector('.slrAction.primary').href);assert.equal(href.searchParams.get('count'),count);assert.equal(href.searchParams.get('difficulty'),difficulty);assert.equal(href.searchParams.get('topic'),'1.2');assert.equal(href.searchParams.get('autostart'),'1');
    assert.doesNotMatch(content(h).textContent,/Verified evidence only|Trusted mastery gate|secure mastery/);assert.match(content(h).textContent,/provisional/);
  }
  assert.equal(JSON.stringify(context),before);
});
await check('Smart Route preserves exact assignment priority, bank, topic and timetable signals',async()=>{
  const h=harness();route(h);const c=routeContext();c.access.dashboard.assignments=[{id:'assignment-a',title:'Teacher priority',activity_type:'adaptive',configuration:{course:'ap-calculus-ab',banks:['fixed-bank'],routes:[{unit:'1',topic:'1.2'}]}}];
  const now=new Date();h.context.ECHSInstitution.api=async()=>({entries:[{day_of_week:now.getDay()+1,start_time:'00:00:00',end_time:'23:59:59',label:'Synthetic mathematics',room:'R1'}]});
  await h.context.view.renderLessons(c);const href=new URL(content(h).querySelector('.slrAction.primary').href);assert.equal(href.searchParams.get('assignment'),'assignment-a');assert.equal(href.searchParams.get('bank'),'fixed-bank');assert.equal(href.searchParams.get('topic'),'1.2');assert.equal(href.searchParams.get('count'),'10');assert.match(content(h).textContent,/Teacher priority/);assert.match(content(h).textContent,/Synthetic mathematics/);
});
await check('Missing helper/cached verification fail closed in Smart Route labels while its numeric challenge lane stays unchanged',async()=>{
  const h=harness({helper:false});route(h);const c=routeContext();await h.context.view.renderLessons(c);
  assert.equal(lane(h),'Challenge route');const metrics=content(h).querySelectorAll('.slrMetric');assert.equal(metrics[3].querySelector('strong').textContent,'—');assert.match(metrics[3].textContent,/Insufficient/);assert.match(content(h).textContent,/Mastery verification unavailable/);
  h.context.ECHSMasteryStatus=policy;await h.context.view.renderLessons(c);assert.equal(content(h).querySelectorAll('.slrMetric')[3].querySelector('strong').textContent,'97%');assert.match(content(h).querySelectorAll('.slrMetric')[3].textContent,/unverified/);
});
await check('Actual zero accuracy is not missing evidence; absent attempts do not display inferred zero',async()=>{
  const h=harness();route(h);const c=routeContext();c.access.dashboard.counters.accuracy=0;await h.context.view.renderLessons(c);assert.equal(content(h).querySelectorAll('.slrMetric')[1].querySelector('strong').textContent,'0%');
  c.access.dashboard.counters.attempts=null;await h.context.view.renderLessons(c);assert.equal(content(h).querySelectorAll('.slrMetric')[1].querySelector('strong').textContent,'—');assert.match(content(h).querySelectorAll('.slrMetric')[1].textContent,/unavailable/);
  h.context.ECHSLearning.summary=()=>({attempts:24});c.access.dashboard.counters={};await h.context.view.renderLessons(c);assert.equal(content(h).querySelectorAll('.slrMetric')[1].querySelector('strong').textContent,'—','Legacy numeric routing fallback cannot invent measured zero accuracy');
});
await check('Pending timetable cannot replace newer signed-out or staff planning state',async()=>{
  const h=harness();route(h);let finish;h.context.ECHSInstitution.api=()=>new Promise(resolve=>{finish=resolve;});const old=h.context.view.renderLessons(routeContext());
  await h.context.view.renderLessons({access:{authenticated:false}});finish({entries:[]});await old;assert.equal(content(h).hidden,true);
  await h.context.view.renderLessons({access:{authenticated:true,role:'teacher'},lessons:routeContext().lessons});assert.equal(content(h).dataset.routeAudience,'staff');assert.match(content(h).textContent,/Teacher planning view/);assert.doesNotMatch(content(h).textContent,/97%/);
});
await check('Teacher lane grouping and assignment preparation remain numeric, with explicit provisional descriptions',()=>{
  const h=harness({page:'teacher'});route(h);const data={class:{name:'Synthetic class'},students:[{id:'a',mastery:97,accuracy:90,open_mistakes:0},{id:'b',mastery:35,accuracy:50,open_mistakes:5},{id:'c',mastery:70,accuracy:70,open_mistakes:0}]};
  h.context.view.renderTeacher({classData:data});assert.deepEqual([...content(h).querySelectorAll('.slrLaneCount')].map(x=>x.textContent),['1','1','1']);assert.match(content(h).textContent,/provisional/);assert.doesNotMatch(content(h).textContent,/secure mastery/);
  for(const [id,tag] of [['assignmentTitle','input'],['assignmentDifficulty','input'],['activityType','input'],['assignmentCountInput','input']]){h.ensure(id).remove();const node=h.document.createElement(tag);node.id=id;h.document.body.append(node);}
  content(h).querySelector('[data-slr-assignment="challenge"]').click();assert.equal(h.ensure('assignmentDifficulty').value,'3');assert.equal(h.ensure('assignmentCountInput').value,'10');assert.equal(h.ensure('activityType').value,'adaptive');
});
await check('Administrator operational view does not claim that practice attempts authenticate mastery',async()=>{
  const h=harness({page:'admin'});route(h);await h.context.view.renderAdmin({preview:true,accounts:[]});assert.match(content(h).textContent,/Authenticated grading evidence is required/);assert.match(content(h).textContent,/Provisional practice indicators/);assert.doesNotMatch(content(h).textContent,/Evidence-based mastery/);
});
console.log(JSON.stringify({status:'PASS',checks:checks.length,scope:'Actual portal/drawer/route DOM functions with synthetic records; no production authentication or schedule changes',groups:checks},null,2));
