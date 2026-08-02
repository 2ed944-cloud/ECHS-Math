(function () {
  "use strict";
  const data = window.LESSON_DATA;
  const library = window.ECHS_UNIT1_V3_CONTENT;
  if (!data || !library) {
    console.error("ECHS Unit 1 v3 enhancement could not start.", {data: !!data, library: !!library});
    return;
  }

  const number = String(data.lesson && data.lesson.number || "");
  const pack = library[number];
  if (!pack) return;

  const unique = values => [...new Set((values || []).filter(Boolean))];
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[ch]));

  const visualWords = {
    "1.1":[
      ["N","Z","Q","R"],
      ["0.000438","4.38 × 10⁻⁴","a","k"],
      ["coefficients","powers","normalize","interpret"],
      ["km","m","km²","m²"],
      ["estimate","calculate","units","validate"]
    ],
    "1.2":[
      ["u₁","u₂","u₃","uₙ"],
      ["+d","+d","+d","constant"],
      ["recursive","explicit","table","graph"],
      ["first + last","pair sums","average","Sₙ"],
      ["target","equation","integer n","verify"]
    ],
    "1.3":[
      ["u₁","×r","u₂","×r"],
      ["r > 1","0 < r < 1","r < 0","sign"],
      ["u₁rⁿ⁻¹","term","index","scale"],
      ["finite sum","shift","subtract","Sₙ"],
      ["threshold","logarithm","least n","saturation"]
    ],
    "1.4":[
      ["principal","fixed amount","simple","arithmetic"],
      ["periodic rate","periods","compound","future value"],
      ["nominal","effective","frequency","compare"],
      ["depreciation","inflation","factor","time"],
      ["fees","tax","risk","net outcome"]
    ],
    "1.5":[
      ["aᵐaⁿ","aᵐ⁺ⁿ","a⁻ⁿ","1/aⁿ"],
      ["roots","fractional powers","domain","exact form"],
      ["common base","equal powers","exponents","solve"],
      ["bʸ=x","log_b x=y","inverse","reflection"],
      ["ln","change base","target","interpret t"]
    ],
    "1.6":[
      ["decimal places","significant figures","guard digits","round once"],
      ["lower bound","reported value","upper bound","half-open"],
      ["L min","W min","L max","W max"],
      ["absolute error","percentage error","reference","units"],
      ["uncertainty","consequence","decision","justify"]
    ],
    "1.7":[
      ["PV","PMT","opposite signs","cash flow"],
      ["deposit","interest","annuity","future value"],
      ["loan","payment","term","total interest"],
      ["opening balance","interest","principal","closing balance"],
      ["extra payment","shorter term","liquidity","strategy"]
    ],
    "1.8":[
      ["line 1","line 2","intersection","solution"],
      ["x","y","z","consistent order"],
      ["f(x)=0","root","window","verify"],
      ["data conditions","a","b","c"],
      ["substitute","residual","constraint","interpret"]
    ]
  };

  const palette = ["#7A1733","#17324D","#177E89","#D4A72C","#5D6A75"];
  let visualSerial=0;
  const wordsFor = (lesson, variant) => (visualWords[lesson] || visualWords["1.1"])[variant % 5];

  function svgBase(title, body, label) {
    const filterId=`v3shadow-${number.replace(".","-")}-${++visualSerial}`;
    body=String(body).replaceAll('url(#v3shadow)',`url(#${filterId})`);
    return `<svg class="concept-visual v3-concept-visual" viewBox="0 0 620 300" role="img" aria-label="${esc(label || title)}">
      <defs><filter id="${filterId}"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity=".12"/></filter></defs>
      <rect width="620" height="300" rx="28" fill="#F8F4EE"/>
      <rect x="18" y="18" width="584" height="264" rx="24" fill="#FFFDF9" stroke="#DED7CE"/>
      <text x="42" y="54" font-size="18" font-weight="850" fill="#17324D">${esc(title)}</text>
      ${body}
    </svg>`;
  }

  function visualScale(title, items) {
    const xs=[82,196,310,424,538];
    const nodes=xs.map((x,i)=>`<g><circle cx="${x}" cy="162" r="${i===2?15:11}" fill="${palette[i]}" filter="url(#v3shadow)"/>
      <text x="${x}" y="${i%2?205:124}" text-anchor="middle" font-size="14" font-weight="750" fill="#17324D">${esc(items[i%items.length])}</text></g>`).join("");
    return svgBase(title, `<line x1="72" y1="162" x2="548" y2="162" stroke="#17324D" stroke-width="5" stroke-linecap="round"/>
      <path d="M90 92 C210 72 405 72 530 92" fill="none" stroke="#D4A72C" stroke-width="4" stroke-dasharray="10 9"/>
      ${nodes}<text x="310" y="255" text-anchor="middle" fill="#5D6A75" font-size="13">read scale · compare structure · interpret units</text>`, title);
  }

  function visualSteps(title, items) {
    const steps=[0,1,2,3].map((i)=>{
      const x=72+i*116, y=222-i*40, h=40+i*14;
      return `<g><rect x="${x}" y="${y}" width="104" height="${h}" rx="13" fill="${palette[i]}" opacity="${.86+i*.03}"/>
        <text x="${x+52}" y="${y+24}" text-anchor="middle" fill="white" font-size="13" font-weight="850">${esc(items[i%items.length])}</text></g>`;
    }).join("");
    return svgBase(title, `${steps}<path d="M87 248 C185 225 265 190 350 154 C430 120 486 106 548 88" fill="none" stroke="#17324D" stroke-width="4" stroke-linecap="round"/>
      <polygon points="548,88 529,85 538,102" fill="#17324D"/>
      <text x="310" y="272" text-anchor="middle" fill="#5D6A75" font-size="13">each step must preserve the model rule</text>`, title);
  }

  function visualOrbit(title, items) {
    const radii=[94,70,46,23];
    const circles=radii.map((r,i)=>`<circle cx="310" cy="166" r="${r}" fill="${palette[3-i]}" opacity="${.11+i*.07}" stroke="${palette[3-i]}" stroke-width="3"/>
      <text x="${310+r+18}" y="${170-r/4}" fill="${palette[3-i]}" font-size="13" font-weight="800">${esc(items[i%items.length])}</text>`).join("");
    return svgBase(title, `${circles}<circle cx="310" cy="166" r="8" fill="#7A1733"/>
      <path d="M205 82 Q310 25 415 82" fill="none" stroke="#D4A72C" stroke-width="4" stroke-dasharray="9 8"/>
      <text x="310" y="267" text-anchor="middle" fill="#5D6A75" font-size="13">nested ideas · inverse relationships · constraints</text>`, title);
  }

  function visualGraph(title, items) {
    return svgBase(title, `<line x1="72" y1="238" x2="558" y2="238" stroke="#17324D" stroke-width="3"/>
      <line x1="92" y1="250" x2="92" y2="78" stroke="#17324D" stroke-width="3"/>
      <path d="M95 220 C165 207 205 196 258 166 C327 126 385 94 548 84" fill="none" stroke="#177E89" stroke-width="6" stroke-linecap="round"/>
      <path d="M95 224 L205 190 L315 156 L425 122 L548 88" fill="none" stroke="#7A1733" stroke-width="4" stroke-dasharray="10 8"/>
      ${[0,1,2,3].map((i)=>`<g><circle cx="${135+i*120}" cy="${210-i*34}" r="8" fill="${palette[i]}"/><text x="${135+i*120}" y="${258-i%2*154}" text-anchor="middle" fill="#17324D" font-size="12" font-weight="750">${esc(items[i%items.length])}</text></g>`).join("")}
      <text x="535" y="260" fill="#5D6A75" font-size="12">index / time</text>`, title);
  }

  function visualCards(title, items) {
    const pos=[[70,88],[330,88],[70,184],[330,184]];
    const cards=pos.map((p,i)=>`<g filter="url(#v3shadow)"><rect x="${p[0]}" y="${p[1]}" width="220" height="70" rx="18" fill="white" stroke="${palette[i]}" stroke-width="3"/>
      <circle cx="${p[0]+30}" cy="${p[1]+35}" r="14" fill="${palette[i]}"/><text x="${p[0]+56}" y="${p[1]+41}" fill="#17324D" font-size="14" font-weight="800">${esc(items[i%items.length])}</text></g>`).join("");
    return svgBase(title, `${cards}<path d="M290 123 L330 123 M290 219 L330 219" stroke="#D4A72C" stroke-width="5" stroke-linecap="round"/>
      <polygon points="330,123 317,116 317,130" fill="#D4A72C"/><polygon points="330,219 317,212 317,226" fill="#D4A72C"/>`, title);
  }

  function makeVisual(lesson, index, title) {
    const items=wordsFor(lesson,index);
    const variant=index%5;
    if (variant===0) return visualOrbit(title,items);
    if (variant===1) return visualSteps(title,items);
    if (variant===2) return visualCards(title,items);
    if (variant===3) return visualGraph(title,items);
    return visualScale(title,items);
  }

  function deepDiveSlides() {
    const sourceText=(pack.source_basis||[]).map(esc).join(" · ");
    const slides=[];
    pack.deep_dives.forEach((item,index)=>{
      slides.push({
        section:"Reference synthesis",
        title:item.title,
        kind:"content",
        eyebrow:`Source-informed deep dive ${index+1} of ${pack.deep_dives.length}`,
        html:`<div class="concept-grid v3-reference-grid"><div>
          <div class="v3-reference-kicker">Reference synthesis · original ECHS adaptation</div>
          <p>${item.summary}</p>
          <div class="formula-panel">\\[${item.formula}\\]</div>
          <div class="v3-source-strip"><b>Built from:</b> ${sourceText}</div>
        </div>${makeVisual(number,index,item.title)}</div>`
      });
      slides.push({
        section:"Reference synthesis",
        title:`Worked example · ${item.title}`,
        kind:"worked",
        eyebrow:"Model the reasoning, not only the result",
        html:`<div class="worked v3-worked"><div class="prompt"><span>Problem</span><p>${item.worked}</p></div>
          <div class="method"><span>Complete reasoning</span><p>${item.result}</p></div></div>
          <div class="v3-reasoning-ribbon"><b>IB communication:</b> name the structure, show the governing rule, retain exact values where useful, then interpret.</div>`
      });
      slides.push({
        section:"Reference synthesis",
        title:`Student transfer · ${item.title}`,
        kind:"student",
        eyebrow:"Attempt before revealing",
        html:`<div class="student-turn v3-student-turn"><h3>Transfer the idea</h3><p>${item.try_prompt}</p>
          <textarea class="student-note" data-note="v3-${number}-${index}" aria-label="Student response"></textarea>
          <details><summary>Reveal a complete check</summary><p>${item.try_answer}</p></details>
        </div><div class="misconception v3-misconception"><div class="warning-symbol">!</div><div><h3>Precision trap</h3><p>${item.trap}</p></div></div>`
      });
    });
    return slides;
  }

  function replaceRepeatedVisuals() {
    let count=pack.deep_dives.length;
    data.slides.forEach(slide=>{
      if (!slide || typeof slide.html!=="string" || !slide.html.includes("concept-visual")) return;
      slide.html=slide.html.replace(/<svg class=["']concept-visual["'][\s\S]*?<\/svg>/g,()=>{
        const replacement=makeVisual(number,count,slide.title||pack.title);
        count+=1;
        return replacement;
      });
    });
  }

  function appendUnique(target, additions) {
    const ids=new Set((target||[]).map(item=>item&&item.id).filter(Boolean));
    (additions||[]).forEach(item=>{
      if (!item || (item.id && ids.has(item.id))) return;
      target.push(item);
      if (item.id) ids.add(item.id);
    });
  }

  data.version="3.0.0";
  data.buildDate="2026-08-02";
  data.lesson.title=pack.title || data.lesson.title;
  data.lesson.objectives=unique([...(data.lesson.objectives||[]),...(pack.extra_objectives||[])]);
  data.lesson.vocab=unique([...(data.lesson.vocab||[]),...(pack.extra_vocab||[])]);
  data.lesson.source_basis=pack.source_basis||[];
  if (pack.course_note) data.lesson.transition=pack.course_note;
  data.referenceBasis={
    approach:"Original ECHS lesson adaptation informed by the supplied Pearson, Haese and Nikolaidis references.",
    sources:pack.source_basis||[],
    courseVersion:number==="1.5"?"Current AI SL through 2028 assessment sessions; see course-version note.":"Current AI SL content, with transition awareness."
  };

  replaceRepeatedVisuals();
  const insertAt=Math.max(8,(data.slides||[]).length-11);
  data.slides.splice(insertAt,0,...deepDiveSlides());

  data.practice=data.practice||[];
  data.quiz=data.quiz||[];
  data.exam=data.exam||[];
  appendUnique(data.practice,pack.practice);
  appendUnique(data.quiz,pack.quiz);
  appendUnique(data.exam,[pack.exam]);

  const syllabusSlide=data.slides.find(slide=>slide && /syllabus focus/i.test(slide.title||""));
  if (syllabusSlide && typeof syllabusSlide.html==="string" && !syllabusSlide.html.includes("v3-source-basis")) {
    syllabusSlide.html += `<div class="v3-source-basis"><b>Reference basis</b><span>${(pack.source_basis||[]).map(esc).join("</span><span>")}</span></div>`;
  }

  const cover=data.slides.find(slide=>slide&&slide.kind==="cover");
  if (cover && typeof cover.html==="string") {
    cover.html=cover.html.replace("Original practice","Reference-informed v3");
    if (!cover.html.includes("v3-release-badge")) {
      cover.html += `<div class="v3-release-badge"><b>Definitive v3</b><span>${data.slides.length} learn slides · ${data.practice.length} practice questions · ${data.quiz.length} quiz questions · ${data.exam.length} extended tasks</span></div>`;
    }
  }

  data.v3Audit={
    slides:data.slides.length,
    practice:data.practice.length,
    quiz:data.quiz.length,
    exam:data.exam.length,
    addedSlides:pack.deep_dives.length*3,
    addedPractice:pack.practice.length,
    addedQuiz:pack.quiz.length,
    sourceBasis:pack.source_basis
  };

  function patchRouteText(root=document) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("[data-filter]").forEach(button=>{
      const level=button.dataset.filter;
      const count=level==="All"?data.practice.length:data.practice.filter(q=>q.level===level).length;
      button.textContent=`${level} · ${count}`;
    });
    root.querySelectorAll(".route-header h1").forEach(node=>{
      if (/Ten-question checkpoint/i.test(node.textContent)) node.textContent=`${data.quiz.length}-question checkpoint`;
    });
    root.querySelectorAll(".route-header p").forEach(node=>{
      if (/Forty original questions/i.test(node.textContent)) node.textContent=`${data.practice.length} original, source-informed questions are balanced across four levels. Work is saved locally on this device.`;
      if (/Two original tasks per lesson/i.test(node.textContent)) node.textContent=`${data.exam.length} original extended-response tasks. Use command terms, show technology transparently and interpret every contextual result.`;
      if (/Questions are distinct from Practice Studio/i.test(node.textContent)) node.textContent=`Suggested time: 25 minutes. All ${data.quiz.length} questions are distinct from Practice Studio.`;
    });
  }

  if (typeof document!=="undefined") {
    document.documentElement.classList.add("echs-unit1-v3",`unit1-lesson-${number.replace(".","-")}`);
    const observer=new MutationObserver(()=>patchRouteText(document));
    observer.observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener("DOMContentLoaded",()=>patchRouteText(document),{once:true});
  }
})();
