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
if(unit.lessons.length!==6)throw new Error(`Unit 1 must contain six consolidated lessons, found ${unit.lessons.length}`);
if(course.lessonCount!==31)throw new Error(`Expected 31 total lessons after consolidation, found ${course.lessonCount}`);
if(unit.release!=='6.0.0')throw new Error(`Expected Unit 1 release 6.0.0, found ${unit.release}`);
if(unit.portalSummary!=='6 lessons · 397 purposeful Learn screens · 512 studio questions · 86 quiz questions · 27 extended tasks')throw new Error(`Unexpected portal summary: ${unit.portalSummary}`);
if(!unit.architectureNotes.some(note=>note.includes('Approximation')))throw new Error('Approximation consolidation note is missing');
if(!unit.architectureNotes.some(note=>note.includes('loans')))throw new Error('Financial consolidation note is missing');

const expected=[
 ['Number Foundations, Scientific Notation and Approximation','6.0.0',79,96,14,5],
 ['Arithmetic Sequences and Series','6.0.0',73,96,14,5],
 ['Geometric Sequences and Series','6.0.0',73,96,14,5],
 ['Financial Applications','6.0.0',100,120,16,6],
 ['Exponent Laws and Logarithms','5.3.0',36,52,14,3],
 ['Technology for Equations and Systems','5.3.3-renumbered',36,52,14,3]
];
unit.lessons.forEach((lesson,index)=>{
  const [title,release,slides,practice,quiz,tasks]=expected[index];
  if(lesson.number!==`1.${index+1}`)throw new Error(`Unexpected lesson number at index ${index}: ${lesson.number}`);
  if(lesson.title!==title||lesson.release!==release||lesson.learnSlides!==slides||lesson.practiceQuestions!==practice||lesson.quizQuestions!==quiz||lesson.extendedTasks!==tasks)throw new Error(`Lesson ${lesson.number} metadata mismatch: ${JSON.stringify(lesson)}`);
});
const lesson14=unit.lessons[3];
if(!lesson14.outcomes.some(outcome=>outcome.includes('annuities')))throw new Error('Lesson 1.4 annuity outcome is missing');
if(!lesson14.outcomes.some(outcome=>outcome.includes('amortization')))throw new Error('Lesson 1.4 amortization outcome is missing');
if(!lesson14.resources.some(resource=>resource.label==='Practice Studio · 120 questions'))throw new Error('Lesson 1.4 practice count is stale');
if(!lesson14.resources.some(resource=>resource.label==='IB-style assessment tasks · 6'))throw new Error('Lesson 1.4 task count is stale');
if(lesson14.organization_release!=='6.1.0')throw new Error('Lesson 1.4 organization release is missing');
if(lesson14.organization!=='one lesson with seven internal teaching blocks')throw new Error('Lesson 1.4 organization description is missing');
if(!Array.isArray(lesson14.teachingBlocks)||lesson14.teachingBlocks.length!==7)throw new Error('Lesson 1.4 must expose seven teaching blocks');
if(lesson14.teachingBlocks.map(block=>block.code).join(',')!=='1.4A,1.4B,1.4C,1.4D,1.4E,1.4F,1.4G')throw new Error('Lesson 1.4 teaching-block sequence is incorrect');
if(lesson14.teachingBlocks.some(block=>block.estimatedClassroomTime!=='60–75 minutes'))throw new Error('Lesson 1.4 teaching-block pacing metadata is incomplete');
const lesson16=unit.lessons[5];
if(!lesson16.url.endsWith('IB_AI_SL_1.6_technology_equations_ECHS.html'))throw new Error(`Lesson 1.6 canonical URL is incorrect: ${lesson16.url}`);

const urls=unit.lessons.map(item=>item.url);
if(new Set(urls).size!==6)throw new Error('Every Unit 1 lesson must have a unique direct URL');
if(urls.some(url=>!/^lessons\/ib-math-ai\/unit-1\/lessons\/IB_AI_SL_1\.[1-6]_.+_ECHS\.html$/.test(url)))throw new Error(`Unit 1 contains a non-direct lesson URL: ${urls.join(', ')}`);
if(urls.some(url=>url.includes('?')))throw new Error('Direct Unit 1 lesson URLs must not depend on a query-string selector');
console.log('IB Unit 1 six-lesson portal update and Financial Applications teaching blocks: PASS');
