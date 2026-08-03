import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../data/ib-math-ai-unit-1-update.js',import.meta.url),'utf8');
const canonical={id:'g11-ib-ai',grade:'G11',title:'G11 IB Mathematics: Applications and Interpretation',shortTitle:'IB Math AI',units:Array.from({length:6},(_,index)=>({title:`Unit ${index+1}: Existing`,lessons:index===0?Array.from({length:5},(_,lesson)=>({number:`1.${lesson+1}`,title:'Old'})):Array.from({length:5},(_,lesson)=>({number:`${index+1}.${lesson+1}`,title:'Existing'}))}))};
const duplicate={id:'ib-math-ai',grade:'IB DP',title:'IB Mathematics: Applications and Interpretation',shortTitle:'IB Math AI',units:[{title:'Unit 1: Duplicate',lessons:Array.from({length:8},(_,index)=>({number:`1.${index+1}`,title:'Duplicate'}))}]};
const window={ECHS_COURSES:[canonical,duplicate],dispatchEvent(){}},context={window,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},console};
vm.createContext(context);vm.runInContext(source,context);
const ib=window.ECHS_COURSES.filter(course=>String(course.id).includes('ib-ai')||String(course.title).includes('IB Mathematics'));
if(ib.length!==1)throw new Error(`Expected one IB course card, found ${ib.length}`);
const course=ib[0];
if(course.id!=='g11-ib-ai')throw new Error(`Canonical ID changed to ${course.id}`);
if(course.units.length!==6)throw new Error(`Expected six canonical units, found ${course.units.length}`);
const unit=course.units[0];
if(unit.lessons.length!==8)throw new Error('Unit 1 was not replaced by eight lessons');
if(course.lessonCount!==33)throw new Error(`Expected 33 total lessons, found ${course.lessonCount}`);
if(unit.release!=='5.3.2')throw new Error(`Expected Unit 1 release 5.3.2, found ${unit.release}`);
if(unit.portalSummary!=='8 lessons · 368 purposeful Learn screens · 504 studio questions · 112 quiz questions · 28 extended tasks')throw new Error(`Unexpected portal summary: ${unit.portalSummary}`);

const lesson11=unit.lessons[0];
if(lesson11.title!=='Number Foundations, Scientific Notation and Approximation')throw new Error('Lesson 1.1 title was not synchronized');
if(lesson11.release!=='6.0.0'||lesson11.learnSlides!==79||lesson11.practiceQuestions!==96||lesson11.quizQuestions!==14||lesson11.extendedTasks!==5)throw new Error(`Lesson 1.1 totals are incorrect: ${JSON.stringify(lesson11)}`);

const lesson12=unit.lessons[1];
if(lesson12.title!=='Arithmetic Sequences and Series')throw new Error('Lesson 1.2 title was not synchronized');
if(lesson12.release!=='6.0.0'||lesson12.learnSlides!==73||lesson12.practiceQuestions!==96||lesson12.quizQuestions!==14||lesson12.extendedTasks!==5)throw new Error(`Lesson 1.2 totals are incorrect: ${JSON.stringify(lesson12)}`);
if(!lesson12.resources.some(resource=>resource.label==='Practice Studio · 96 questions'))throw new Error('Lesson 1.2 practice resource count is stale');
if(!lesson12.resources.some(resource=>resource.label==='IB-style assessment tasks · 5'))throw new Error('Lesson 1.2 assessment resource count is stale');

const urls=unit.lessons.map(item=>item.url);
if(new Set(urls).size!==8)throw new Error('Every Unit 1 lesson must have a unique direct URL');
if(urls.some(url=>!/^lessons\/ib-math-ai\/unit-1\/lessons\/IB_AI_SL_1\.[1-8]_.+_ECHS\.html$/.test(url)))throw new Error(`Unit 1 contains a non-direct lesson URL: ${urls.join(', ')}`);
if(urls.some(url=>url.includes('?')))throw new Error('Direct IB Unit 1 lesson URLs must not depend on a query-string lesson selector');
console.log('IB Unit 1 canonical course-card and Lessons 1.1–1.2 v6 portal update: PASS');
