import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../data/ib-math-ai-unit-1-update.js',import.meta.url),'utf8');
const canonical={
  id:'g11-ib-ai',grade:'G11',title:'G11 IB Mathematics: Applications and Interpretation',shortTitle:'IB Math AI',
  units:Array.from({length:6},(_,index)=>({title:`Unit ${index+1}: Existing`,lessons:index===0?Array.from({length:5},(_,lesson)=>({number:`1.${lesson+1}`,title:'Old'})):Array.from({length:5},(_,lesson)=>({number:`${index+1}.${lesson+1}`,title:'Existing'}))}))
};
const duplicate={id:'ib-math-ai',grade:'IB DP',title:'IB Mathematics: Applications and Interpretation',shortTitle:'IB Math AI',units:[{title:'Unit 1: Duplicate',lessons:Array.from({length:8},(_,index)=>({number:`1.${index+1}`,title:'Duplicate'}))}]};
const events=[];
const window={ECHS_COURSES:[canonical,duplicate],dispatchEvent(event){events.push(event)}};
const context={window,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},console};
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
const summary='6 lessons · 471 purposeful Learn screens · 600 studio questions · 86 quiz questions · 31 extended tasks';
if(unit.portalSummary!==summary)throw new Error(`Unexpected portal summary: ${unit.portalSummary}`);
if(!unit.architectureNotes.some(note=>note.includes('Approximation')))throw new Error('Approximation consolidation note is missing');
if(!unit.architectureNotes.some(note=>note.includes('scientific-notation-first')))throw new Error('Lesson 1.1 core-route note is missing');
if(!unit.architectureNotes.some(note=>note.includes('loans')))throw new Error('Financial consolidation note is missing');
if(!unit.architectureNotes.some(note=>note.includes('Lesson 1.5')))throw new Error('Lesson 1.5 definitive-release note is missing');
if(!unit.architectureNotes.some(note=>note.includes('Lesson 1.6')))throw new Error('Lesson 1.6 definitive-release note is missing');

const expected=[
 ['Scientific Notation, Approximation and Error','6.8.0',79,96,14,5],
 ['Arithmetic Sequences and Series','6.0.0',73,96,14,5],
 ['Geometric Sequences and Series','6.0.0',73,96,14,5],
 ['Financial Applications','6.0.0',100,120,16,6],
 ['Exponent Laws and Logarithms','6.0.0',73,96,14,5],
 ['Technology for Equations and Systems','6.0.0',73,96,14,5]
];
unit.lessons.forEach((lesson,index)=>{
  const [title,release,slides,practice,quiz,tasks]=expected[index];
  if(lesson.number!==`1.${index+1}`)throw new Error(`Unexpected lesson number at index ${index}: ${lesson.number}`);
  if(lesson.title!==title||lesson.release!==release||lesson.learnSlides!==slides||lesson.practiceQuestions!==practice||lesson.quizQuestions!==quiz||lesson.extendedTasks!==tasks)throw new Error(`Lesson ${lesson.number} metadata mismatch: ${JSON.stringify(lesson)}`);
  if(!lesson.resources.some(resource=>resource.label===`Practice Studio · ${practice} questions`))throw new Error(`Lesson ${lesson.number} practice resource count is stale`);
  if(!lesson.resources.some(resource=>resource.label===`IB-style assessment tasks · ${tasks}`))throw new Error(`Lesson ${lesson.number} task resource count is stale`);
});

const lesson11=unit.lessons[0];
if(lesson11.defaultScope!=='IB SL Core'||lesson11.allContentAvailable!==true)throw new Error('Lesson 1.1 scope metadata is incomplete');
if(JSON.stringify(lesson11.scopeCounts)!==JSON.stringify({learn:{core:70,all:79},practice:{core:88,all:96},quiz:{core:12,all:14},tasks:{core:4,all:5}}))throw new Error(`Lesson 1.1 scope counts are incorrect: ${JSON.stringify(lesson11.scopeCounts)}`);
if(lesson11.calculator?.simulator!=='ECHS local lesson simulator'||lesson11.calculator?.externalDependency!==false)throw new Error('Lesson 1.1 local calculator metadata is incomplete');
for(const required of ['scientific notation','guard digits','percentage error'])if(!lesson11.outcomes.some(outcome=>outcome.toLowerCase().includes(required)))throw new Error(`Lesson 1.1 outcome missing ${required}`);
if(lesson11.outcomes.some(outcome=>outcome.toLowerCase().includes('complex numbers')))throw new Error('Complex-number classification must not be a core Lesson 1.1 outcome');

const lesson14=unit.lessons[3];
if(!lesson14.outcomes.some(outcome=>outcome.includes('annuities')))throw new Error('Lesson 1.4 annuity outcome is missing');
if(!lesson14.outcomes.some(outcome=>outcome.includes('amortization')))throw new Error('Lesson 1.4 amortization outcome is missing');
if(lesson14.organization_release!=='6.1.0'||lesson14.organization!=='one lesson with seven internal teaching blocks')throw new Error('Lesson 1.4 organization metadata is incomplete');
if(lesson14.teachingBlocks?.map(block=>block.code).join(',')!=='1.4A,1.4B,1.4C,1.4D,1.4E,1.4F,1.4G')throw new Error('Lesson 1.4 teaching-block sequence is incorrect');
if(lesson14.teachingBlocks.some(block=>block.estimatedClassroomTime!=='60–75 minutes'))throw new Error('Lesson 1.4 pacing metadata is incomplete');

const lesson15=unit.lessons[4];
for(const required of ['negative and rational exponents','common bases','logarithms','logarithmic-scale'])if(!lesson15.outcomes.some(outcome=>outcome.toLowerCase().includes(required)))throw new Error(`Lesson 1.5 outcome missing ${required}`);
if(lesson15.organization_release!=='6.1.0'||lesson15.organization!=='one lesson with four internal teaching blocks')throw new Error('Lesson 1.5 organization metadata is incomplete');
if(lesson15.teachingBlocks?.map(block=>block.code).join(',')!=='1.5A,1.5B,1.5C,1.5D')throw new Error('Lesson 1.5 teaching-block sequence is incorrect');
if(lesson15.teachingBlocks.some(block=>block.estimatedClassroomTime!=='60–75 minutes'))throw new Error('Lesson 1.5 pacing metadata is incomplete');

const lesson16=unit.lessons[5];
if(!lesson16.url.endsWith('IB_AI_SL_1.6_technology_equations_ECHS.html'))throw new Error(`Lesson 1.6 canonical URL is incorrect: ${lesson16.url}`);
for(const required of ['polynomial-root','classify two-variable','three-variable','model parameters','residuals','integrality'])if(!lesson16.outcomes.some(outcome=>outcome.toLowerCase().includes(required)))throw new Error(`Lesson 1.6 outcome missing ${required}`);
if(lesson16.organization_release!=='6.1.0'||lesson16.organization!=='one lesson with four internal teaching blocks')throw new Error('Lesson 1.6 organization metadata is incomplete');
if(lesson16.officialSection?.code!=='SL 1.8')throw new Error('Lesson 1.6 official syllabus section is missing');
if(lesson16.teachingBlocks?.map(block=>block.code).join(',')!=='1.6A,1.6B,1.6C,1.6D')throw new Error('Lesson 1.6 teaching-block sequence is incorrect');
if(lesson16.teachingBlocks.some(block=>block.estimatedClassroomTime!=='60–75 minutes'))throw new Error('Lesson 1.6 pacing metadata is incomplete');

const totals=unit.lessons.reduce((acc,lesson)=>{acc.slides+=lesson.learnSlides;acc.practice+=lesson.practiceQuestions;acc.quiz+=lesson.quizQuestions;acc.tasks+=lesson.extendedTasks;return acc;},{slides:0,practice:0,quiz:0,tasks:0});
if(JSON.stringify(totals)!==JSON.stringify({slides:471,practice:600,quiz:86,tasks:31}))throw new Error(`Unit totals are inconsistent: ${JSON.stringify(totals)}`);
const urls=unit.lessons.map(item=>item.url);
if(new Set(urls).size!==6)throw new Error('Every Unit 1 lesson must have a unique direct URL');
if(urls.some(url=>!/^lessons\/ib-math-ai\/unit-1\/lessons\/IB_AI_SL_1\.[1-6]_.+_ECHS\.html$/.test(url)))throw new Error(`Unit 1 contains a non-direct lesson URL: ${urls.join(', ')}`);
if(urls.some(url=>url.includes('?')))throw new Error('Direct Unit 1 lesson URLs must not depend on a query-string selector');
if(!events.some(event=>event.type==='echs:ib-ai-unit-ready'&&event.detail?.lessons===6&&event.detail?.release==='6.0.0'))throw new Error('Unit-ready event was not dispatched correctly');

console.log('IB Unit 1 six-lesson portal update with Lesson 1.1 local TI-84 release: PASS');
