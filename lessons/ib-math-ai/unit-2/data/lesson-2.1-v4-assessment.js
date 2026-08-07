(function(){
  'use strict';
  const d=window.LESSON_DATA;
  if(!d||String(d.lesson?.number)!=='2.1')return;
  const R=String.raw;
  const Q=(id,command,prompt,answer,solution,marks=2,calculator='No GDC required',check=null,choices=null,correct=null)=>({id,level:'Quiz',command,prompt,answer,solution,marks,calculator,hint:'Use a concise IB-style method and check the domain.',tags:['functions','lesson-2.1','quiz'],...(check?{check}:{}),...(choices?{choices,correct}: {})});

  d.quiz=[
    Q('IBAI-2.1-V4-Q01','Identify','Which relation is a function?',[R`\(\{(1,2),(1,5),(3,7)\}\)`,R`\(\{(-2,4),(0,4),(5,9)\}\)`,R`\(\{(0,1),(0,8),(2,3)\}\)`,R`\(x=y^2\)`][1],'The second relation is a function because each input has one output; repeated output 4 is permitted.',2,'No GDC required',{mode:'choice',value:1},[R`\(\{(1,2),(1,5),(3,7)\}\)`,R`\(\{(-2,4),(0,4),(5,9)\}\)`,R`\(\{(0,1),(0,8),(2,3)\}\)`,R`\(x=y^2\)`],1),
    Q('IBAI-2.1-V4-Q02','Calculate',R`For \(f(x)=x^2-3x-4\), calculate \(f(-2)\).`,R`\(6\)`,R`\(f(-2)=(-2)^2-3(-2)-4=4+6-4=6\).`,2,'No GDC required',{mode:'number',value:6,tolerance:1e-9}),
    Q('IBAI-2.1-V4-Q03','Find',R`For \(g(x)=5x+1\), find the preimage of 36.`,R`\(7\)`,R`Solve \(5x+1=36\), giving \(x=7\).`,2,'No GDC required',{mode:'number',value:7,tolerance:1e-9}),
    Q('IBAI-2.1-V4-Q04','Determine',R`Determine the domain of \(h(x)=\dfrac4{x^2-16}\).`,R`\(\mathbb R\setminus\{-4,4\}\)`,R`The denominator is zero at \(x=-4\) and \(x=4\).`,3,'No GDC required',{mode:'text',accepted:['R\{-4,4}','x!=-4,4','(-∞,-4)∪(-4,4)∪(4,∞)']}),
    Q('IBAI-2.1-V4-Q05','Determine',R`Determine the domain of \(p(x)=\sqrt{10-2x}\).`,R`\(x\le5\)`,R`Require \(10-2x\ge0\), so \(x\le5\).`,2,'No GDC required',{mode:'text',accepted:['x<=5','x ≤ 5','(-∞,5]']}),
    Q('IBAI-2.1-V4-Q06','Determine',R`For \(f(x)=4-2x\) on \(-1\le x\lt3\), determine the range.`,R`\((-2,6]\)`,R`The function decreases. The output 6 is attained at \(x=-1\); the output approaches −2 as \(x\to3^-\) but does not attain it.`,3,'No GDC required',{mode:'text',accepted:['(-2,6]','-2<y<=6']}),
    Q('IBAI-2.1-V4-Q07','Write down',R`Write \(3\lt x\le8\) in interval notation.`,R`\((3,8]\)`,R`The round bracket excludes 3 and the square bracket includes 8.`,1,'No GDC required',{mode:'text',accepted:['(3,8]','(3, 8]']}),
    Q('IBAI-2.1-V4-Q08','Distinguish','A graph is below the x-axis and rises from left to right. Describe its sign and direction of change.','The function is negative and increasing.','Below the x-axis means negative; rising as x increases means increasing.',2,'No GDC required',{mode:'text',accepted:['negative and increasing','negative, increasing']}),
    Q('IBAI-2.1-V4-Q09','State',R`A graph has a global maximum at \((2,9)\). State the maximum output and the input where it occurs.`,R`Maximum output \(9\) at \(x=2\).`,R`The first coordinate is the input and the second coordinate is the output.`,2,'No GDC required',{mode:'text',accepted:['9 at x=2','maximum 9, x=2']}),
    Q('IBAI-2.1-V4-Q10','Find',R`Find the intersections of \(y=x^2-1\) and \(y=2x+2\).`,R`\((-1,0)\) and \((3,8)\)`,R`Solve \(x^2-1=2x+2\): \(x^2-2x-3=0\), so \(x=-1\) or 3.`,4,'GDC permitted',{mode:'text',accepted:['(-1,0) and (3,8)','x=-1,3']}),
    Q('IBAI-2.1-V4-Q11','State','A motion model is valid from 0 to 18 seconds. State the contextual domain.','\(0\le t\le18\)','The experiment begins at 0 s and ends at 18 s.',1,'No GDC required',{mode:'text',accepted:['[0,18]','0<=t<=18','0 ≤ t ≤ 18']}),
    Q('IBAI-2.1-V4-Q12','State','A class may contain from 12 to 28 students. State an appropriate domain for the number \(n\).',R`\(n\in\{12,13,\ldots,28\}\)`,R`Student numbers are discrete whole-number counts.`,2,'No GDC required',{mode:'text',accepted:['integers 12 to 28','{12,13,...,28}','12<=n<=28 integers']}),
    Q('IBAI-2.1-V4-Q13','Write down',R`The point \((4,-3)\) lies on \(f\). State the corresponding point on the inverse relation.`,R`\((-3,4)\)`,R`Swap the coordinates.`,1,'No GDC required',{mode:'text',accepted:['(-3,4)','-3,4']}),
    Q('IBAI-2.1-V4-Q14','Explain','Explain what the horizontal-line test determines.','It determines whether a function is one-to-one, so that its inverse relation is also a function.','A horizontal line meeting the graph more than once identifies an output with several preimages.',3),
    Q('IBAI-2.1-V4-Q15','State','State the TI-84 command most directly used to locate an x-intercept.','Zero','The Zero command finds an input where the displayed function equals zero.',1,'GDC expected',{mode:'text',accepted:['zero','2nd trace zero']}),
    Q('IBAI-2.1-V4-Q16','Evaluate','A calculator gives a solution \(x=42\), but the contextual domain is \(0\le x\le30\). Evaluate the result.','The solution must be rejected because it lies outside the contextual domain.','A numerical solution is not valid for the model unless it satisfies the stated input restrictions.',3,'GDC expected',{mode:'text',accepted:['reject','outside domain','not valid']})
  ];

  const tasks=[];
  tasks.push({
    id:'U2-2.1-V4-T1',style:'Paper 1 · relations and notation',title:'Input–output records',calculator:'No GDC required',total_marks:12,
    context:'A sensor records the ordered pairs \\((-2,5),(0,1),(3,5),(6,11)\\).',
    parts:[
      {label:'a',prompt:'State the domain and range of the relation.',marks:2,answer:'Domain \\(\{-2,0,3,6\}\\); range \\(\{1,5,11\}\\).',markscheme:'A1 domain; A1 range.'},
      {label:'b',prompt:'Explain why the relation is a function.',marks:2,answer:'Each permitted input is paired with exactly one output. The repeated output 5 is allowed.',markscheme:'R1 one-output condition; R1 addresses repeated output.'},
      {label:'c',prompt:'Write the statement corresponding to the ordered pair \\((3,5)\\) using function notation.',marks:1,answer:'\\(f(3)=5\\).',markscheme:'A1.'},
      {label:'d',prompt:'State all preimages of 5.',marks:2,answer:'\\(-2\\) and \\(3\\).',markscheme:'A1 each preimage.'},
      {label:'e',prompt:'The output represents temperature in °C and the input represents time in minutes. Interpret \\(f(6)=11\\).',marks:2,answer:'At 6 minutes, the sensor records a temperature of 11 °C.',markscheme:'A1 variables; A1 units and meaning.'},
      {label:'f',prompt:'The additional pair \\((0,8)\\) is added. Determine whether the new relation is a function, giving a reason.',marks:3,answer:'It is not a function because the input 0 is paired with the two outputs 1 and 8.',markscheme:'A1 decision; R2 precise reason.'}
    ]
  });

  tasks.push({
    id:'U2-2.1-V4-T2',style:'Paper 1 · contextual domain and range',title:'Airport parking tariff',calculator:'No GDC required',total_marks:13,
    context:'An airport car park charges QAR 10 for \\(0\lt t\le1\\), QAR 18 for \\(1\lt t\le2\\), QAR 24 for \\(2\lt t\le3\\), and QAR 32 for \\(3\lt t\le6\\), where \\(t\\) is the parking time in hours.',
    parts:[
      {label:'a',prompt:'Calculate \\(C(2.4)\\).',marks:2,answer:'\\(C(2.4)=24\\) QAR.',markscheme:'M1 select correct interval; A1 charge.'},
      {label:'b',prompt:'State the domain and range of the tariff.',marks:3,answer:'Domain \\((0,6]\\); range \\(\{10,18,24,32\}\\) QAR.',markscheme:'A1 lower bound; A1 upper bound; A1 discrete range.'},
      {label:'c',prompt:'Explain why the interval endpoints make the tariff a function.',marks:3,answer:'Each permitted parking time belongs to exactly one interval, so each input receives exactly one charge.',markscheme:'R1 no gap/overlap; R1 one interval; R1 one charge.'},
      {label:'d',prompt:'State the value of \\(C(3)\\) and explain why it is not QAR 32.',marks:2,answer:'\\(C(3)=24\\) because 3 is included in \\(2\lt t\le3\\) and excluded from \\(3\lt t\le6\\).',markscheme:'A1 value; R1 endpoint ownership.'},
      {label:'e',prompt:'State one limitation of this tariff as a model of total parking cost.',marks:3,answer:'For example, it does not include stays longer than 6 hours, lost-ticket fees, discounts or additional service charges.',markscheme:'R2 relevant limitation; R1 linked to model use.'}
    ]
  });

  tasks.push({
    id:'U2-2.1-V4-T3',style:'Paper 2 · graph features',title:'Water-level model',calculator:'GDC expected',total_marks:14,
    context:'The water level in a storage tank is modelled by \\(H(t)=-0.5(t-4)^2+10\\) for \\(0\le t\le8\\), where \\(t\\) is hours and \\(H(t)\\) is metres.',
    parts:[
      {label:'a',prompt:'Calculate \\(H(0)\\) and \\(H(8)\\).',marks:2,answer:'\\(H(0)=2\\) and \\(H(8)=2\\).',markscheme:'A1 each value.'},
      {label:'b',prompt:'State the maximum water level and the time at which it occurs.',marks:2,answer:'Maximum 10 m at \\(t=4\\) h.',markscheme:'A1 maximum; A1 time.'},
      {label:'c',prompt:'State the domain and range of the model.',marks:2,answer:'Domain \\([0,8]\\); range \\([2,10]\\) m.',markscheme:'A1 domain; A1 range.'},
      {label:'d',prompt:'Use technology to find the two times when \\(H(t)=8\\).',marks:3,answer:'\\(t=2\\) h and \\(t=6\\) h.',markscheme:'M1 intersect/solve; A1 each time.'},
      {label:'e',prompt:'State the intervals on which the water level is increasing and decreasing.',marks:2,answer:'Increasing on \\([0,4]\\); decreasing on \\([4,8]\\).',markscheme:'A1 each interval.'},
      {label:'f',prompt:'Interpret the two solutions in part (d).',marks:3,answer:'The tank level reaches 8 m after 2 hours while filling and again after 6 hours while the level is falling.',markscheme:'R1 first time; R1 second time; R1 contextual distinction.'}
    ]
  });

  tasks.push({
    id:'U2-2.1-V4-T4',style:'Paper 2 · technology and evaluation',title:'Solar-output function',calculator:'GDC expected',total_marks:12,
    context:'The electrical output of a school solar array is modelled by \\(P(t)=-0.5(t-6)^2+24\\) for \\(0\le t\le12\\), where \\(t\\) is hours after 6:00 and \\(P(t)\\) is measured in kilowatts.',
    parts:[
      {label:'a',prompt:'Calculate \\(P(2)\\) and interpret the result.',marks:3,answer:'\\(P(2)=16\\) kW. At 08:00, the model predicts an output of 16 kW.',markscheme:'M1 substitution; A1 value; A1 interpretation.'},
      {label:'b',prompt:'State the contextual domain and range.',marks:2,answer:'Domain \\(0\le t\le12\\); range \\(6\le P\le24\\) kW.',markscheme:'A1 domain; A1 range.'},
      {label:'c',prompt:'Use technology to find the two clock times at which \\(P(t)=20\\), giving each time to the nearest minute.',marks:4,answer:'\\(t=6\pm\sqrt8\\), so the clock times are approximately 09:10 and 14:50.',markscheme:'M1 equation/intersection; A1 two t-values; A1 each clock-time conversion.'},
      {label:'d',prompt:'State one limitation of the model.',marks:3,answer:'For example, cloud cover, shading, panel temperature and changing weather are not represented.',markscheme:'R2 relevant limitation; R1 linked to predicted output.'}
    ]
  });

  tasks.push({
    id:'U2-2.1-V4-T5',style:'Paper 1 · inverse relation',title:'Temperature conversion',calculator:'No GDC required',total_marks:11,
    context:'A function \\(F\\) converts a temperature \\(c\\) in degrees Celsius to degrees Fahrenheit using \\(F(c)=1.8c+32\\).',
    parts:[
      {label:'a',prompt:'Calculate \\(F(20)\\) and interpret the result.',marks:2,answer:'\\(F(20)=68\\). A temperature of 20 °C corresponds to 68 °F.',markscheme:'A1 value; A1 interpretation.'},
      {label:'b',prompt:'State the point on the graph of the inverse relation corresponding to \\((20,68)\\).',marks:1,answer:'\\((68,20)\\).',markscheme:'A1.'},
      {label:'c',prompt:'Determine the domain and range of \\(F\\) if the model is restricted to \\(-20\le c\le50\\).',marks:3,answer:'Domain \\([-20,50]\\); range \\([-4,122]\\).',markscheme:'A1 domain; M1 endpoint outputs; A1 range.'},
      {label:'d',prompt:'State the domain and range of the inverse relation on the same restriction.',marks:2,answer:'Domain \\([-4,122]\\); range \\([-20,50]\\).',markscheme:'A1 each set.'},
      {label:'e',prompt:'Explain why the inverse relation is also a function.',marks:3,answer:'The original linear function is one-to-one: every Fahrenheit output has one Celsius preimage, so each inverse input has one output.',markscheme:'R1 one-to-one; R1 one preimage; R1 inverse conclusion.'}
    ]
  });

  tasks.push({
    id:'U2-2.1-V4-T6',style:'Paper 2 · mixed modelling',title:'Community transport model',calculator:'GDC expected',total_marks:14,
    context:'A community transport service models journey time by \\(T(d)=0.04d^2+0.8d+6\\) for \\(0\le d\le30\\), where \\(d\\) is distance in kilometres and \\(T(d)\\) is time in minutes.',
    parts:[
      {label:'a',prompt:'Calculate and interpret \\(T(12)\\).',marks:3,answer:'\\(T(12)=21.36\\) min. A 12 km journey is predicted to take about 21.4 minutes.',markscheme:'M1 substitution; A1 value; A1 interpretation.'},
      {label:'b',prompt:'State the contextual domain and determine the range.',marks:3,answer:'Domain \\([0,30]\\); range \\([6,66]\\) minutes.',markscheme:'A1 domain; M1 endpoint evaluation/increasing behaviour; A1 range.'},
      {label:'c',prompt:'Use technology to determine the distance for which the predicted time is 30 minutes.',marks:3,answer:'Solve \\(0.04d^2+0.8d+6=30\\). The valid solution is \\(d\approx16.458\\) km.',markscheme:'M1 equation/intersection; A1 numerical roots; A1 select valid root.'},
      {label:'d',prompt:'Explain why the second algebraic solution must be rejected.',marks:2,answer:'The second solution is negative, so it lies outside the contextual distance domain \\(0\le d\le30\\).',markscheme:'R1 identifies negative/outside domain; R1 contextual reason.'},
      {label:'e',prompt:'State one reason why the model may be unreliable for a particular journey.',marks:3,answer:'For example, traffic, waiting time, road type, stops and weather can vary and are not represented by distance alone.',markscheme:'R2 relevant omitted factor; R1 linked to reliability.'}
    ]
  });

  d.exam=tasks;
  d.counts={...(d.counts||{}),quiz:d.quiz.length,exam:d.exam.length};
  d.audit={...(d.audit||{}),quizCount:d.quiz.length,taskCount:d.exam.length,totalTaskMarks:d.exam.reduce((sum,task)=>sum+task.total_marks,0)};
})();
