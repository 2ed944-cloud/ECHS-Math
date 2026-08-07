(function(){
  'use strict';
  const d=window.LESSON_DATA;if(!d||String(d.lesson?.number)!=='2.2')return;
  const byId=(items,id)=>items.find(item=>item.id===id);

  const p68=byId(d.practice,'IBAI-2.2-V5-P068');
  if(p68){p68.answer=String.raw`\(m=0\) or \(m=-8\)`;p68.solution=String.raw`Equating gives \(x^2-(4+m)x+4=0\). Tangency requires \((4+m)^2-16=0\), so \(4+m=\pm4\) and \(m=0\) or \(m=-8\).`;p68.check={mode:'text',accepted:['m=0 or m=-8','0 and -8','{-8,0}','m=-8,0']};}

  const p69=byId(d.practice,'IBAI-2.2-V5-P069');
  if(p69){p69.answer=String.raw`\(x=2\pm\frac{\sqrt{22}}2\), with \(y=6\pm\frac{\sqrt{22}}2\)`;p69.solution=String.raw`Equating gives \(2x^2-8x-3=0\). Hence \(x=[8\pm\sqrt{88}]/4=2\pm\sqrt{22}/2\), and \(y=x+4\).`;p69.check={mode:'text',accepted:['x=2±sqrt22/2','2+sqrt22/2 and 2-sqrt22/2','(2±sqrt22/2,6±sqrt22/2)']};}

  const p72=byId(d.practice,'IBAI-2.2-V5-P072');
  if(p72){p72.answer=String.raw`\(25\)`;p72.solution=String.raw`The positive equality crossing is approximately \(24.05\). Check \(P(24)=299.2<300\) and \(P(25)=315>300\). Therefore the first whole number is \(25\).`;p72.check={mode:'number',value:25,tolerance:0};}

  const q12=byId(d.quiz,'IBAI-2.2-V5-Q12');
  if(q12)q12.solution=String.raw`The positive equality root is approximately \(6.61\). Since \(P(6)=88<100\) and \(P(7)=108\ge100\), report 7.`;

  const task2=byId(d.exam,'IBAI-2.2-V5-T2');
  if(task2){const part=task2.parts.find(item=>item.label==='d');if(part)part.answer=String.raw`Solve \(-\frac8{81}x(x-18)\ge5\). Equality gives \(8x^2-144x+405=0\), so \(x\approx3.49\) and \(x\approx14.51\). Clearance is at least 5 m for approximately \(3.49\le x\le14.51\).`;}

  d.audit.precisionPatch='5.0.1';
})();
