/* IB Math AI Lesson 0 — concise, student-facing first-class route */
(function(){
  'use strict';

  const data=window.ECHS_IBAI_L0_DATA;
  if(!data||!Array.isArray(data.slides))return;

  const original=data.slides.slice();
  const byId=new Map(original.map(slide=>[slide&&slide.id,slide]));
  const get=id=>byId.get(id);
  const update=(id,patch)=>{
    const slide=get(id);
    if(slide)Object.assign(slide,patch);
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  function teacherWelcome(){
    return `<div class="teacher-welcome ibai-teacher-welcome">
      <div class="teacher-welcome-copy">
        <p class="cinema-kicker">IB Mathematics: Applications and Interpretation · First class</p>
        <h1>Use mathematics to <em>understand the world</em>.</h1>
        <p class="lead">We will use data, models, technology, and mathematical reasoning to make decisions that can be explained and defended.</p>
        <div class="teacher-profile">
          <span>Your Math Teacher</span>
          <strong>Mohammad Abu Ghuwaleh</strong>
          <p>My role is to make the mathematics clear, help you connect it to real situations, and turn every mistake into a useful next step.</p>
        </div>
        <div class="cinema-tags" aria-label="Today's route">
          <span>Meet</span><span>Decide</span><span>Course</span><span>Assessment</span><span>Study</span><span>Diagnostic</span>
        </div>
      </div>
      <div class="welcome-course-mark" aria-label="IB Math AI: data, models, and decisions">
        <strong>AI</strong>
        <span>Data · Models · Decisions</span>
        <small>Use evidence · interpret context · communicate clearly</small>
      </div>
    </div>`;
  }

  function connectionQuest(){
    const items=[
      ['Enjoys working with real data','Ask: “What kind of data interests you?”'],
      ['Has used a graphing calculator','Ask: “Which tool or feature have you used?”'],
      ['Usually starts with a graph','Ask: “What can a graph reveal quickly?”'],
      ['Likes real-world mathematics','Ask: “Which context would you like to investigate?”'],
      ['Can explain correlation','Ask: “What does correlation not prove?”'],
      ['Has collected data for a project','Ask: “What did you measure?”'],
      ['Checks units carefully','Ask: “Why can units change a conclusion?”'],
      ['Likes explaining ideas to others','Ask: “How do you check that an explanation is clear?”'],
      ['Shares one non-math interest with you','Ask: “What is the shared interest?”']
    ];
    return `<div class="connection-quest ibai-connection-quest">
      <div class="quest-instructions">
        <div><b>1</b><span><strong>Find</strong> a classmate who matches one prompt.</span></div>
        <div><b>2</b><span><strong>Ask</strong> the follow-up question and listen.</span></div>
        <div><b>3</b><span><strong>Record</strong> the first name, then confirm.</span></div>
      </div>
      <div class="connection-grid">
        ${items.map((item,index)=>`<article class="quest-cell" data-index="${index}">
          <span class="quest-number">${index+1}</span>
          <strong class="quest-prompt">${esc(item[0])}</strong>
          <span class="quest-question">${esc(item[1])}</span>
          <input class="quest-name" type="text" autocomplete="off" placeholder="Classmate's first name" aria-label="Classmate name for connection ${index+1}">
          <button class="quest-confirm" type="button">Confirm connection</button>
        </article>`).join('')}
      </div>
      <div class="quest-footer">
        <strong class="quest-meter">0 of 9 connections confirmed</strong>
        <span class="quest-status" role="status" aria-live="polite">Goal: complete one row, column, or diagonal using three different classmates.</span>
        <button class="quest-reset" type="button">Reset quest</button>
      </div>
    </div>`;
  }

  const studyCycle=`<div class="study-cycle">
    <div><b>Understand</b><span>Identify the question, variables, units, and context.</span></div>
    <div><b>Represent</b><span>Choose a table, graph, formula, diagram, or simulation.</span></div>
    <div><b>Compute</b><span>Use mathematics and technology accurately.</span></div>
    <div><b>Verify</b><span>Check with another representation, estimate, or unit.</span></div>
    <div><b>Interpret</b><span>Answer the original question in context.</span></div>
    <div><b>Retrieve</b><span>Return later without copying the previous solution.</span></div>
  </div>`;

  const lessonRoutine=`<aside>
    <h3>For every lesson</h3>
    <div><b>1</b><span>Open the assigned lesson and complete the student turns.</span></div>
    <div><b>2</b><span>Practise the linked skills while the model or method is still fresh.</span></div>
    <div><b>3</b><span>Record the cause of one important mistake—not only the correct answer.</span></div>
    <div><b>4</b><span>Redo the skill later and explain the result in context.</span></div>
  </aside>`;

  const rules=`<div class="compact-rules">
    <article><b>1</b><h3>Arrive ready</h3><p>Bring your charged device, notebook, and GDC when requested.</p></article>
    <article><b>2</b><h3>Define before computing</h3><p>Name variables, units, domains, and assumptions first.</p></article>
    <article><b>3</b><h3>Show mathematical evidence</h3><p>Include setup, notation, working, precision, and interpretation.</p></article>
    <article><b>4</b><h3>Use technology responsibly</h3><p>A calculator output without mathematical meaning is incomplete.</p></article>
    <article><b>5</b><h3>Attempt, then ask precisely</h3><p>State what you tried and where the reasoning stopped.</p></article>
    <article><b>6</b><h3>Discuss ideas respectfully</h3><p>Challenge claims with evidence, never the person.</p></article>
    <article><b>7</b><h3>Protect academic integrity</h3><p>Submit only reasoning, analysis, and writing you can defend.</p></article>
    <article><b>8</b><h3>Correct errors visibly</h3><p>Use feedback, repair the cause, and retrieve the skill later.</p></article>
  </div>
  <button class="ack-button" id="normAck" type="button">I understand and can follow these agreements</button>
  <p id="normAckStatus" class="status-line" role="status" aria-live="polite"></p>`;

  update('welcome',{
    stage:'Welcome',
    title:'Welcome to IB Math AI',
    subtitle:'Meet your teacher, meet the class, and see the route ahead.',
    body:teacherWelcome()
  });

  update('identity-card',{
    stage:'Icebreaker',
    title:'Your Math AI Passport',
    subtitle:'Choose your level, identify your strengths, and show how you prefer to begin.',
    body:`<div class="ibai-passport-layout">
      <section class="passport-shell">
        <div class="passport-head">
          <div><span>Mathematics identity</span><strong>IB Math AI Passport</strong></div>
          <small>There is no single “best” mathematical starting point.</small>
        </div>
        <div class="passport-grid">
          <label class="passport-field">Name / preferred name
            <input id="identityName" data-save-key="identity-name" autocomplete="name">
          </label>
          <label class="passport-field">Enrolled level
            <select id="identityTrack">
              <option>IB Math AI SL</option>
              <option>IB Math AI HL</option>
            </select>
          </label>
          <label class="passport-field">A mathematical strength
            <input id="identityStrength" data-save-key="identity-strength" placeholder="e.g., data, graphs, technology, persistence">
          </label>
          <label class="passport-field">A skill I want to strengthen
            <input id="identityGoal" data-save-key="identity-goal" placeholder="e.g., algebra, statistics, explanation, GDC fluency">
          </label>
          <label class="passport-field full">One thing that helps me learn mathematics well
            <textarea data-save-key="identity-learning" rows="2" placeholder="A strategy, classroom condition, or type of explanation…"></textarea>
          </label>
        </div>
        <div class="passport-stamp">
          <strong>AI</strong><span>Ready to investigate</span><small>Context · evidence · interpretation</small>
        </div>
      </section>

      <section class="ibai-level-and-lens">
        <div class="ibai-level-picker">
          <header><h3>Select your enrolled level</h3><span>Current: <strong id="trackCurrent">SL</strong></span></header>
          <div class="track-picker">
            <button class="track-btn" type="button" data-track="SL"><strong>SL</strong><span>2 papers + exploration</span></button>
            <button class="track-btn" type="button" data-track="HL"><strong>HL</strong><span>3 papers + exploration</span></button>
          </div>
        </div>
        <div class="ibai-lens-picker">
          <h3>Which evidence do you usually inspect first?</h3>
          <div class="ibai-lens-grid">
            <button class="track-btn rep-btn" type="button" data-rep="Graph"><strong>Graph</strong><span>Shape and pattern</span></button>
            <button class="track-btn rep-btn" type="button" data-rep="Table"><strong>Table</strong><span>Values and variation</span></button>
            <button class="track-btn rep-btn" type="button" data-rep="Formula"><strong>Formula</strong><span>Structure and parameters</span></button>
            <button class="track-btn rep-btn" type="button" data-rep="Context"><strong>Context</strong><span>Meaning and units</span></button>
          </div>
          <p class="microcopy">Your preferred starting point is a strength. IB Math AI asks you to connect all four.</p>
        </div>
      </section>
    </div>`
  });

  update('bingo',{
    stage:'Icebreaker',
    title:'Connection Quest · Meet three classmates',
    subtitle:'Find, ask, record, and confirm—then introduce one useful class resource.',
    body:connectionQuest()
  });

  update('course-map',{
    stage:'Course',
    title:'Five topics connect the course',
    subtitle:'Technology, modelling, inquiry, and communication run through every topic.',
    body:`<div class="ibai-topic-grid">
      <article><b>1</b><h3>Number & Algebra</h3><p>Sequences, finance, approximation, logarithms, and algebraic structure.</p><div><span>SL · 16 h</span><span>HL · 29 h</span></div></article>
      <article><b>2</b><h3>Functions</h3><p>Models, graphs, transformations, equations, and interpretation.</p><div><span>SL · 31 h</span><span>HL · 42 h</span></div></article>
      <article><b>3</b><h3>Geometry & Trigonometry</h3><p>Measurement, coordinates, trigonometric models, and spatial reasoning.</p><div><span>SL · 18 h</span><span>HL · 46 h</span></div></article>
      <article><b>4</b><h3>Statistics & Probability</h3><p>Data, distributions, correlation, inference, probability, and uncertainty.</p><div><span>SL · 36 h</span><span>HL · 52 h</span></div></article>
      <article><b>5</b><h3>Calculus</h3><p>Rates of change, optimization, accumulation, and numerical methods.</p><div><span>SL · 19 h</span><span>HL · 41 h</span></div></article>
    </div>
    <div class="ibai-course-summary">
      <article><strong>SL · 150 hours</strong><span>120 syllabus hours + approximately 30 hours for the exploration.</span></article>
      <article><strong>HL · 240 hours</strong><span>210 syllabus hours + approximately 30 hours for the exploration.</span></article>
      <article><strong>Teaching guides—not exam percentages</strong><span>An examination question can connect several topics.</span></article>
    </div>`
  });

  update('assessment-overview',{
    stage:'Assessment',
    title:'Assessment structure and mark distribution',
    subtitle:'External examinations contribute 80%; the individual mathematical exploration contributes 20%.',
    body:`<div class="ibai-assessment-summary">
      <article><strong>80%</strong><span>External examinations</span><small>Technology is required on every paper.</small></article>
      <article><strong>20%</strong><span>Mathematical exploration</span><small>Individual work, internally assessed and externally moderated.</small></article>
    </div>
    <div class="ibai-assessment-columns">
      <section>
        <header><h3>IB Math AI SL</h3><span>100% total</span></header>
        <div class="ibai-assessment-row"><b>Paper 1</b><span>1 h 30 min · short response</span><strong>40%</strong></div>
        <div class="ibai-assessment-row"><b>Paper 2</b><span>1 h 30 min · extended response</span><strong>40%</strong></div>
        <div class="ibai-assessment-row exploration"><b>Exploration</b><span>Individual mathematical investigation</span><strong>20%</strong></div>
      </section>
      <section>
        <header><h3>IB Math AI HL</h3><span>100% total</span></header>
        <div class="ibai-assessment-row"><b>Paper 1</b><span>2 h · short response</span><strong>30%</strong></div>
        <div class="ibai-assessment-row"><b>Paper 2</b><span>2 h · extended response</span><strong>30%</strong></div>
        <div class="ibai-assessment-row"><b>Paper 3</b><span>1 h · two extended problem-solving questions</span><strong>20%</strong></div>
        <div class="ibai-assessment-row exploration"><b>Exploration</b><span>Individual mathematical investigation</span><strong>20%</strong></div>
      </section>
    </div>
    <aside class="callout"><strong>Important:</strong> IB does not publish fixed topic-by-topic exam percentages. Prepare cumulatively and practise connected problems.</aside>`
  });

  update('modeling-cycle',{
    stage:'Course',
    title:'What IB Math AI rewards',
    subtitle:'A numerical answer is only one part of a defensible mathematical decision.',
    body:`<div class="ibai-habits-grid">
      <article><b>1</b><h3>Define</h3><p>State the question, variables, units, domain, and assumptions.</p></article>
      <article><b>2</b><h3>Represent</h3><p>Choose data, a graph, a formula, a diagram, or a simulation.</p></article>
      <article><b>3</b><h3>Use technology</h3><p>Compute accurately and record mathematical evidence—not button sequences.</p></article>
      <article><b>4</b><h3>Validate</h3><p>Check residuals, reasonableness, sensitivity, and limitations.</p></article>
      <article><b>5</b><h3>Interpret</h3><p>Answer in context using appropriate precision and clear language.</p></article>
    </div>
    <div class="ibai-exploration-strip">
      <strong>The exploration · 20%</strong>
      <span>Focused question</span><span>Personal engagement</span><span>Clear communication</span><span>Reflection</span><span>Relevant mathematics</span>
    </div>`
  });

  update('study-system',{
    stage:'How to Study',
    title:'How to study IB Math AI',
    subtitle:'Short, active, repeated practice is stronger than rereading notes or memorizing calculator menus.',
    body:`<div class="study-compact">${studyCycle}${lessonRoutine}</div>
      <div class="ibai-weekly-rhythm">
        <span><b>Most days</b> 15–25 minutes: one current skill + one older retrieval question.</span>
        <span><b>Twice weekly</b> GDC fluency with written setup, units, and interpretation.</span>
        <span><b>Weekly</b> one extended-response, modelling, or data-decision task.</span>
        <span><b>Regularly</b> update your mistake log and exploration journal.</span>
      </div>`
  });

  update('rules-1',{
    stage:'Class Norms',
    title:'Our classroom agreements',
    subtitle:'Eight routines that protect learning time, evidence, and academic integrity.',
    body:rules
  });

  update('diagnostic-purpose',{
    stage:'Diagnostic',
    title:'Diagnostic readiness check',
    subtitle:'This is a support-planning snapshot—not a course grade or a final judgment.',
    body:`<div class="compact-diagnostic-intro ibai-diagnostic-intro">
      <div>
        <div class="diagnostic-facts">
          <article><strong>36</strong><span>common prerequisite questions</span></article>
          <article><strong>6</strong><span>readiness strands</span></article>
          <article><strong>No calculator</strong><span>use scratch paper for the common section</span></article>
          <article><strong>40–45 min</strong><span>work honestly and independently</span></article>
        </div>
        <aside class="callout"><strong>HL students:</strong> a separate six-question extension follows. It is reported separately and does not lower the common readiness score.</aside>
      </div>
      <div>
        <h3>What it measures</h3>
        <div class="diagnostic-strands-compact">
          <span>A · Number & Algebra</span><span>B · Functions & Modelling</span>
          <span>C · Geometry & Trigonometry</span><span>D · Statistics & Probability</span>
          <span>E · Data & Technology Reasoning</span><span>F · Rates & Calculus Readiness</span>
        </div>
        <ul class="instructions">
          <li>Answer independently; do not search or use AI.</li>
          <li>Choose your best response if you are uncertain.</li>
          <li>The result identifies where support should begin.</li>
          <li>Correct answers and explanations appear only after submission.</li>
        </ul>
        <button id="beginDiagnostic" class="route-button" type="button">Begin the diagnostic</button>
      </div>
    </div>`
  });

  const prefix=[
    'welcome',
    'opening-question',
    'identity-card',
    'bingo',
    'course-map',
    'assessment-overview',
    'modeling-cycle',
    'study-system',
    'rules-1',
    'diagnostic-purpose'
  ];
  const tailIndex=original.findIndex(slide=>slide&&slide.id==='diagnostic-A');
  const tail=tailIndex>=0?original.slice(tailIndex):[];
  data.slides=[...prefix.map(get).filter(Boolean),...tail];

  data.meta=Object.assign({},data.meta,{
    slides:data.slides.length,
    version:'ib-math-ai-compact-classroom-3.0.0-2026-08-29',
    design:'Student classroom presentation',
    preDiagnosticSlides:10,
    firstDiagnosticScreen:11
  });

  const storage='echs-ib-math-ai-lesson-0';
  const migration=`${storage}:compact-classroom-3.0.0`;
  if(localStorage.getItem(migration)!=='1'){
    localStorage.removeItem(`${storage}:slide`);
    localStorage.setItem(migration,'1');
  }
})();