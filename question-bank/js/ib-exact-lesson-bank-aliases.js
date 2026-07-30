/* Exact IB Unit 1 lesson aliases; aggregate skill pools are never spread across lessons. */
(function(){
  "use strict";
  const params=new URLSearchParams(location.search);
  const normaliseCourse=value=>window.ECHSPortalAccess?.normaliseCourseKey?.(value||"")||String(value||"");
  const requestedCourse=normaliseCourse(params.get("course")||"");
  const requestedLesson=String(params.get("topic")||params.get("lesson")||"").trim();
  if(requestedCourse!=="ib-math-ai"||!/^1\.[1-8]$/.test(requestedLesson))return;

  const ALIASES={
    "1.1":["u1-standard-form","u1-scientific-notation"],
    "1.2":["u1-arithmetic-sequences"],
    "1.3":["u1-geometric-sequences"],
    "1.4":["u1-financial-models"],
    "1.5":["u1-logarithms"],
    "1.6":["u1-approximation-error"],
    "1.7":["u1-loans-annuities"],
    "1.8":["u1-technology-equations"]
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
  const allowedSourceLessons=new Set([requestedLesson,...(ALIASES[requestedLesson]||[])]),dynamicLabels=new Map();
  const lessonTitle=params.get("title")||`Lesson ${requestedLesson}`;

  function disclosure(question){
    const trust=question.trust||{};
    if(trust.independent_math_verified===true||trust.mathematical_verified===true&&trust.katex_verified===true)return{title:"Verified private practice",text:trust.disclosure||"Source-checked and mathematically verified for authenticated school practice."};
    return{title:"Source-key practice",text:trust.disclosure||"Linked from the private source package. Independent mathematical audit is not claimed."};
  }
  function visibleLabel(question,row){const aliases=question.display_bank_aliases||{},code=question.bank_code||row?.bank_code;return aliases.student||aliases[requestedCourse]||FALLBACK_LABELS[code]||aliases.teacher||code;}
  function sourceMapping(row,question){
    const rowMappings=Array.isArray(row?.course_mappings)?row.course_mappings:[],payloadMappings=Array.isArray(question?.course_mappings)?question.course_mappings:[];
    return(rowMappings.length?rowMappings:payloadMappings).find(item=>normaliseCourse(item?.course)==="ib-math-ai"&&allowedSourceLessons.has(String(item?.lesson_key||"")))||null;
  }
  function scopeQuestion(question,sourceLesson){
    if(!question||!allowedSourceLessons.has(String(sourceLesson||"")))return null;
    const classification={...(question.classification||{}),course_scope:"ib-math-ai",primary_unit:1,primary_topic:requestedLesson,primary_topic_title:lessonTitle,topic:requestedLesson,topic_title:lessonTitle,ib_unit:1,ib_lesson:requestedLesson,ib_lesson_title:lessonTitle,mapping_verified:true,mapping_basis:sourceLesson===requestedLesson?"ib-exact-visible-lesson":"ib-exact-lesson-alias",source_lesson_key:sourceLesson};
    question.classification=classification;question.metadata={...(question.metadata||{}),student_ready:true,visible_lesson_key:requestedLesson,source_lesson_key:sourceLesson,alias_scope:"exact-only"};question._private_bank=true;question._ib_visible_lesson=requestedLesson;return question;
  }
  function normaliseRow(row){
    const question={...(row?.payload||{})},mapping=sourceMapping(row,question);if(!mapping)return null;
    question.course_mappings=Array.isArray(row?.course_mappings)&&row.course_mappings.length?row.course_mappings:(question.course_mappings||[]);question.bank_code=question.bank_code||row.bank_code;
    const label=visibleLabel(question,row);if(question.bank_code&&label)dynamicLabels.set(question.bank_code,label);
    question.skill_key=mapping.skill_key||question.skill_key;question.skill_keys=[...new Set([mapping.skill_key,...(question.skill_keys||[])].filter(Boolean))];question.trust_tier=row.trust_tier||question.trust?.tier||"publisher_key_direct";
    const note=disclosure(question),prompt=String(question.prompt_html||"");if(!prompt.includes("sourceKeyNotice"))question.prompt_html=`<div class="notice sourceKeyNotice"><strong>${note.title}</strong> · ${note.text}</div>${prompt}`;
    return scopeQuestion(question,String(mapping.lesson_key||""));
  }
  function rescopeExisting(question){if(!question?._private_bank)return question;const mapping=sourceMapping(null,question);if(!mapping)return null;const label=visibleLabel(question,null);if(question.bank_code&&label)dynamicLabels.set(question.bank_code,label);return scopeQuestion(question,String(mapping.lesson_key||""));}
  async function collect(lesson){
    const rows=[],pageSize=1000,maximum=6000;let offset=0,total=Infinity;
    while(offset<total&&rows.length<maximum){const query=new URLSearchParams({course:"ib-math-ai",lesson,limit:String(pageSize),offset:String(offset),view:"ready"}),page=await ECHSInstitution.api("practice-bank-api",`/questions?${query}`),items=[...(page?.questions||[])];rows.push(...items);total=Number(page?.total||rows.length);if(!items.length)break;offset+=items.length;}
    return rows;
  }
  const fingerprint=question=>question?.source?.source_content_fingerprint||question?.metadata?.source_content_fingerprint||question?.id;
  function install(){
    if(document.documentElement.dataset.ibLessonAliasLayer==="ready")return;
    if(!window.ECHSBank||!window.ECHSLearning||!window.ECHSInstitution?.api)return setTimeout(install,40);
    const originalLoad=ECHSBank.loadBundle.bind(ECHSBank),originalLabel=ECHSBank.bankLabel.bind(ECHSBank);
    ECHSBank.loadBundle=async source=>{
      const base=await originalLoad(source),scopedBase=base.map(rescopeExisting).filter(Boolean),aliasRows=[];
      for(const alias of ALIASES[requestedLesson]||[]){try{aliasRows.push(...await collect(alias));}catch(error){console.warn(`IB exact lesson alias ${alias} unavailable`,error);}}
      const seen=new Set(),out=[];[...scopedBase,...aliasRows.map(normaliseRow).filter(Boolean)].forEach(question=>{if(!question?.id)return;const key=`ib-math-ai|${fingerprint(question)}`;if(!seen.has(key)){seen.add(key);out.push(question);}});
      window.dispatchEvent(new CustomEvent("echs:ib-private-banks-linked",{detail:{lesson:requestedLesson,total:out.filter(question=>question._private_bank).length,alias_policy:"exact-only"}}));return out;
    };
    ECHSBank.bankLabel=(code,course)=>FALLBACK_LABELS[code]||dynamicLabels.get(code)||originalLabel(code,course);
    Object.assign(document.documentElement.dataset,{ibLessonAliasLayer:"ready",ibVisibleLesson:requestedLesson,ibAliasPolicy:"exact-only"});
  }
  install();
})();
