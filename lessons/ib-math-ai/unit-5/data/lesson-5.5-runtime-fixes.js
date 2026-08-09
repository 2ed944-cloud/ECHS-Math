(function(){
'use strict';
const d=window.LESSON_DATA;
if(!d||d.lesson?.number!=='5.5'||window.__ECHS_LESSON55_RUNTIME_FIXES__)return;
let applied=0;
function replaceOnce(source,from,to,label){
  if(!source.includes(from))throw new Error(`Lesson 5.5 runtime correction target missing: ${label}`);
  applied+=1;
  return source.replace(from,to);
}
function slide(title){
  const item=d.slides.find(entry=>entry.title===title);
  if(!item)throw new Error(`Lesson 5.5 runtime correction slide missing: ${title}`);
  return item;
}
let item=slide('A fixed perimeter produces a one-variable area');
item.html=replaceOnce(item.html,'Let the side lengths be (x) and (y), with fixed perimeter (P).',String.raw`Let the side lengths be \(x\) and \(y\), with fixed perimeter \(P\).`,'rectangle variables');
item.html=replaceOnce(item.html,'The feasible domain is (0le xle P/2).',String.raw`The feasible domain is \(0\le x\le P/2\).`,'rectangle domain');
item=slide('A fixed volume can become a minimum-surface problem');
item.html=replaceOnce(item.html,'Let a closed cylinder have radius (r), height (h) and fixed volume (V_0).',String.raw`Let a closed cylinder have radius \(r\), height \(h\) and fixed volume \(V_0\).`,'cylinder variables');
item.html=replaceOnce(item.html,'So (h=V_0/(pi r^2)).',String.raw`So \(h=V_0/(\pi r^2)\).`,'cylinder substitution');
item.html=replaceOnce(item.html,'The physical domain is (r>0).',String.raw`The physical domain is \(r>0\).`,'cylinder domain');
item=slide('Check adjacent whole-number decisions');
item.html=replaceOnce(item.html,'Use TABLE with step (1) near the continuous optimum',String.raw`Use TABLE with step \(1\) near the continuous optimum`,'table increment');
item=slide('Find derivative candidates, then compare a table');
item.html=replaceOnce(item.html,'Enter the objective in (Y_1) and its derivative in (Y_2), use Zero on (Y_2)',String.raw`Enter the objective in \(Y_1\) and its derivative in \(Y_2\), use Zero on \(Y_2\)`,'TI derivative registers');
const task=d.exam.find(entry=>entry.id==='IBAI-5.5-V1-T5');
if(!task)throw new Error('Lesson 5.5 runtime correction task missing: IBAI-5.5-V1-T5');
const part=task.parts.find(entry=>entry.label==='c');
if(!part)throw new Error('Lesson 5.5 runtime correction part missing: IBAI-5.5-V1-T5(c)');
part.prompt=replaceOnce(part.prompt,'Monitoring stops after 3 hours. Determine the maximum observed concentration on ([0,3]).',String.raw`Monitoring stops after 3 hours. Determine the maximum observed concentration on \([0,3]\).`,'restricted concentration interval');
if(applied!==8)throw new Error(`Lesson 5.5 expected 8 runtime corrections, applied ${applied}.`);
window.__ECHS_LESSON55_RUNTIME_FIXES__={applied,version:'5.5.1'};
})();
