import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const unit=path.join(root,'lessons/ib-math-ai/unit-6');
const dataDir=path.join(unit,'data');
const lessonHtml=path.join(unit,'lessons/IB_AI_SL_6.2_ia_question_design_ECHS.html');
const files=[
  'lesson-6.2-v1-core.js',
  'lesson-6.2-v1-slides-01.js',
  'lesson-6.2-v1-slides-02.js',
  'lesson-6.2-v1-slides-03.js',
  'lesson-6.2-v1-slides-04.js',
  'lesson-6.2-v1-slides-05.js',
  'lesson-6.2-v1-slides-06.js',
  'lesson-6.2-v1-slides-07.js',
  'lesson-6.2-v1-slides-08.js',
  'lesson-6.2-v1-slides-09.js',
  'lesson-6.2-v1-slides-10.js',
  'lesson-6.2-v1-slides-11.js',
  'lesson-6.2-v1-slides-12.js',
  'lesson-6.2-v1-practice-01.js',
  'lesson-6.2-v1-practice-02.js',
  'lesson-6.2-v1-practice-03.js',
  'lesson-6.2-v1-practice-04.js',
  'lesson-6.2-v1-practice-05.js',
  'lesson-6.2-v1-practice-06.js',
  'lesson-6.2-v1-exam-01.js',
  'lesson-6.2-v1-exam-02.js',
  'lesson-6.2-v1-quiz-01.js',
  'lesson-6.2-v1-quiz-02.js'
];

const context={window:{}};
vm.createContext(context);
for(const file of files){
  vm.runInContext(fs.readFileSync(path.join(dataDir,file),'utf8'),context,{filename:file});
}
const lesson=context.window.LESSON_DATA;
assert.equal(lesson.lesson.number,'6.2');
assert.equal(lesson.unit.number,6);
assert.equal(lesson.version,'6.2.0');
assert.equal(lesson.slides.length,57);
assert.equal(lesson.practice.length,64);
assert.equal(lesson.exam.length,4);
assert.equal(lesson.quiz.length,14);
assert.deepEqual(
  Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,lesson.practice.filter(q=>q.level===level).length])),
  {Foundation:16,Application:16,Reasoning:16,Challenge:16}
);
assert.deepEqual(
  Object.fromEntries(['A','B','C','D'].map(block=>[block,lesson.slides.filter(s=>s.block===block).length])),
  {A:14,B:14,C:14,D:15}
);
const allQuestions=[...lesson.practice,...lesson.quiz];
const ids=allQuestions.map(item=>item.id);
assert.equal(new Set(ids).size,ids.length,'question IDs must be unique');
const prompts=allQuestions.map(item=>item.prompt.replace(/\s+/g,' ').trim().toLowerCase());
assert.equal(new Set(prompts).size,prompts.length,'practice and quiz prompts must be distinct');
for(const q of allQuestions){
  assert.ok(q.id&&q.level&&q.command&&q.prompt&&q.answer&&q.solution&&q.hint,`complete fields for ${q.id}`);
  assert.ok(Number.isFinite(q.marks)&&q.marks>0,`positive marks for ${q.id}`);
  assert.ok(q.calculator,`calculator label for ${q.id}`);
  if(Array.isArray(q.choices)){
    assert.ok(q.choices.length>=3,`choices for ${q.id}`);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,`answer index for ${q.id}`);
  }else{
    assert.ok(['number','text'].includes(q.check?.mode),`check mode for ${q.id}`);
  }
}
for(const task of lesson.exam){
  assert.equal(task.parts.reduce((sum,part)=>sum+part.marks,0),task.total_marks,`mark total for ${task.id}`);
  assert.ok(task.parts.every(part=>part.answer&&part.markscheme),`complete markscheme for ${task.id}`);
}
const allText=JSON.stringify(lesson);
assert.equal((allText.match(/\\\(/g)||[]).length,(allText.match(/\\\)/g)||[]).length,'inline math delimiters');
assert.equal((allText.match(/\\\[/g)||[]).length,(allText.match(/\\\]/g)||[]).length,'display math delimiters');
assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(allText),'no control characters');
assert.ok(allText.includes('first assessment 2021–2028'),'current assessment version gate');
assert.ok(allText.includes('first assessed May 2029'),'new assessment version gate');
assert.ok(allText.includes('data minimization'),'ethics and privacy coverage');
assert.ok(allText.includes('validation MAE'),'validation evidence coverage');

const html=fs.readFileSync(lessonHtml,'utf8');
for(const file of [
  ...files,'lesson-6.2-v1-interactions.js','lesson-6.2-ti84-simulator.js',
  'lesson-6.2-v1-1.css','lesson-6.2-v1-2.css','lesson-6.2-v1-3.css','lesson-6.2-v1-4.css'
])assert.ok(html.includes(file),`${file} is loaded by the lesson`);
assert.ok(html.indexOf('lesson-6.2-v1-quiz-02.js')<html.indexOf('engine.js'),'lesson data loads before engine');
assert.ok(html.includes('data-lesson="6.2"'),'lesson shell metadata');

const css=[1,2,3,4].map(i=>fs.readFileSync(path.join(unit,`assets/css/lesson-6.2-v1-${i}.css`),'utf8')).join('\n');
const classNames=[...allText.matchAll(/class=\\"([^\"]+)\\"/g)].flatMap(match=>match[1].split(/\s+/)).filter(name=>name.startsWith('u62-'));
for(const className of new Set(classNames)){
  assert.ok(css.includes(`.${className}`),`CSS selector present for ${className}`);
}

// Independent numerical checks for consequential mathematics.
const close=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} ≈ ${expected}`);
const xs=[0,1,2,3,4,5,6],ys=[4.2,6.0,9.1,12.9,17.8,23.9,31.1];
const xm=xs.reduce((a,b)=>a+b,0)/xs.length,ym=ys.reduce((a,b)=>a+b,0)/ys.length;
const slope=xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0)/xs.reduce((s,x)=>s+(x-xm)**2,0);
const intercept=ym-slope*xm;
close(slope,4.471428571428571);
close(intercept,1.585714285714286);
const linPred=xs.map(x=>slope*x+intercept);
const linMae=linPred.reduce((s,p,i)=>s+Math.abs(ys[i]-p),0)/xs.length;
close(linMae,1.5142857142857153);
const r=(250/Math.PI)**(1/3);
close(r,4.3012700691404975);
close(500/(Math.PI*r*r),8.602540138280999);
close(8/6+3/6,11/6);
close(Math.abs(1.86-11/6),0.02666666666666684);

for(const script of [
  path.join(dataDir,'lesson-6.2-v1-interactions.js'),
  path.join(dataDir,'lesson-6.2-ti84-simulator.js')
]){
  const code=fs.readFileSync(script,'utf8');
  new vm.Script(code,{filename:script});
}

const manifest=JSON.parse(fs.readFileSync(path.join(unit,'manifest.json'),'utf8'));
assert.equal(manifest.version,'6.2.0');
const manifest62=manifest.lessons.find(item=>item.number==='6.2');
assert.ok(manifest62);
assert.equal(manifest62.slides,57);
assert.equal(manifest62.practice,64);
assert.equal(manifest62.examTasks,4);
assert.equal(manifest62.quiz,14);
assert.ok(!manifest.futureLessons.some(item=>item.number==='6.2'));

const start=fs.readFileSync(path.join(unit,'START_HERE.html'),'utf8');
assert.ok(start.includes('IB_AI_SL_6.2_ia_question_design_ECHS.html'));
assert.ok(start.includes('105 learning screens'));
assert.ok(start.includes('first assessed in May 2029'));

const eventLog=[];
class CustomEventMock{constructor(type,options={}){this.type=type;this.detail=options.detail;}}
const portalContext={
  window:{
    ECHS_COURSES:[{id:'g11-ib-ai',title:'G11 IB Mathematics: Applications and Interpretation',units:[
      {title:'Unit 5: Calculus',lessons:[]},
      {title:'Unit 6: Exploration, Technology, and Exam Practice',lessons:[{number:'6.1',status:'flow'}]}
    ]}],
    dispatchEvent:event=>eventLog.push(event)
  },
  CustomEvent:CustomEventMock,
  console
};
vm.createContext(portalContext);
vm.runInContext(fs.readFileSync(path.join(root,'data/ib-math-ai-unit-6-update.js'),'utf8'),portalContext);
const course=portalContext.window.ECHS_COURSES[0];
const unit6=course.units.find(value=>/^Unit 6:/.test(value.title));
assert.equal(unit6.lessons.length,5);
assert.equal(unit6.lessons.find(item=>item.number==='6.2').status,'ready');
assert.equal(unit6.lessons.find(item=>item.number==='6.2').learning_cards,57);
assert.equal(eventLog.at(-1).detail.readyLessons,2);

console.log('IB AI Unit 6.2 release checks passed.');
