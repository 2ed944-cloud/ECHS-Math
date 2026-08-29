/* AP Lesson 0 — concise first-class route for AP Precalculus and AP Calculus */
(function(){
  'use strict';

  const precalculus=window.ECHS_L0_DATA;
  const calculus=window.ECHS_CALC_L0_DATA;
  const data=precalculus||calculus;
  if(!data||!Array.isArray(data.slides))return;

  const isCalculus=Boolean(calculus);
  const original=data.slides.slice();
  const byId=new Map(original.map(slide=>[slide&&slide.id,slide]));
  const get=id=>byId.get(id);
  const update=(id,patch)=>{
    const slide=get(id);
    if(slide)Object.assign(slide,patch);
  };
  const escapeText=value=>String(value||'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  function teacherWelcome(course,mark,idea,description){
    return `<div class="teacher-welcome">
      <div class="teacher-welcome-copy">
        <p class="cinema-kicker">${escapeText(course)} · First class</p>
        <h1>Welcome to <em>${escapeText(course)}</em>.</h1>
        <p class="lead">${escapeText(description)}</p>
        <div class="teacher-profile">
          <span>Your Math Teacher</span>
          <strong>Mohammad Abu Ghuwaleh</strong>
          <p>My role is to make the mathematics clear, help you explain your reasoning, and turn every mistake into a useful next step.</p>
        </div>
        <div class="cinema-tags"><span>Meet</span><span>Course</span><span>Assessment</span><span>Study</span><span>Rules</span><span>Diagnostic</span></div>
      </div>
      <div class="welcome-course-mark" aria-label="${escapeText(idea)}">
        <strong>${mark}</strong>
        <span>${escapeText(idea)}</span>
        <small>Think clearly · show evidence · keep improving</small>
      </div>
    </div>`;
  }

  const studyCycle=`<div class="study-cycle">
    <div><b>Learn</b><span>Understand the idea.</span></div>
    <div><b>Try</b><span>Work before revealing.</span></div>
    <div><b>Check</b><span>Compare reasoning.</span></div>
    <div><b>Correct</b><span>Repair the exact error.</span></div>
    <div><b>Retrieve</b><span>Return without notes.</span></div>
    <div><b>Mix</b><span>Combine old and new skills.</span></div>
  </div>`;

  const lessonRoutine=`<aside>
    <h3>For every lesson</h3>
    <div><b>1</b><span>Open the assigned lesson and complete the student turns.</span></div>
    <div><b>2</b><span>Practise the linked skills while the idea is still fresh.</span></div>
    <div><b>3</b><span>Record the cause of one important mistake.</span></div>
    <div><b>4</b><span>Redo the skill later without looking at the solution.</span></div>
  </aside>`;

  const rules=`<div class="compact-rules">
    <article><b>1</b><h3>Arrive ready</h3><p>Bring your device, notebook, and calculator when requested.</p></article>
    <article><b>2</b><h3>Attempt first</h3><p>Write what you know and make a genuine first move.</p></article>
    <article><b>3</b><h3>Show the mathematics</h3><p>Use setup, notation, reasoning, units, and interpretation.</p></article>
    <article><b>4</b><h3>Respect calculator conditions</h3><p>Use technology only when it is allowed and useful.</p></article>
    <article><b>5</b><h3>Ask precise questions</h3><p>Name what you tried and exactly where you became stuck.</p></article>
    <article><b>6</b><h3>Discuss ideas respectfully</h3><p>Challenge reasoning with evidence, never the person.</p></article>
    <article><b>7</b><h3>Protect academic integrity</h3><p>Submit only work and explanations you can defend.</p></article>
    <article><b>8</b><h3>Correct errors visibly</h3><p>Use feedback quickly and revisit the skill later.</p></article>
  </div><button class="ack-button" id="normAck">I understand and can follow these agreements</button><p id="normAckStatus" class="status-line"></p>`;

  if(isCalculus){
    update('welcome',{
      stage:'Welcome',
      title:'Welcome to AP Calculus',
      subtitle:'Meet your teacher, meet the class, and see the route ahead.',
      body:teacherWelcome(
        'AP Calculus AB / BC',
        '∫',
        'Change, accumulation, and justification',
        'We will study how quantities change, how change accumulates, and how mathematical evidence supports a conclusion.'
      )
    });

    update('track-choice',{
      title:'Choose your calculus track',
      subtitle:'The foundation is shared; BC adds two advanced units.'
    });

    update('calculus-question',{
      title:'First question · What could speed at one instant mean?',
      subtitle:'Use your current thinking; formal calculus language is not required yet.'
    });

    update('identity-card',{
      title:'Tell me how you learn mathematics',
      subtitle:'Complete your Calculus Passport before the class activity.'
    });

    update('bingo',{
      title:'Connection Quest · Meet three classmates',
      subtitle:'Complete one row, column, or diagonal using three different names.'
    });

    update('course-map',{
      stage:'Course',
      title:'Course units and weighting',
      subtitle:'AB contains eight assessed units. BC contains the full AB course plus Units 9 and 10.',
      body:`<div class="compact-unit-columns">
        <section class="compact-unit-panel">
          <header><h3>AP Calculus AB</h3><span>8 units</span></header>
          <div class="compact-unit-list">
            <div class="compact-unit-row"><b>U1</b><span>Limits and Continuity</span><small>10–15%</small></div>
            <div class="compact-unit-row"><b>U2</b><span>Differentiation: Definition and Fundamental Properties</span><small>10–15%</small></div>
            <div class="compact-unit-row"><b>U3</b><span>Composite, Implicit, and Inverse Differentiation</span><small>5–10%</small></div>
            <div class="compact-unit-row"><b>U4</b><span>Contextual Applications of Differentiation</span><small>10–15%</small></div>
            <div class="compact-unit-row"><b>U5</b><span>Analytical Applications of Differentiation</span><small>15–20%</small></div>
            <div class="compact-unit-row"><b>U6</b><span>Integration and Accumulation of Change</span><small>15–20%</small></div>
            <div class="compact-unit-row"><b>U7</b><span>Differential Equations</span><small>5–10%</small></div>
            <div class="compact-unit-row"><b>U8</b><span>Applications of Integration</span><small>10–15%</small></div>
          </div>
        </section>
        <section class="compact-unit-panel">
          <header><h3>AP Calculus BC</h3><span>10 units</span></header>
          <div class="compact-unit-list">
            <div class="compact-unit-row"><b>U1</b><span>Limits and Continuity</span><small>5–10%</small></div>
            <div class="compact-unit-row"><b>U2</b><span>Differentiation: Definition and Fundamental Properties</span><small>5–10%</small></div>
            <div class="compact-unit-row"><b>U3</b><span>Composite, Implicit, and Inverse Differentiation</span><small>5–10%</small></div>
            <div class="compact-unit-row"><b>U4</b><span>Contextual Applications of Differentiation</span><small>5–10%</small></div>
            <div class="compact-unit-row"><b>U5</b><span>Analytical Applications of Differentiation</span><small>10–15%</small></div>
            <div class="compact-unit-row"><b>U6</b><span>Integration and Accumulation of Change</span><small>15–20%</small></div>
            <div class="compact-unit-row"><b>U7</b><span>Differential Equations</span><small>5–10%</small></div>
            <div class="compact-unit-row"><b>U8</b><span>Applications of Integration</span><small>5–10%</small></div>
            <div class="compact-unit-row extension"><b>U9</b><span>Parametric, Polar, and Vector-Valued Functions</span><small>10–15%</small></div>
            <div class="compact-unit-row extension"><b>U10</b><span>Infinite Sequences and Series</span><small>15–20%</small></div>
          </div>
        </section>
      </div><p class="microcopy">The ranges refer to the multiple-choice section; they are not fixed percentages that must add to 100.</p>`
    });

    update('exam-overview',{
      title:'How the AP Calculus exam is scored',
      subtitle:'The multiple-choice and free-response sections each contribute half of the score.'
    });

    update('practices',{
      title:'What the exam rewards',
      subtitle:'Procedures matter, but so do representations, justification, and communication.'
    });

    update('study-system',{
      title:'How to study AP Calculus',
      subtitle:'Short, active, repeated practice is stronger than passive rereading.',
      body:`<div class="study-compact">${studyCycle}${lessonRoutine}</div>`
    });

    update('rules-1',{
      stage:'Class Norms',
      title:'Our classroom agreements',
      subtitle:'Eight routines that protect learning time and mathematical thinking.',
      body:rules
    });

    update('diagnostic-purpose',{
      stage:'Diagnostic',
      title:'Diagnostic readiness check',
      subtitle:'This is a support-planning snapshot, not a course grade.',
      body:`<div class="compact-diagnostic-intro">
        <div>
          <div class="diagnostic-facts">
            <article><strong>36</strong><span>common prerequisite questions</span></article>
            <article><strong>6</strong><span>readiness strands</span></article>
            <article><strong>No calculator</strong><span>use scratch paper</span></article>
            <article><strong>40–45 min</strong><span>work honestly and independently</span></article>
          </div>
          <aside class="callout"><strong>BC students:</strong> a separate six-item extension follows. It does not lower the common readiness score.</aside>
        </div>
        <div>
          <h3>What it measures</h3>
          <div class="diagnostic-strands-compact">
            <span>A · Algebra & Equations</span><span>B · Functions & Graphs</span>
            <span>C · Polynomial & Rational</span><span>D · Exponential & Logarithmic</span>
            <span>E · Trigonometry</span><span>F · Rates, Geometry & Modeling</span>
          </div>
          <ul class="instructions"><li>Answer independently.</li><li>Do not search or use AI.</li><li>Choose your best answer if unsure.</li><li>Your result creates a repair plan.</li></ul>
          <button class="route-button" data-go="diag-A">Begin the diagnostic</button>
        </div>
      </div>`
    });

    const prefix=['welcome','track-choice','calculus-question','identity-card','bingo','course-map','exam-overview','practices','study-system','rules-1','diagnostic-purpose'];
    const tailIndex=original.findIndex(slide=>slide&&slide.id==='diag-A');
    const tail=tailIndex>=0?original.slice(tailIndex):[];
    data.slides=[...prefix.map(get).filter(Boolean),...tail];
  }else{
    update('welcome',{
      stage:'Welcome',
      title:'Welcome to AP Precalculus',
      subtitle:'Meet your teacher, meet the class, and see the route ahead.',
      body:teacherWelcome(
        'AP Precalculus',
        'f',
        'Functions tell the story',
        'We will connect graphs, tables, equations, and real contexts to understand how functions behave and how models support decisions.'
      )
    });

    update('identity-card',{
      title:'Tell me how you learn mathematics',
      subtitle:'Complete your Math Passport before the class activity.'
    });

    update('icebreaker-choice',{
      title:'Choose Your Lens',
      subtitle:'Which representation gives you the first useful clue?'
    });

    update('bingo',{
      title:'Connection Quest · Meet three classmates',
      subtitle:'Complete one row, column, or diagonal using three different names.'
    });

    update('course-map',{
      title:'The four-unit course map',
      subtitle:'Units 1–3 are assessed on the AP Exam. Unit 4 extends the course but is not assessed.'
    });

    update('exam-overview',{
      title:'How the AP Precalculus exam is structured',
      subtitle:'Know the sections, timing, calculator conditions, and score contribution.'
    });

    update('exam-skills',{
      title:'What the exam rewards',
      subtitle:'A correct result matters together with representation, precision, interpretation, and reasoning.'
    });

    update('study-system',{
      title:'How to study AP Precalculus',
      subtitle:'Short, active, repeated practice is stronger than passive rereading.',
      body:`<div class="study-compact">${studyCycle}${lessonRoutine}</div>`
    });

    update('rules-1',{
      stage:'Class Norms',
      title:'Our classroom agreements',
      subtitle:'Eight routines that protect learning time and mathematical thinking.',
      body:rules
    });

    update('diagnostic-start',{
      stage:'Diagnostic',
      title:'Diagnostic readiness check',
      subtitle:'This is a support-planning snapshot, not a course grade.',
      body:`<div class="compact-diagnostic-intro">
        <div>
          <div class="diagnostic-facts">
            <article><strong>36</strong><span>prerequisite questions</span></article>
            <article><strong>6</strong><span>readiness strands</span></article>
            <article><strong>No calculator</strong><span>use scratch paper</span></article>
            <article><strong>About 30 min</strong><span>work honestly and independently</span></article>
          </div>
          <aside class="callout"><strong>Purpose:</strong> identify the exact skills to strengthen while we begin Unit 1.</aside>
        </div>
        <div>
          <h3>What it measures</h3>
          <div class="diagnostic-strands-compact">
            <span>A · Algebra & Equations</span><span>B · Functions & Representations</span>
            <span>C · Linear, Quadratic & Polynomial</span><span>D · Rational, Exponential & Logarithmic</span>
            <span>E · Trigonometry & Geometry</span><span>F · Modeling, Units & Reasoning</span>
          </div>
          <ul class="instructions"><li>Answer independently.</li><li>Do not search or use AI.</li><li>Choose your best answer if unsure.</li><li>Your result creates a repair plan.</li></ul>
          <button class="route-button" data-go="diagnostic-01">Begin the diagnostic</button>
        </div>
      </div>`
    });

    const prefix=['welcome','identity-card','icebreaker-choice','bingo','course-map','exam-overview','exam-skills','study-system','rules-1','diagnostic-start'];
    const tailIndex=original.findIndex(slide=>slide&&slide.id==='diagnostic-01');
    const tail=tailIndex>=0?original.slice(tailIndex):[];
    data.slides=[...prefix.map(get).filter(Boolean),...tail];
  }

  data.meta=Object.assign({},data.meta,{
    slides:data.slides.length,
    version:'compact-first-class-5.1.0-2026-08-29',
    design:'Student classroom presentation'
  });

  /* The slide count changed substantially. Start the new route at slide one
     once, while preserving diagnostic answers and all other saved evidence. */
  const storage=isCalculus?'echs-ap-calculus-lesson-0':'echs-ap-precalculus-lesson-0';
  const migration=`${storage}:compact-route-5.1.0`;
  if(localStorage.getItem(migration)!=='1'){
    localStorage.removeItem(`${storage}:slide`);
    localStorage.setItem(migration,'1');
  }
})();
