#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const dataPath=path.join(root,'lessons/ib-math-ai/unit-4/data/lesson-4.2-definitive-v2.js');
const interactionPath=path.join(root,'lessons/ib-math-ai/unit-4/data/lesson-4.2-interactions-v2.js');
const tiPath=path.join(root,'lessons/ib-math-ai/unit-4/data/lesson-4.2-ti84-v2.js');
const htmlPath=path.join(root,'lessons/ib-math-ai/unit-4/lessons/IB_AI_SL_4.2_centre_spread_outliers_ECHS.html');
const cssPath=path.join(root,'lessons/ib-math-ai/unit-4/assets/css/lesson-4.2-definitive-v2.css');

const failures=[];
const checks=[];
function check(condition,message){checks.push(message);if(!condition)failures.push(message);}
function near(actual,expected,tol=1e-9){return Number.isFinite(actual)&&Math.abs(actual-expected)<=tol;}
function loadData(){
  const context={window:{LESSON_DATA:{lesson:{number:'4.2'},unit:{number:4,title:'Statistics and Probability'},slides:[],practice:[],exam:[],quiz:[]}},console};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(dataPath,'utf8'),context,{filename:dataPath});
  return {data:context.window.LESSON_DATA,api:context.window.ECHS_IB_AI_4_2_DEFINITIVE};
}
function allStrings(value,trail='$',out=[]){
  if(typeof value==='string')out.push([trail,value]);
  else if(Array.isArray(value))value.forEach((v,i)=>allStrings(v,`${trail}[${i}]`,out));
  else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>allStrings(v,`${trail}.${k}`,out));
  return out;
}
function count(source,needle){return source.split(needle).length-1;}

for(const file of [dataPath,interactionPath,tiPath,htmlPath,cssPath])check(fs.existsSync(file),`Required file exists: ${path.relative(root,file)}`);
const {data,api}=loadData();

check(data.lesson.number==='4.2','Lesson number is 4.2');
check(data.lesson.title==='Measures of Centre, Spread, Box Plots, and Outliers','Definitive lesson title is installed');
check(data.slides.length===50,'Exactly 50 learning slides');
check(new Set(data.slides.map(s=>s.id)).size===50,'All slide IDs are unique');
check(data.practice.length===80,'Exactly 80 original Practice Studio questions');
check(new Set(data.practice.map(q=>q.id)).size===80,'All practice IDs are unique');
check(data.exam.length===3,'Exactly three extended IB tasks');
check(new Set(data.exam.map(q=>q.id)).size===3,'All IB task IDs are unique');
check(data.quiz.length===10,'Exactly ten timed-quiz questions');
check(new Set(data.quiz.map(q=>q.id)).size===10,'All quiz IDs are unique');

const levels=['Foundation','Application','Reasoning','Challenge','HOT'];
for(const level of levels)check(data.practice.filter(q=>q.level===level).length===16,`${level} contains exactly 16 questions`);
const normalizedPrompts=data.practice.map(q=>q.prompt.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().toLowerCase());
check(new Set(normalizedPrompts).size===normalizedPrompts.length,'No duplicated Practice Studio prompts');

for(const [index,q] of data.practice.entries()){
  const label=`Practice ${index+1} (${q.id})`;
  check(Boolean(q.prompt&&q.answer&&q.solution),`${label} has prompt, answer, and worked solution`);
  check(levels.includes(q.level),`${label} has a valid difficulty level`);
  check(Number.isFinite(q.marks)&&q.marks>0,`${label} has positive marks`);
  check(['No GDC required','GDC expected'].includes(q.calculator),`${label} has a valid calculator label`);
  check(['numeric','mcq','short'].includes(q.type),`${label} has a supported response type`);
  if(q.type==='numeric'){
    check(Number.isFinite(q.numeric_answer),`${label} has a finite numeric answer`);
    check(Number.isFinite(q.tolerance)&&q.tolerance>0,`${label} has a positive numeric tolerance`);
  }
  if(q.type==='mcq'){
    check(Array.isArray(q.choices)&&q.choices.length===4,`${label} has four choices`);
    check(Number.isInteger(q.correct_index)&&q.correct_index>=0&&q.correct_index<q.choices.length,`${label} has a valid correct index`);
    check(q.answer===q.choices[q.correct_index],`${label} answer matches the keyed choice`);
  }
}
for(const task of data.exam){
  const sum=task.parts.reduce((total,part)=>total+part.marks,0);
  check(sum===task.total_marks,`${task.id} part marks sum to ${task.total_marks}`);
  check(task.parts.every(part=>part.prompt&&part.answer&&part.solution),`${task.id} has complete solutions for every part`);
}
for(const [index,q] of data.quiz.entries()){
  check(Boolean(q.id&&q.prompt&&q.answer&&q.solution),`Quiz ${index+1} is complete`);
  if(q.type==='numeric')check(Number.isFinite(q.numeric_answer),`Quiz ${index+1} numeric answer is finite`);
  if(q.type==='mcq')check(q.answer===q.choices[q.correct_index],`Quiz ${index+1} key matches its answer`);
}

const strings=allStrings(data);
for(const [trail,text] of strings){
  check(!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text),`${trail} contains no control characters`);
  check(text.trim()!=='undefined'&&!/\bNaN\b/.test(text)&&!text.includes('[object Object]')&&!text.includes('${undefined}'),`${trail} contains no unresolved values`);
  check(!text.includes('+-'),`${trail} contains no malformed plus-minus sequence`);
  check(count(text,'\\(')===count(text,'\\)'),`${trail} has balanced inline-math delimiters`);
  check(count(text,'\\[')===count(text,'\\]'),`${trail} has balanced display-math delimiters`);
}

const classA=[68,72,74,76,78,82],classB=[55,65,74,76,85,95];
const a=api.stats(classA),b=api.stats(classB);
check(near(a.mean,75)&&near(a.med,75)&&near(a.iqr,6)&&near(a.sigma,4.43471156521669,1e-12),'Class A anchor statistics are exact');
check(near(b.mean,75)&&near(b.med,75)&&near(b.iqr,20)&&near(b.sigma,12.922847983320086,1e-12),'Class B anchor statistics are exact');
const response=api.stats([12,15,15,18,20,20,20,24]);
check(near(response.mean,18)&&near(response.sigma,3.570714214271425,1e-12)&&near(response.sx,3.8172540616821107,1e-12),'Sx and σx anchor output is exact');
const freq=api.stats(api.expand([10,15,20,25,30],[2,4,7,5,2]));
check(freq.n===20&&near(freq.mean,20.25)&&near(freq.med,20)&&near(freq.iqr,10)&&near(freq.sigma,5.584576975922169,1e-12),'Frequency-list anchor statistics are exact');
const box=api.stats([4,6,7,8,9,10,12,13,30]);
check(near(box.q1,6.5)&&near(box.med,9)&&near(box.q3,12.5)&&near(box.iqr,6)&&near(box.lower,-2.5)&&near(box.upper,21.5),'Box-plot quartiles and fences are exact');
check(JSON.stringify(box.outliers)==='[30]','Modified box plot flags exactly 30');
const boundary=api.stats([0,2,4,6,8,10,12,24]);
check(!boundary.outliers.includes(boundary.upper),'An observation equal to a fence is not classified as an outlier');
check(JSON.stringify(api.quartiles([10,20,30,40,50,60,70]))===JSON.stringify({min:10,q1:20,med:40,q3:60,max:70}),'Odd-n TI median-of-halves convention is correct');
check(JSON.stringify(api.quartiles([10,20,30,40,50,60,70,80]))===JSON.stringify({min:10,q1:25,med:45,q3:65,max:80}),'Even-n TI median-of-halves convention is correct');

const answer70=data.practice.find(q=>q.prompt.startsWith('Construct two ordered data sets'));
check(answer70.answer.includes('{0,2,2,5,7,8,10}')&&answer70.answer.includes('{0,2,4,5,7,8,10}'),'Counterexample answer contains two valid distinct-mean sets');
check(near(api.stats([0,2,2,5,7,8,10]).mean,34/7)&&near(api.stats([0,2,4,5,7,8,10]).mean,36/7),'Counterexample means are correct');
check(JSON.stringify(api.quartiles([0,2,2,5,7,8,10]))===JSON.stringify(api.quartiles([0,2,4,5,7,8,10])),'Counterexample five-number summaries are identical');

const html=fs.readFileSync(htmlPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),ti=fs.readFileSync(tiPath,'utf8');
for(const ref of ['lesson-4.2-definitive-v2.css','lesson-4.2-definitive-v2.js','lesson-4.2-interactions-v2.js','lesson-4.2-ti84-v2.js'])check(html.includes(ref),`HTML loads ${ref}`);
check(html.indexOf('lesson-4.2.js')<html.indexOf('lesson-4.2-definitive-v2.js')&&html.indexOf('lesson-4.2-definitive-v2.js')<html.indexOf('engine.js'),'Definitive data overlay loads after the existing data and before the existing engine');
check(!/https?:\/\//i.test(css+ti),'New CSS and TI-84 simulator contain no external network dependency');
check(ti.includes("offline:true")&&ti.includes('focusedStatisticsSimulator:true'),'TI-84 component declares its focused offline scope');
check(data.audit.slideCount===50&&data.audit.practiceCount===80&&data.audit.offlineSimulator===true,'Audit metadata matches the release');

console.log(`Validated ${checks.length} assertions.`);
if(failures.length){
  console.error(`\nFAILED ${failures.length} assertion(s):`);
  failures.forEach((failure,i)=>console.error(`${i+1}. ${failure}`));
  process.exit(1);
}
console.log('PASS · Lesson 4.2 definitive content, statistics, assessment schema, and static integration are internally consistent.');
