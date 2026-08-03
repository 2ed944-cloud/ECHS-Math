(function(){
'use strict';
const data=window.LESSON_DATA;
const lesson=String(data&&data.lesson&&data.lesson.number||'');
const pack=window.ECHS_UNIT1_V5_CONTENT&&window.ECHS_UNIT1_V5_CONTENT[lesson];
if(!data||!pack)return;
const v3=window.ECHS_UNIT1_V3_CONTENT&&window.ECHS_UNIT1_V3_CONTENT[lesson];
function array(value){return Array.isArray(value)?value:(value?[value]:[])}
function merge(base,extra){const out=[],seen=new Set();for(const item of [...array(base),...array(extra)]){if(!item)continue;const key=String(item.id||item.title||JSON.stringify(item));if(seen.has(key))continue;seen.add(key);out.push(item)}return out}
data.slides=pack.slides;
if(v3){data.practice=merge(data.practice,v3.practice);data.quiz=merge(data.quiz,v3.quiz);data.exam=merge(data.exam,v3.exam)}
data.version='5.3.0';data.buildDate='2026-08-03';
data.lesson.title=pack.title;data.lesson.subtitle=pack.subtitle;data.lesson.objectives=pack.objectives;data.lesson.vocab=pack.vocab;data.lesson.technology=pack.technology;data.lesson.source_basis=pack.source_basis;data.lesson.syllabus_focus=pack.syllabus_focus;
// Targeted mathematical repair retained from the full audit.
for(const item of array(data.practice)){if(String(item.id)==='u1-12-c08'){item.answer='-60';item.solution='From u21=-37 and u4=-3, 17d=-34 so d=-2 and u1=3. Hence S10=10[2(3)+9(-2)]/2=-60.';item.check={mode:'number',value:-60,tolerance:1e-6}}}
const expected={practice:52,quiz:14,exam:3};
window.__ECHS_UNIT1_V5_COUNTS={lesson,practice:array(data.practice).length,quiz:array(data.quiz).length,exam:array(data.exam).length,expected};
})();
