(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||!data.lesson)return;
const H=String.raw;
const release={
  schemaVersion:'1.4.0',version:'6.0.0',buildDate:'2026-08-05',
  course:'IB Mathematics: Applications and Interpretation SL',
  unit:{number:1,title:'Number and Algebra'},
  lesson:{
    number:'1.6',slug:'technology-equations',title:'Technology for Equations and Systems',
    subtitle:'Use technology transparently to solve polynomial equations and linear systems, fit model parameters, verify every output and interpret contextual constraints.',
    syllabus_code:'SL 1.8',
    syllabus_focus:'Use of technology to solve systems of linear equations in up to three variables and polynomial equations.',
    skill_keys:['IBAI.U1.ALGEBRA','IBAI.U1.MATRICES','IBAI.U1.MODELING'],
    objectives:[
      'Use polynomial-root, graph-intersection and numerical-solver technology to find all relevant real solutions.',
      'Solve and classify two-variable linear systems using graphical and simultaneous-equation methods.',
      'Solve three-variable systems while preserving variable order and zero coefficients.',
      'Determine model parameters from independent data conditions.',
      'Verify roots, intersections and system solutions using substitution, factorization, residuals or a second representation.',
      'Interpret domain, units, precision, integrality, non-negativity and model limitations.'
    ],
    vocab:['root','x-intercept','intersection','polynomial degree','coefficient order','multiplicity','simultaneous equations','unique solution','inconsistent system','dependent system','residual','parameter','domain','admissible solution'],
    technology:'Record the equation or coefficient table, the selected tool, degree, variable order, graphing window or initial guess, complete output, independent verification and contextual conclusion.',
    source_basis:[
      'Current IB Mathematics: Applications and Interpretation SL 1.8 — technology for systems and polynomial equations',
      'Christos Nikolaidis MAI 1.2–1.3 — systems of linear equations and parameter fitting',
      'Topic 1A Basic Algebra — GDC simultaneous-equation workflows and contextual systems',
      'Pearson Mathematics: Applications and Interpretation SL — algebra, equations, functions and technology-supported modelling',
      'Existing ECHS Unit 1 platform architecture and authenticated mastery integration'
    ],
    transition:'This final Unit 1 lesson consolidates transparent technology use before later units apply the same evidence chain to functions, geometry, statistics and calculus.'
  }
};
Object.assign(data,{schemaVersion:release.schemaVersion,version:release.version,buildDate:release.buildDate,course:release.course,unit:release.unit});
Object.assign(data.lesson,release.lesson);
data.slides=[];data.practice=[];data.quiz=[];data.exam=[];
const S=(section,title,html,kind='content',eyebrow='')=>data.slides.push({section,title,html,kind,eyebrow});
const worked=(problem,steps,result,check='')=>H`<div class="te-worked"><div class="te-worked-head"><span>WORKED EXAMPLE</span><b>${problem}</b></div><div class="te-step-grid">${steps.map((step,index)=>H`<div><b>${index+1}</b><p>${step}</p></div>`).join('')}</div><div class="te-result"><b>Conclusion</b><span>${result}</span></div>${check?H`<div class="te-check"><b>Independent check:</b> ${check}</div>`:''}</div>`;
const turn=(prompt,note,answer,hint='')=>H`<div class="te-student"><div class="te-student-head"><b>STUDENT TURN</b><span>Commit before revealing</span></div><p>${prompt}</p>${hint?H`<div class="te-note"><b>Planning cue:</b> ${hint}</div>`:''}<textarea class="student-note" data-note="${note}" aria-label="Student response"></textarea><details class="solution-reveal"><summary>Reveal answer and reasoning</summary><div class="te-answer">${answer}</div></details></div>`;
const solution=(title,body,decision)=>H`<div class="te-solution"><h3>${title}</h3><div>${body}</div><div class="te-decision"><b>Decision that matters:</b> ${decision}</div></div>`;
const misconception=(claim,repair,evidence)=>H`<div class="te-misconception"><div class="te-wrong"><span>NOT YET</span><b>${claim}</b></div><div class="te-repair"><h3>Repair the reasoning</h3><p>${repair}</p><div class="te-check"><b>Evidence:</b> ${evidence}</div></div></div>`;
const block=(code,title,focus,questions)=>H`<div class="te-block-cover"><div><span>${code}</span><h2>${title}</h2><p>${focus}</p><div class="te-block-questions">${questions.map((q,index)=>H`<div><b>${index+1}</b><span>${q}</span></div>`).join('')}</div></div><div class="te-block-badge"><b>60–75</b><span>minutes</span></div></div>`;
const checkpoint=(code,items,note)=>H`<div class="te-checkpoint"><div class="te-label">${code} CHECKPOINT</div><div class="te-question-grid">${items.map((item,index)=>H`<div><b>${String.fromCharCode(65+index)}</b><span>${item}</span></div>`).join('')}</div><textarea class="student-note" data-note="${note}" aria-label="Checkpoint response"></textarea></div>`;
data.__te6={H,S,worked,turn,solution,misconception,block,checkpoint};
data.teachingBlocks=[
  {code:'1.6A',title:'Two-Variable Systems and Classification',estimatedClassroomTime:'60–75 minutes'},
  {code:'1.6B',title:'Three Variables, Parameter Fitting and Feasibility',estimatedClassroomTime:'60–75 minutes'},
  {code:'1.6C',title:'Polynomial Roots, Intersections and Numerical Solving',estimatedClassroomTime:'60–75 minutes'},
  {code:'1.6D',title:'Verification, Constraints, Modelling and Mastery',estimatedClassroomTime:'60–75 minutes'}
];
data.v6Audit={lesson:'1.6',release:'6.0.0',expectedSlides:73,expectedPractice:96,expectedQuiz:14,expectedTasks:5,sourceIntegration:true,technologyProtocol:true};
})();
