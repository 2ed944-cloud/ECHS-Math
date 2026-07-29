import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../data/ib-math-ai-unit-1-update.js',import.meta.url),'utf8');
const canonical={id:'g11-ib-ai',grade:'G11',title:'G11 IB Mathematics: Applications and Interpretation',shortTitle:'IB Math AI',units:Array.from({length:6},(_,index)=>({title:`Unit ${index+1}: Existing`,lessons:index===0?Array.from({length:5},(_,lesson)=>({number:`1.${lesson+1}`,title:'Old'})):Array.from({length:5},(_,lesson)=>({number:`${index+1}.${lesson+1}`,title:'Existing'}))}))};
const duplicate={id:'ib-math-ai',grade:'IB DP',title:'IB Mathematics: Applications and Interpretation',shortTitle:'IB Math AI',units:[{title:'Unit 1: Duplicate',lessons:Array.from({length:8},(_,index)=>({number:`1.${index+1}`,title:'Duplicate'}))}]};
const window={ECHS_COURSES:[canonical,duplicate],dispatchEvent(){}},context={window,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}} ,console};
vm.createContext(context);vm.runInContext(source,context);
const ib=window.ECHS_COURSES.filter(course=>String(course.id).includes('ib-ai')||String(course.title).includes('IB Mathematics'));
if(ib.length!==1)throw new Error(`Expected one IB course card, found ${ib.length}`);
const course=ib[0];
if(course.id!=='g11-ib-ai')throw new Error(`Canonical ID changed to ${course.id}`);
if(course.units.length!==6)throw new Error(`Expected six canonical units, found ${course.units.length}`);
if(course.units[0].lessons.length!==8)throw new Error('Unit 1 was not replaced by eight lessons');
if(course.lessonCount!==33)throw new Error(`Expected 33 total lessons, found ${course.lessonCount}`);
if(course.units[0].lessons[0].title!=='Scientific Notation and Orders of Magnitude')throw new Error('Lesson title was not rewritten correctly');
if(!course.units[0].lessons[0].url.includes('lesson.html?lesson=1.1'))throw new Error('Lesson 1.1 URL is not linked to the working runtime');
console.log('IB Unit 1 canonical course-card update: PASS');
