/* Compatibility layer: connect numeric IB Unit 1 lessons to earlier aggregate private-bank mappings. */
(function(){
  "use strict";
  const params=new URLSearchParams(location.search);
  const normaliseCourse=value=>window.ECHSPortalAccess?.normaliseCourseKey?.(value||"")||String(value||"");
  const requestedCourse=normaliseCourse(params.get("course")||"");
  const requestedLesson=String(params.get("topic")||params.get("lesson")||"").trim();
  if(requestedCourse!=="ib-math-ai"||!/^1\.[1-8]$/.test(requestedLesson))return;

  const ALIASES={
    "1.1":["u1-number","u1-standard-form","u1-scientific-notation"],
    "1.2":["u1-sequences","u1-arithmetic-sequences"],
    "1.3":["u1-sequences","u1-geometric-sequences"],
    "1.4":["u1-sequences","u1-financial-models"],
    "1.5":["u1-algebra","u1-logarithms"],
    "1.6":["u1-number","u1-approximation-error"],
    "1.7":["u1-sequences","u1-loans-annuities"],
    "1.8":["u1-algebra","u1-matrices","u1-technology-equations"]
  };
  const FALLBACK_LABELS={
    "IBAI-SL-MASTERY-2026":"IB Mathematics AI Bank 1",
    "IBAI-DP-COMPLETE":"IB Mathematics AI Bank 2",
    "IBAI-CURRENT-02":"IB Mathematics AI Bank 3",
    "IBAI-LEGACY-SL-03":"IB Mathematics AI Bank 4",
    "ECHS-IBAI-CURATED-01":"IB Mathematics AI Bank 5",
    "ECHS-IBAI-OXFORD-01":"IB Mathematics AI Bank 6",
    "IBAI-RT24-CORE":"IB Mathematics AI Bank 7",
    "IBAI-RT24-HL":"IB Mathematics AI Bank 8",
    "IBAI-SIB23-SL":"IB Mathematics AI Bank 9",
    "IBAI-SIB23-VERIFIED":"IB Mathematics AI Bank 10"
  };
  const dynamicLabels=new Map();
  const lessonTitle=params.get("title")||`Lesson ${requestedLesson}`;

  function disclosure(question){
    const trust=question.trust||{};
    if(trust.independent_math_verified===true||trust.mathematical_verified===true&&trust.katex_verified===true){
      return {title:"Verified private practice",text:trust.disclosure||"Source-checked and mathematically verified for authenticated school practice."};
    }
    return {title:"Source-key practice",text:trust.disclosure||"Linked from the private source package. Independent mathematical audit is not claimed."};
  }

  function visibleLabel(question,row){
    const aliases=question.display_bank_aliases||{},code=question.bank_code||row?.bank_code;
    return aliases.student||aliases[requestedCourse]||FALLBACK_LABELS[code]||aliases.teacher||code;
  }

  function scopeQuestion(question,sourceLesson){
    if(!question)return null;
    const classification={...(question.classification||{})};
    classification.course_scope="ib-math-ai";
    classification.primary_unit=1;
    classification.primary_topic=requestedLesson;
    classification.primary_topic_title=lessonTitle;
    classification.topic=requestedLesson;
    classification.topic_title=lessonTitle;
    classification.ib_unit=1;
    classification.ib_lesson=requestedLesson;
    classification.ib_lesson_title=lessonTitle;
    classification.ap_unit=1;
    classification.ap_topic=requestedLesson;
    classification.ap_topic_title=lessonTitle;
    classification.mapping_verified=true;
    classification.mapping_basis="ib-visible-lesson-alias";
    classification.source_lesson_key=sourceLesson||classification.source_lesson_key||"";
    question.classification=classification;
    question.metadata={...(question.metadata||{}),student_ready:true,visible_lesson_key:requestedLesson,source_lesson_key:sourceLesson||""};
    question._private_bank=true;
    question._ib_visible_lesson=requestedLesson;
    return question;
  }

  function normaliseRow(row){
    const question={...(row?.payload||{})};
    const mapping=(question.course_mappings||[]).find(item=>item.course==="ib-math-ai");
    if(!mapping)return null;
    question.bank_code=question.bank_code||row.bank_code;
    const label=visibleLabel(question,row);
    if(question.bank_code&&label)dynamicLabels.set(question.bank_code,label);
    question.skill_key=mapping.skill_key||question.skill_key;
    question.skill_keys=[...new Set([mapping.skill_key,...(question.skill_keys||[])].filter(Boolean))];
    question.trust_tier=row.trust_tier||question.trust?.tier||"publisher_key_direct";
    const note=disclosure(question);
    const prompt=String(question.prompt_html||"");
    if(!prompt.includes("sourceKeyNotice"))question.prompt_html=`<div class="notice sourceKeyNotice"><strong>${note.title}</strong> · ${note.text}</div>${prompt}`;
    return scopeQuestion(question,String(mapping.lesson_key||""));
  }

  function rescopeExisting(question){
    if(!question?._private_bank)return question;
    const mappings=question.course_mappings||[];
    const mapping=mappings.find(item=>item.course==="ib-math-ai");
    const sourceLesson=String(mapping?.lesson_key||question.classification?.source_lesson_key||question.classification?.ib_lesson||"");
    const label=visibleLabel(question,null);
    if(question.bank_code&&label)dynamicLabels.set(question.bank_code,label);
    return scopeQuestion(question,sourceLesson);
  }

  async function requestPage(lesson,offset=0,limit=1000){
    const query=new URLSearchParams({course:"ib-math-ai",lesson,limit:String(limit),offset:String(offset)});
    return ECHSInstitution.api("private-bank-api",`/student-questions?${query}`);
  }

  async function collect(lesson){
    const rows=[],pageSize=1000,maximum=6000;
    let offset=0,total=Infinity;
    while(offset<total&&rows.length<maximum){
      const page=await requestPage(lesson,offset,pageSize),items=[...(page?.questions||[])];
      rows.push(...items);total=Number(page?.total||rows.length);
      if(!items.length)break;
      offset+=items.length;
    }
    if(total>maximum)console.warn(`IB lesson alias practice capped at ${maximum} of ${total} questions for ${lesson}`);
    return rows;
  }

  function fingerprint(question){
    return question?.source?.source_content_fingerprint||question?.metadata?.source_content_fingerprint||question?.id;
  }

  function install(){
    if(document.documentElement.dataset.ibLessonAliasLayer==="ready")return;
    if(!window.ECHSBank||!window.ECHSLearning||!window.ECHSInstitution?.api)return setTimeout(install,40);
    document.documentElement.dataset.ibLessonAliasLayer="installing";
    const originalLoad=ECHSBank.loadBundle.bind(ECHSBank),originalLabel=ECHSBank.bankLabel.bind(ECHSBank);
    ECHSBank.loadBundle=async source=>{
      const base=await originalLoad(source);
      const scopedBase=base.map(rescopeExisting);
      const aliasRows=[];
      for(const alias of [...new Set(ALIASES[requestedLesson]||[])]){
        try{aliasRows.push(...await collect(alias))}catch(error){console.warn(`IB lesson alias ${alias} unavailable`,error)}
      }
      let aliasQuestions=aliasRows.map(normaliseRow).filter(Boolean);
      const existingPrivate=scopedBase.filter(question=>question?._private_bank).length;
      if(existingPrivate===0&&aliasQuestions.length===0){
        try{aliasQuestions=(await collect("u1-modeling")).map(normaliseRow).filter(Boolean)}catch(error){console.warn("IB modelling fallback unavailable",error)}
      }
      const seen=new Set(),out=[];
      [...scopedBase,...aliasQuestions].forEach(question=>{
        if(!question?.id)return;
        const key=`ib-math-ai|${fingerprint(question)}`;
        if(seen.has(key))return;
        seen.add(key);out.push(question);
      });
      window.dispatchEvent(new CustomEvent("echs:ib-private-banks-linked",{detail:{lesson:requestedLesson,total:out.filter(question=>question._private_bank).length}}));
      return out;
    };
    ECHSBank.bankLabel=code=>FALLBACK_LABELS[code]||dynamicLabels.get(code)||originalLabel(code);
    document.documentElement.dataset.ibLessonAliasLayer="ready";
    document.documentElement.dataset.ibVisibleLesson=requestedLesson;
  }
  install();
})();
