(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='2.4')return;
const close=(actual,expected,tolerance=1e-9)=>Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance;
const duplicateValues=values=>{const seen=new Set(),dupes=new Set();values.forEach(value=>{const key=String(value);if(seen.has(key))dupes.add(key);seen.add(key);});return [...dupes];};
function balancedMath(text){const value=String(text??'');return (value.match(/\\\(/g)||[]).length===(value.match(/\\\)/g)||[]).length&&(value.match(/\\\[/g)||[]).length===(value.match(/\\\]/g)||[]).length;}
function run(){
  const errors=[],warnings=[],assert=(condition,message)=>{if(!condition)errors.push(message);};
  assert(data.schemaVersion==='5.0.0','schemaVersion must be 5.0.0.');
  assert(data.version==='5.0.0','version must be 5.0.0.');
  assert(Array.isArray(data.slides)&&data.slides.length===80,`Expected 80 Learn screens; found ${data.slides?.length}.`);
  assert(Array.isArray(data.practice)&&data.practice.length===80,`Expected 80 practice questions; found ${data.practice?.length}.`);
  assert(Array.isArray(data.quiz)&&data.quiz.length===16,`Expected 16 timed-quiz questions; found ${data.quiz?.length}.`);
  assert(Array.isArray(data.exam)&&data.exam.length===5,`Expected 5 IB tasks; found ${data.exam?.length}.`);
  ['Foundation','Application','Reasoning','Challenge'].forEach(level=>assert(data.practice.filter(item=>item.level===level).length===20,`${level} must contain exactly 20 practice questions.`));
  const questionIds=[...data.practice,...data.quiz,...data.exam].map(item=>item.id),duplicateIds=duplicateValues(questionIds);
  assert(duplicateIds.length===0,`Duplicate assessment IDs: ${duplicateIds.join(', ')}`);
  const practicePrompts=duplicateValues(data.practice.map(item=>item.prompt));assert(practicePrompts.length===0,'Practice prompts must be unique.');
  const quizPrompts=duplicateValues(data.quiz.map(item=>item.prompt));assert(quizPrompts.length===0,'Timed-quiz prompts must be unique.');
  [...data.practice,...data.quiz].forEach(item=>{
    assert(typeof item.prompt==='string'&&item.prompt.trim().length>8,`${item.id}: missing prompt.`);
    assert(typeof item.answer==='string'&&item.answer.trim().length>0,`${item.id}: missing answer.`);
    assert(typeof item.solution==='string'&&item.solution.trim().length>0,`${item.id}: missing solution.`);
    assert(Number.isInteger(item.marks)&&item.marks>0,`${item.id}: marks must be a positive integer.`);
    assert(balancedMath(item.prompt)&&balancedMath(item.answer)&&balancedMath(item.solution),`${item.id}: unbalanced math delimiters.`);
    if(item.check?.mode==='number')assert(Number.isFinite(Number(item.check.value))&&Number.isFinite(Number(item.check.tolerance)),`${item.id}: invalid numerical checker.`);
    if(Array.isArray(item.choices)){assert(item.choices.length>=3,`${item.id}: multiple-choice item has too few choices.`);assert(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<item.choices.length,`${item.id}: invalid correct-choice index.`);}
  });
  data.slides.forEach((slide,index)=>{assert(slide.title&&slide.section&&slide.kind&&typeof slide.html==='string',`Slide ${index+1}: incomplete metadata.`);assert(balancedMath(slide.html),`Slide ${index+1} (${slide.title}): unbalanced math delimiters.`);});
  data.exam.forEach(task=>{
    const sum=task.parts.reduce((total,part)=>total+Number(part.marks||0),0);assert(sum===task.total_marks,`${task.id}: part marks ${sum} do not equal total ${task.total_marks}.`);
    task.parts.forEach(part=>{assert(part.prompt&&part.answer&&part.markscheme,`${task.id}${part.label}: incomplete part.`);assert(balancedMath(part.prompt)&&balancedMath(part.answer),`${task.id}${part.label}: unbalanced math delimiters.`);});
  });
  const serialized=JSON.stringify(data),badMarkers=['TODO','TBD','lorem ipsum','development placeholder'];badMarkers.forEach(marker=>assert(!serialized.toLowerCase().includes(marker.toLowerCase()),`Forbidden marker found: ${marker}`));assert(!serialized.includes('NaN'),'Forbidden numerical marker found: NaN');assert(!serialized.includes('\"undefined\"'),'Forbidden numerical marker found: undefined');
  const visualIds=[...new Set(data.slides.flatMap(slide=>[...slide.html.matchAll(/data-el5-visual="([^"]+)"/g)].map(match=>match[1])))];
  const rendererIds=[...(window.__ECHS_EL5_VISUAL_IDS||[])],missingVisuals=visualIds.filter(id=>!rendererIds.includes(id)),unusedVisuals=rendererIds.filter(id=>!visualIds.includes(id));
  assert(visualIds.length===60,`Expected 60 purpose-built visual identifiers; found ${visualIds.length}.`);
  assert(missingVisuals.length===0,`Missing visual renderers: ${missingVisuals.join(', ')}`);
  if(unusedVisuals.length)warnings.push(`Unused visual renderers: ${unusedVisuals.join(', ')}`);
  assert(!document.querySelector('iframe'),'Lesson 2.4 must not use an iframe.');
  assert(![...document.scripts].some(script=>/^https?:/i.test(script.src)),'Lesson 2.4 must not load external scripts.');
  assert(data.ti84?.provider==='local lesson simulator','TI-84 provider must be the local lesson simulator.');
  assert(data.ti84?.externalService===false,'TI-84 externalService must be false.');
  assert(data.ti84?.iframe===false,'TI-84 iframe flag must be false.');
  assert(Array.isArray(data.ti84?.workflows)&&data.ti84.workflows.join(',')==='intersect,table,expreg','TI-84 workflows must be Intersect, TABLE and ExpReg.');
  const calibrations=[
    ['growth example',500*1.08**6,793.437161472,.0000005],
    ['decay example',1800*.86**7,626.270079990528,.0000005],
    ['transformed temperature',22+68*.72**4,40.27422208,.0000005],
    ['doubling time',Math.log(2)/Math.log(1.18),4.1878351335,.0000005],
    ['half-life',Math.log(.5)/Math.log(.83),3.72000617018,.0000005],
    ['TI-84 intersection',Math.log(240/85)/Math.log(1.16),6.9935832843,.0000005],
    ['TABLE n=9',18*1.12**9,49.915417634,.000001],
    ['TABLE n=10',18*1.12**10,55.9052677502,.000001]
  ];
  calibrations.forEach(([name,actual,expected,tolerance])=>assert(close(actual,expected,tolerance),`Numerical calibration failed: ${name}.`));
  const xs=[0,1,2,3,4,5,6],ys=[18,24,31,42,55,74,98],n=xs.length,sx=xs.reduce((a,b)=>a+b,0),sy=ys.map(Math.log).reduce((a,b)=>a+b,0),sxx=xs.reduce((a,b)=>a+b*b,0),sxy=xs.reduce((a,b,i)=>a+b*Math.log(ys[i]),0),m=(n*sxy-sx*sy)/(n*sxx-sx*sx),c=(sy-m*sx)/n,a=Math.exp(c),b=Math.exp(m);
  assert(close(a,17.9280903088,1e-8),'ExpReg coefficient a failed calibration.');assert(close(b,1.3264017773,1e-9),'ExpReg coefficient b failed calibration.');assert(close(a*b**8,171.7650468517,1e-7),'ExpReg x=8 prediction failed calibration.');
  data.audit=Object.assign({},data.audit,{runtime:{status:errors.length?'fail':'pass',checkedAt:'2026-08-09',checks:26+data.slides.length+data.practice.length+data.quiz.length+data.exam.length,visualRendererCount:rendererIds.length,errors,warnings}});
  document.documentElement.dataset.el5Audit=errors.length?'fail':'pass';document.body.dataset.el5Audit=errors.length?'fail':'pass';
  if(errors.length)console.error('Lesson 2.4 precision audit failed:',errors);else console.info(`Lesson 2.4 precision audit passed · ${data.slides.length} slides · ${data.practice.length} practice · ${visualIds.length} exact visuals · local TI-84.`);
  if(warnings.length)console.warn('Lesson 2.4 precision audit warnings:',warnings);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
