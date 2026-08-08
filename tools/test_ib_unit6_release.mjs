import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const unit = path.join(root, 'lessons/ib-math-ai/unit-6');
const dataDir = path.join(unit, 'data');
const lessonHtml = path.join(unit, 'lessons/IB_AI_SL_6.1_technology_fluency_routines_ECHS.html');

const lessonContext = { window: {} };
vm.createContext(lessonContext);
for (const file of [
  'lesson-6.1-v1-core.js',
  'lesson-6.1-v1-content-a.js',
  'lesson-6.1-v1-content-b.js',
  'lesson-6.1-v1-content-c.js',
  'lesson-6.1-v1-content-d.js',
  'lesson-6.1-v1-practice.js',
  'lesson-6.1-v1-assessment.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(dataDir, file), 'utf8'), lessonContext, { filename: file });
}
const lesson = lessonContext.window.LESSON_DATA;
assert.equal(lesson.lesson.number, '6.1');
assert.equal(lesson.unit.number, 6);
assert.equal(lesson.slides.length, 48);
assert.equal(lesson.practice.length, 48);
assert.equal(lesson.exam.length, 3);
assert.equal(lesson.quiz.length, 12);
assert.deepEqual(
  Object.fromEntries(['Foundation', 'Application', 'Reasoning', 'Challenge'].map(level => [level, lesson.practice.filter(q => q.level === level).length])),
  { Foundation: 12, Application: 12, Reasoning: 12, Challenge: 12 }
);
const ids = [...lesson.practice, ...lesson.quiz].map(item => item.id);
assert.equal(new Set(ids).size, ids.length, 'question IDs must be unique');
for (const task of lesson.exam) assert.equal(task.parts.reduce((sum, part) => sum + part.marks, 0), task.total_marks);

const allText = JSON.stringify(lesson);
assert.equal((allText.match(/\\\(/g) || []).length, (allText.match(/\\\)/g) || []).length, 'inline math delimiters');
assert.equal((allText.match(/\\\[/g) || []).length, (allText.match(/\\\]/g) || []).length, 'display math delimiters');
assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(allText), 'no control characters');

const html = fs.readFileSync(lessonHtml, 'utf8');
for (const file of [
  'lesson-6.1-v1-core.js', 'lesson-6.1-v1-content-a.js', 'lesson-6.1-v1-content-b.js',
  'lesson-6.1-v1-content-c.js', 'lesson-6.1-v1-content-d.js', 'lesson-6.1-v1-practice.js',
  'lesson-6.1-v1-assessment.js', 'lesson-6.1-v1-interactions.js', 'lesson-6.1-ti84-simulator.js'
]) assert.ok(html.includes(file), `${file} is loaded by the lesson`);
assert.ok(html.indexOf('lesson-6.1-v1-assessment.js') < html.indexOf('engine.js'), 'lesson data loads before engine');

const eventLog = [];
class CustomEventMock { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
const portalContext = {
  window: {
    ECHS_COURSES: [{ id: 'g11-ib-ai', title: 'G11 IB Mathematics: Applications and Interpretation', units: [
      { title: 'Unit 5: Calculus', lessons: [] },
      { title: 'Unit 6: Exploration, Technology, and Exam Practice', lessons: [{ number: '6.1', status: 'flow' }] }
    ] }],
    dispatchEvent: event => eventLog.push(event)
  },
  CustomEvent: CustomEventMock,
  console
};
vm.createContext(portalContext);
vm.runInContext(fs.readFileSync(path.join(root, 'data/ib-math-ai-unit-6-update.js'), 'utf8'), portalContext);
const course = portalContext.window.ECHS_COURSES[0];
const unit6 = course.units.find(value => /^Unit 6:/.test(value.title));
assert.ok(unit6);
assert.equal(unit6.lessons.length, 5);
assert.equal(unit6.lessons[0].status, 'ready');
assert.equal(unit6.lessons[0].learning_cards, 48);
assert.equal(eventLog.at(-1).detail.unit, 6);

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.equal((index.match(/ib-math-ai-unit-6-update\.js/g) || []).length, 1);
assert.ok(index.indexOf('ib-math-ai-unit-6-update.js') < index.indexOf('js/portal.js'));

// Independent numerical spot checks for the most consequential displayed results.
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
close(Math.log(18) / Math.log(2.7), 2.910009160288616);
close((5 + Math.sqrt(57)) / 2, 6.274917217635375);
const xs = [1,2,3,4,5,6,7,8], ys = [52,57,61,68,72,80,84,91];
const xm = xs.reduce((a,b)=>a+b,0)/xs.length, ym = ys.reduce((a,b)=>a+b,0)/ys.length;
const slope = xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0) / xs.reduce((s,x)=>s+(x-xm)**2,0);
close(slope, 5.583333333333333);
close(ym - slope * xm, 45.5);
const binom = (n,k,p) => { let c=1; for(let i=1;i<=k;i++) c=c*(n-i+1)/i; return c*p**k*(1-p)**(n-k); };
close(binom(12,5,.35), 0.2039195668118156);
close(Array.from({length:8},(_,i)=>binom(12,i+5,.35)).reduce((a,b)=>a+b,0), 0.41665494948399886);
close(120*8 + 9*8**2 - 0.5*8**3, 1280);

console.log('IB AI Unit 6.1 release checks passed.');
