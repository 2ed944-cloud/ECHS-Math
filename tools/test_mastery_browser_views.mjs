import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {projectMasteryStatus} from '../supabase/functions/_shared/mastery-status.mjs';

const require=createRequire(import.meta.url);
const {parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||fileURLToPath(new URL('../../test-deps/node_modules/linkedom',import.meta.url)));
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const checks=[];
async function check(name,run){await run();checks.push(name);}
const raw={key:'ap-calculus::1::1.1',course:'ap-calculus',unit:'1',title:'Limits',topic:'1.1',score:97,accuracy:100,attempts:24,correct:24,recent:Array(12).fill(true),confidence:.94,independent_evidence:24,active_days:3,retention_evidence:8,transfer_evidence:24,level:'Mastered',verified_mastery:true,source:'server',last_verified_at:'2026-01-01',payload:{verified:true,level:'Mastered'}};
const badReport=()=>({schema:'echs-learning-report',student:{display_name:'Synthetic learner',name:'Synthetic learner'},summary:{attempts:24,accuracy:100,mastered:9},counters:{attempts:24,mastery:97,accuracy:100,mastered_topics:9,total_topics:1,weekly_minutes:20},mastery:[structuredClone(raw)],strengths:[structuredClone(raw)],priorities:[structuredClone(raw)],weakTopics:[structuredClone(raw)],assignments:[],recent_sessions:[]});

function harness(page='dashboard.html',seed=true){
  const {document}=parseHTML(read('question-bank/'+page));
  document.querySelectorAll('script').forEach(node=>node.remove());
  // Browsers select the first option when no selected attribute is present;
  // Linkedom does not implement that default.
  for(const select of document.querySelectorAll('select'))Object.defineProperty(select,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===value);}});
  const values=new Map(), events=[],timeouts=[];
  if(seed){values.set('echs_learning_events_v2',JSON.stringify(Array.from({length:24},(_,i)=>({id:`a${i}`,questionId:`q${i}`,correct:true,at:new Date().toISOString()}))));values.set('echs_learning_mastery_v2',JSON.stringify({[raw.key]:raw}));values.set('echs_learning_achievements_v2',JSON.stringify({'first-mastery':{id:'first-mastery',title:'Topic Master',description:'Master your first topic.',earnedAt:'2025-01-01'}}));}
  const localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const ensure=id=>{let node=document.getElementById(id);if(!node){node=document.createElement('div');node.id=id;document.body.append(node);}return node;};
  const context=vm.createContext({document,localStorage,sessionStorage:localStorage,location:{search:'',href:'https://fixture.test/question-bank/'+page},URL,URLSearchParams,Blob,Date,Math,console,structuredClone,CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},setTimeout:fn=>(timeouts.push(fn),timeouts.length),clearTimeout(){},addEventListener(){},dispatchEvent:event=>events.push(event),MutationObserver:class{observe(){}},alert:()=>{},print:()=>{}});
  context.window=context;
  // Linkedom event dispatch needs its own native Event; product event payloads are
  // recorded here instead. No network, auth, storage transport or startup is mocked as success.
  document.dispatchEvent=event=>(events.push(event),true);
  const captured={};
  context.ECHSExperience={escapeHTML:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),safePercent:value=>Math.min(100,Math.max(0,Number(value)||0)),icon:name=>name,greeting:()=> 'Hello',setRing:(id,value)=>{const node=ensure(id);node.dataset.value=String(value);const strong=node.querySelector('strong');if(strong)strong.textContent=`${Math.round(Number(value)||0)}%`;},renderDistribution:(id,rows)=>{captured.distribution=plain(rows);ensure(id).textContent=rows.map(row=>`${row.label}: ${row.count}`).join('; ');},renderWeekBars(){},setIdentityAvatar(){},toast(){}};
  context.ECHSInstitution={initials:()=> 'SL'};
  vm.runInContext(read('question-bank/js/learning-system.js'),context);
  const run=(filename,transform=source=>source)=>{
    const source=read('question-bank/js/'+filename);
    for(const match of source.matchAll(/\$\("([A-Za-z0-9_-]+)"\)/g))ensure(match[1]);
    return vm.runInContext(transform(source),context,{filename});
  };
  return{context,document,values,run,ensure,events,timeouts,captured,api:context.ECHSLearning};
}
function expose(source,marker,expression){assert.equal(source.split(marker).length,2,`unique startup marker ${marker}`);return source.replace(marker,`globalThis.view=${expression};return;\n${marker}`);}
async function cloud(page,file){const h=harness(page);await h.run(file,source=>expose(source,file==='student-cloud.js'?'  const current = await ECHSInstitution.requireAuth([':'const current=await ECHSInstitution.requireAuth(',file==='student-cloud.js'?'{render,skillRows,renderJourney,load}':'{render,skills,load}'));return h;}
const text=(h,id)=>h.ensure(id).textContent;

await check('Synchronous classic policy equals canonical policy for forged, missing, zero and high practice records',()=>{
  const h=harness();
  for(const row of [null,{},raw,{...raw,attempts:0},{...raw,score:0},{...raw,score:null},{score:99},{...raw,payload:{authenticated_grading:true,receipt_id:'forged',verified:true}},{...raw,verified_mastery:true,evidence_status:'verified'}])assert.deepEqual(plain(h.api.evidenceStatus(row)),plain(projectMasteryStatus(row)));
  assert.equal(h.context.ECHSMasteryStatus.STATUS_CONTRACT,'echs.mastery-status.v1');
});
await check('Read projections preserve raw bytes, scores, confidence, ordering, adaptive targeting and historical IDs',()=>{
  const h=harness(),before=h.values.get('echs_learning_mastery_v2');
  const row=h.api.masteryRows()[0],report=h.api.exportStudentReport();
  assert.equal(row.score,97);assert.equal(row.confidence,.94);assert.equal(row.verified_mastery,false);assert.equal(row.payload.verified,false);assert.equal(row.last_verified_at,null);
  assert.equal(h.api.masteryMap()[raw.key].verified_mastery,false);assert.equal(h.api.summary().mastered,0);assert.equal(h.api.summary().accuracy,100);assert.equal(h.api.summary().proficient,1);
  assert.equal(h.values.get('echs_learning_mastery_v2'),before);
  assert.equal(h.api.adaptiveTarget({classification:{course_scope:'AP Calculus',ap_unit:'1',ap_topic:'1.1'}}),3);
  assert.equal(report.achievements[0].id,'first-mastery');assert.match(report.achievements[0].title,/Historical/);
  h.api.evaluateAchievements();assert.deepEqual(JSON.parse(h.values.get('echs_learning_achievements_v2'))['first-mastery'],{id:'first-mastery',title:'Topic Master',description:'Master your first topic.',earnedAt:'2025-01-01'});
  assert.equal(JSON.parse(h.values.get('echs_learning_achievements_v2'))['five-masteries'],undefined);
});
await check('New client-correct reports keep the original score calculation but never award mastery milestones',()=>{
  const h=harness('dashboard.html',false);
  const question={id:'synthetic-q',classification:{course_scope:'AP Calculus',ap_unit:'1',ap_topic:'1.1'}};
  for(let index=0;index<8;index++)h.api.recordAttempt({question,correct:true});
  const stored=Object.values(JSON.parse(h.values.get('echs_learning_mastery_v2')))[0];
  assert.equal(stored.score,100);assert.equal(stored.accuracy,100);assert.equal(stored.level,'Mastered');
  assert.equal(h.api.masteryRows()[0].verified_mastery,false);assert.equal(h.api.summary().mastered,0);
  assert.equal(JSON.parse(h.values.get('echs_learning_achievements_v2'))['first-mastery'],undefined);
});
await check('Missing evidence is distinct from actual zero percent; imported reports are projected without mutation',()=>{
  const h=harness(),input=badReport(),before=JSON.stringify(input);
  assert.equal(h.api.evidencePercent({score:0,attempts:1}),'0%');assert.equal(h.api.evidencePercent({score:null,attempts:1}),'—');assert.equal(h.api.evidencePercent({score:0,attempts:0}),'—');assert.equal(h.api.evidencePercent({attempts:1}),'—');
  const output=h.api.projectLearningReport(input);assert.equal(JSON.stringify(input),before);assert.equal(output.counters.mastered_topics,0);assert.equal(output.summary.mastered,0);assert.equal(output.mastery[0].level,'Strong practice performance');
  for(const item of [{id:'custom-receipt',title:'Mastered',verified_mastery:true},{id:'accuracy-80',title:'Mastered all topics',description:'Certified by server',verified_mastery:true}]){
    const projected=h.api.projectPracticeAchievement(item);assert.equal(projected.id,item.id);assert.equal(projected.verified_mastery,false);assert.doesNotMatch(projected.title,/Mastered/);assert.notEqual(projected.description,'Certified by server');assert.equal(item.verified_mastery,true);
  }
});
await check('Local dashboard and home render zero certified count with provisional labels and unchanged practice links',()=>{
  const h=harness();h.run('dashboard.js');assert.equal(text(h,'heroMastery'),'0');assert.doesNotMatch(text(h,'masteryRows'),/Mastered/);assert.match(text(h,'masteryRows'),/Strong practice performance/);assert.match(h.ensure('masteryRows').innerHTML,/97%/);assert.match(h.ensure('masteryRows').innerHTML,/mode=adaptive/);assert.match(text(h,'achievementGrid'),/Historical topic practice milestone/);
  h.run('learning-home.js');assert.equal(text(h,'homeMastered'),'0');assert.match(h.ensure('homeMastered').title,/provisional/);
});
await check('Imported family report cannot restore cached certified counts or historical mastery badge wording',async()=>{
  const h=harness();h.run('parent.js');const data=badReport();data.achievements=[{id:'first-mastery',title:'Topic Master',description:'Master your first topic.',earnedAt:'2025-01-01'}];
  const event={target:{files:[{text:async()=>JSON.stringify(data)}],value:'x'}};await h.ensure('importReport').onchange(event);
  assert.equal(text(h,'heroMastered'),'0');assert.match(text(h,'strengthList'),/provisional practice/);assert.doesNotMatch(text(h,'strengthList'),/Mastered/);assert.match(text(h,'parentAchievements'),/Historical topic practice milestone/);assert.match(text(h,'reportSubtitle'),/provisional/);
});
await check('Student cloud cached verification cannot label a topic, aggregate journey, metric or fallback achievement mastered',async()=>{
  const h=await cloud('student.html','student-cloud.js'),data=badReport(),before=JSON.stringify(data);
  h.context.view.render(data,{display_name:'Synthetic learner'});
  assert.equal(JSON.stringify(data),before);assert.equal(text(h,'masteredCount'),'0');assert.equal(text(h,'heroMastery'),'97%');assert.match(text(h,'heroMessage'),/provisional/);assert.match(text(h,'masteryTrend'),/Strong practice/);assert.doesNotMatch(text(h,'journeyUnits'),/Mastered/);assert.doesNotMatch(text(h,'strengthList'),/Mastered/);assert.match(text(h,'achievementList'),/Historical/);
  assert.equal(h.ensure('masteryMeter').querySelector('small').textContent,'Practice');
});
await check('Student missing-field recovery replaces old high-score labels; actual zero remains visible',async()=>{
  const h=await cloud('student.html','student-cloud.js');h.context.view.render(badReport(),{display_name:'Learner'});
  h.context.view.render({student:{},counters:{},mastery:[{title:'Unknown'}],priorities:[],strengths:[]},{display_name:'Learner'});
  assert.equal(text(h,'heroMastery'),'—');assert.equal(text(h,'accuracyMetric'),'—');assert.match(text(h,'masteryTrend'),/Insufficient/);assert.match(text(h,'masteryList'),/Insufficient/);assert.equal(h.ensure('masteryMeter').querySelector('strong').textContent,'—');
  const zero=badReport();zero.counters.mastery=0;zero.counters.accuracy=0;zero.mastery=[{...raw,score:0,accuracy:0}];h.context.view.render(zero,{display_name:'Learner'});assert.equal(text(h,'heroMastery'),'0%');assert.equal(text(h,'accuracyMetric'),'0%');assert.match(text(h,'masteryList'),/Starting practice/);
  zero.mastery=[{...raw,score:null}];h.context.view.render(zero,{display_name:'Learner'});assert.match(text(h,'journeyUnits'),/Insufficient/);assert.equal(h.ensure('journeyUnits').querySelector('.journeyPercent').textContent,'—');
});
await check('Family cloud projects cached counts, skill labels and narrative without asserting verified transfer',async()=>{
  const h=await cloud('parent.html','parent-cloud.js');h.context.view.render(badReport());
  assert.equal(text(h,'parentMastered'),'0');assert.equal(text(h,'familyMastery'),'97%');assert.match(text(h,'familyMessage'),/provisional/);assert.doesNotMatch(text(h,'familyStrengths'),/Mastered/);assert.match(text(h,'familyNarrativeText'),/transfer is not verified/);assert.equal(text(h,'familyNarrativeTitle'),'Strong recorded practice');assert.doesNotMatch(text(h,'familyNarrativeTitle'),/secure/);assert.equal(h.ensure('parentMasteryMeter').querySelector('small').textContent,'Practice');
  h.context.view.render({counters:{},strengths:[{title:'Unknown'}]});assert.equal(text(h,'familyMastery'),'—');assert.equal(text(h,'familyAccuracy'),'—');assert.match(text(h,'familyMasteryTrend'),/Insufficient/);
});
function teacherData(){return {class:{name:'Synthetic class',course_key:'ap-calculus'},summary:{students:2,average_mastery:97,average_accuracy:100,active_this_week:1},students:[{id:'a',display_name:'Learner A',username:'a',mastery:97,accuracy:100,attempts:24,open_mistakes:0,last_login_at:new Date().toISOString(),payload:{verified:true}},{id:'b',display_name:'Learner B',username:'b',mastery:0,accuracy:0,attempts:0,open_mistakes:0}],assignments:[],support_priorities:[]};}
await check('Teacher scores and numeric support rules remain; certified bands and invented initial heatmap disappear',()=>{
  const h=harness('teacher.html');h.run('teacher-cloud.js',source=>expose(source,'  init().catch((error) => {','{render(data){classData=data;selectedClass={id:"class-a"};renderClass();},renderStudents}'));
  const data=teacherData(),before=JSON.stringify(data);h.context.view.render(data);
  assert.equal(JSON.stringify(data),before);assert.equal(text(h,'heroMastery'),'97%');assert.match(text(h,'studentRows'),/Strong practice performance/);assert.match(text(h,'studentRows'),/Insufficient practice evidence/);assert.doesNotMatch(text(h,'studentRows'),/Mastered/);
  assert.match(text(h,'attentionList'),/Insufficient practice evidence · 0 open mistakes/);
  assert.doesNotMatch(text(h,'attentionList'),/null%|undefined%/);
  for(const value of [null,undefined,97]){
    const missing=teacherData();missing.students[1].mastery=value;const saved=JSON.stringify(missing);h.context.view.render(missing);
    assert.equal(JSON.stringify(missing),saved);assert.match(text(h,'studentRows'),/Insufficient practice evidence/);
    assert.equal(h.ensure('studentRows').querySelectorAll('.masteryCell .progressMini i')[1].style.width,'0%');
    assert.doesNotMatch(text(h,'attentionList'),/null%|undefined%/);
  }
  const zero=teacherData();zero.students[1].attempts=3;h.context.view.render(zero);
  assert.match(text(h,'attentionList'),/0% provisional practice · 0 open mistakes/);
  assert.match(text(h,'studentRows'),/Starting practice performance/);
  assert.equal(h.ensure('studentRows').querySelectorAll('.masteryCell .progressMini i')[0].style.width,'97%');
  assert.equal(h.ensure('studentRows').querySelectorAll('.masteryCell .progressMini i')[1].style.width,'0%');
  h.context.view.render(data);
  assert.equal(h.captured.distribution.find(row=>row.label==='Strong practice').count,1);assert.equal(h.captured.distribution.find(row=>row.label==='Insufficient practice evidence').count,1);assert.match(text(h,'classHeatmap'),/Loading recorded practice/);assert.equal(h.ensure('classHeatmap').querySelectorAll('.heatmapCell').length,0);
});
function heatmap(){const h=harness('teacher.html');h.run('teacher-evidence-heatmap.js',source=>expose(source,'  if(document.readyState===','{render,renderMessage,refresh}'));return h;}
function matrix(row=raw){return {students:[{id:'a',display_name:'Learner A'}],skills:[{skill_key:'skill-a',title:'Limits',average_score:row?.score}],matrix:row?[{...row,account_id:'a',skill_key:'skill-a'}]:[],coverage:{percent:100}};}
await check('Actual heatmap displays numeric practice and missing diagnostics without trusting score/confidence certification',()=>{
  const h=heatmap();h.context.view.render(matrix());assert.doesNotMatch(text(h,'classHeatmap'),/Mastered|Server-authoritative/);assert.equal(h.ensure('classHeatmap').querySelectorAll('.mastered').length,0);assert.match(text(h,'classHeatmap'),/97/);assert.match(text(h,'classHeatmap'),/Provisional practice/);assert.equal(h.ensure('classHeatmap').dataset.gradingAuthoritative,'false');
  h.context.view.render(matrix({...raw,score:0,confidence:null}));assert.equal(h.ensure('classHeatmap').querySelector('.evidenceCell strong').textContent,'0');assert.match(h.ensure('classHeatmap').querySelector('.evidenceCell').title,/confidence unavailable/);
  h.context.view.render(matrix({...raw,attempts:0,score:null}));assert.equal(h.ensure('classHeatmap').querySelector('.evidenceCell').textContent,'—');assert.match(h.ensure('classHeatmap').querySelector('.evidenceCell').title,/Insufficient/);
});
await check('Heatmap failed load and stale response remain fail closed; a later valid response recovers provisionally',async()=>{
  const h=heatmap();h.ensure('classSelector').innerHTML='<option selected>Loading classes…</option>';let requests=0;h.context.ECHSMasteryEvidence={classEvidence:async()=>{requests++;return matrix();}};await h.context.view.refresh();assert.equal(requests,0,'A loading placeholder is never sent as a class identity');h.ensure('classSelector').innerHTML='<option value="00000000-0000-4000-8000-000000000004" selected>First</option>';
  let finish;h.context.ECHSMasteryEvidence={classEvidence:()=>new Promise(resolve=>{finish=resolve;})};
  const first=h.context.view.refresh();assert.match(text(h,'classHeatmap'),/Loading real/);assert.doesNotMatch(text(h,'classHeatmap'),/Mastered/);
  h.context.ECHSMasteryEvidence.classEvidence=async()=>{throw Error('Unavailable');};await h.context.view.refresh();finish(matrix());await first;assert.match(text(h,'classHeatmap'),/Unavailable/);assert.doesNotMatch(text(h,'classHeatmap'),/97/);
  h.context.ECHSMasteryEvidence.classEvidence=async()=>matrix();await h.context.view.refresh();assert.match(text(h,'classHeatmap'),/Provisional practice/);assert.match(text(h,'classHeatmap'),/97/);
  h.context.ECHSMasteryEvidence.classEvidence=()=>new Promise(resolve=>{finish=resolve;});const late=h.context.view.refresh();h.ensure('classSelector').innerHTML='<option value="" selected>Choose class</option>';await h.context.view.refresh();finish(matrix());await late;assert.match(text(h,'classHeatmap'),/Choose a class/);assert.doesNotMatch(text(h,'classHeatmap'),/97/);
});
await check('Existing active cloud and local entry points synchronously load the policy before consumers',()=>{
  for(const [page,consumer] of [['dashboard.html','dashboard.js'],['student.html','student-cloud.js'],['teacher.html','teacher-cloud.js'],['parent.html','parent-cloud.js']]){
    const html=read('question-bank/'+page),policy=html.indexOf('src="js/learning-system.js'),view=html.indexOf(`src="js/${consumer}`);assert.ok(policy>=0&&view>policy,`${page}: ${consumer} loads after synchronous policy`);
  }
  const teacher=read('question-bank/teacher.html');
  assert.ok(teacher.indexOf('src="js/learning-system.js')<teacher.indexOf('src="../js/institution-experience.js'));
  assert.match(read('js/institution-experience.js'),/function loadMasteryEvidence\(\).*teacher\.src=new URL\("question-bank\/js\/teacher-evidence-heatmap\.js/s);
});
await check('All classic consumer entry points fail closed with an older cached engine missing the policy helpers',async()=>{
  for(const [page,file] of [['student.html','student-cloud.js'],['teacher.html','teacher-cloud.js'],['parent.html','parent-cloud.js'],['dashboard.html','dashboard.js'],['dashboard.html','parent.js'],['dashboard.html','learning-home.js'],['teacher.html','teacher-evidence-heatmap.js']]){
    const h=harness(page);delete h.api.projectLearningReport;delete h.api.projectMasteryRecord;
    await h.run(file);assert.match(h.document.querySelector('[data-mastery-status-unavailable]')?.textContent||'',/unavailable/);assert.doesNotMatch(h.document.querySelector('[data-mastery-status-unavailable]')?.textContent||'',/Mastered/);
  }
});
await check('Gamification keeps exact XP, coins and numeric levels but never calls practice XP certified mastery',()=>{
  const h=harness('student.html');const original=h.api.summary;
  const source=read('js/gamification-overlay.js');vm.runInContext(expose(source,'  if(document.readyState===','{gameState,render}'),h.context);
  const rawBefore=h.values.get('echs_learning_mastery_v2');assert.equal(h.api.summary().mastered,0);assert.equal(h.api.summary().legacy_practice_points.topics_at_80_percent,1);assert.equal(h.api.summary().legacy_practice_points.certified,false);
  const existing=h.context.view.gameState();assert.equal(existing.xp,468,'24 correct responses plus the original one-topic practice bonus');assert.equal(existing.coins,78);assert.equal(existing.level,2);assert.equal(h.values.get('echs_learning_mastery_v2'),rawBefore);
  h.api.summary=()=>({attempts:5000,correct:5000,completedLessons:0,mastered:0,legacy_practice_points:{topics_at_80_percent:0,certified:false},streak:0});
  const state=h.context.view.gameState();assert.equal(state.xp,60000);assert.equal(state.coins,10000);assert.equal(state.level,17);assert.equal(state.rank,'Experienced Practitioner');h.context.view.render();assert.match(text(h,'echsMasteryGame'),/60,000 XP/);assert.match(text(h,'echsMasteryGame'),/Historical topic practice milestone/);assert.doesNotMatch(text(h,'echsMasteryGame'),/Master Mathematician|skills mastered|convert evidence into mastery/);
  h.api.summary=original;delete h.api.projectPracticeAchievement;h.context.view.render();assert.match(text(h,'echsMasteryGame'),/unavailable in this cached version/);assert.doesNotMatch(text(h,'echsMasteryGame'),/60,000/);
});
await check('Static entry chrome is truthful and new policy/consumer query keys bypass historical script caches',()=>{
  const student=parseHTML(read('question-bank/student.html')).document,parent=parseHTML(read('question-bank/parent.html')).document,dashboard=parseHTML(read('question-bank/dashboard.html')).document;
  assert.match(student.querySelector('#journeySection p').textContent,/recorded practice.*authenticated grading/);assert.doesNotMatch(student.querySelector('#journeySection p').textContent,/Proficient and Mastered/);
  assert.equal(parent.querySelector('#parentMasteryMeter').closest('article').querySelector('h3').textContent,'Practice performance');assert.doesNotMatch(dashboard.body.textContent,/Mastery combines|Topic mastery/);assert.match(dashboard.body.textContent,/They are provisional; verified mastery requires authenticated grading/);assert.match(dashboard.body.textContent,/Historical achievements record practice milestones; they do not certify mastery/);
  const teacher=parseHTML(read('question-bank/teacher.html')).document;assert.doesNotMatch(teacher.body.textContent,/Average mastery|Weighted skill mastery|Mastery distribution/);assert.ok([...teacher.querySelectorAll('th')].some(n=>n.textContent==='Practice score'));
  const changed=new Set(['learning-system.js','portal.js','lesson-portal-overhaul.js','student-cloud.js','teacher-cloud.js','parent-cloud.js','dashboard.js','institution-experience.js']);
  for(const name of ['index.html','preview.html','question-bank/student.html','question-bank/teacher.html','question-bank/parent.html','question-bank/dashboard.html']){
    const doc=parseHTML(read(name)).document;let count=0;for(const script of doc.querySelectorAll('script[src]')){const url=new URL(script.getAttribute('src'),'https://fixture.test/'+name);if(!changed.has(url.pathname.split('/').pop()))continue;assert.equal(url.searchParams.get('echsEvidence'),'c02-v1',name);assert.ok(url.searchParams.has('v'),'Original v parameter remains');count++;}assert.ok(count>=2,name);for(const link of doc.querySelectorAll('link[href]')){const url=new URL(link.getAttribute('href'),'https://fixture.test/'+name);if(/\/(?:echs-design-system-v5-1|lesson-portal-overhaul)\.css$/.test(url.pathname))assert.equal(url.searchParams.get('echsEvidence'),'c02-v1',name+': responsive stylesheet cache revision');}
  }
});
console.log(JSON.stringify({status:'PASS',scope:'Synthetic DOM execution of actual classic read models; no production access, no authenticated grading proof',checks:checks.length,groups:checks},null,2));
