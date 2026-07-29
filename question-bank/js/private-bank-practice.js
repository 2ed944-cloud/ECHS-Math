/* Merge authenticated private banks into lesson, unit, and staff course practice. */
(function(){
  "use strict";
  const params=new URLSearchParams(location.search),from=params.get("from")||"";
  const requestedCourse=window.ECHSPortalAccess?.normaliseCourseKey(params.get("course")||"")||params.get("course")||"";
  const inferred=from.match(/(?:^|[:/_-])((?:\d+\.\d+)|(?:u\d+-[a-z0-9_-]+)|(?:APCALC-[A-Z0-9-]+))$/i)?.[1]||"";
  const requestedLesson=params.get("topic")||params.get("lesson")||inferred;
  const requestedUnit=params.get("unit")||"";
  const supported=new Set(["ap-precalculus","ib-math-ai","ap-calculus","algebra-2","grade-9"]);
  const labels={
    "ap-precalculus":{"ECHS-BB-AT9":"AP Precalculus Bank 1","ECHS-BB-CA9":"AP Precalculus Bank 2","ECHS-BB-CA9B":"AP Precalculus Bank 3","ECHS-BB-ACS10":"AP Precalculus Bank 4"},
    "ib-math-ai":{
      "IBAI-SL-MASTERY-2026":"IB Mathematics AI Bank 1",
      "IBAI-DP-COMPLETE":"IB Mathematics AI Bank 2",
      "IBAI-CURRENT-02":"IB Mathematics AI Bank 3",
      "IBAI-LEGACY-SL-03":"IB Mathematics AI Bank 4",
      "ECHS-BB-AT9":"IB Mathematics Bank 1","ECHS-BB-CA9":"IB Mathematics Bank 2","ECHS-BB-CA9B":"IB Mathematics Bank 3","ECHS-BB-ACS10":"IB Mathematics Bank 4"
    },
    "ap-calculus":{"CALC-BANK-01":"AP Calculus Bank 1"}
  };
  const dynamicLabels=new Map();
  function normaliseCourse(value){return window.ECHSPortalAccess?.normaliseCourseKey(value||"")||String(value||"")}
  function sourceCourse(source){return requestedCourse||normaliseCourse(source?.course_key||source?.course||source?.target_course||"")}
  function courseUnit(value){
    const text=String(value||"");
    const topic=text.match(/^(\d{1,2})\./),key=text.match(/(?:^|-)U(\d{1,2})(?:-|$)/i),readiness=/READINESS|EXT-/i.test(text);
    if(readiness)return 0;
    return Number(topic?.[1]||key?.[1]||NaN);
  }
  function sourceUnit(source,lessonKey){
    const candidate=requestedUnit||source?.unit||source?.course_unit||"";
    if(candidate!==""&&Number.isFinite(Number(candidate)))return Number(candidate);
    const inferredUnit=courseUnit(lessonKey);
    return Number.isFinite(inferredUnit)?inferredUnit:"";
  }
  function staff(){return ["teacher","admin"].includes(window.ECHSPortalAccess?.current?.role||"")}
  function disclosure(question){
    const trust=question.trust||{};
    if(trust.independent_math_verified===true||trust.mathematical_verified===true&&trust.katex_verified===true){
      return {title:"Verified private practice",text:trust.disclosure||"Source-checked and mathematically verified for authenticated school practice."};
    }
    return {title:"Source-key practice",text:trust.disclosure||"Linked from the private source package. Independent mathematical audit is not claimed."};
  }
  function normalise(row,courseKey){
    const question={...(row.payload||{})},mapping=(question.course_mappings||[]).find(item=>item.course===courseKey);
    if(!mapping)return null;
    const aliases=question.display_bank_aliases||{};
    const visible=aliases.student||aliases[courseKey]||aliases.teacher||labels[courseKey]?.[question.bank_code]||question.bank_code;
    if(question.bank_code&&visible)dynamicLabels.set(question.bank_code,visible);
    const lessonKey=String(mapping.lesson_key||""),lessonTitle=String(mapping.lesson_title||lessonKey);
    question.classification={
      ...(question.classification||{}),
      course_scope:courseKey,
      primary_unit:mapping.unit,
      primary_topic:lessonKey,
      primary_topic_title:lessonTitle,
      topic:lessonKey,
      topic_title:lessonTitle,
      ib_unit:courseKey==="ib-math-ai"?mapping.unit:question.classification?.ib_unit,
      ib_lesson:courseKey==="ib-math-ai"?lessonKey:question.classification?.ib_lesson,
      ib_lesson_title:courseKey==="ib-math-ai"?lessonTitle:question.classification?.ib_lesson_title,
      ap_unit:question.classification?.ap_unit??mapping.unit,
      ap_topic:question.classification?.ap_topic||lessonKey,
      ap_topic_title:question.classification?.ap_topic_title||lessonTitle,
      mapping_verified:true,
      mapping_basis:mapping.basis||"verified-private-package"
    };
    question.skill_key=mapping.skill_key;
    question.skill_keys=[...new Set([mapping.skill_key,...(question.skill_keys||[])].filter(Boolean))];
    question.trust_tier=row.trust_tier||question.trust?.tier||"publisher_key_direct";
    question.metadata={...(question.metadata||{}),student_ready:true,verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};
    const note=disclosure(question);
    question.prompt_html=`<div class="notice sourceKeyNotice"><strong>${note.title}</strong> · ${note.text}</div>${question.prompt_html||""}`;
    question._private_bank=true;
    return question;
  }
  async function requestPage({courseKey,offset=0,limit=1000,lessonKey="",unit=""}={}){
    const query=new URLSearchParams({course:courseKey,limit:String(limit),offset:String(offset)});
    if(lessonKey)query.set("lesson",lessonKey);
    if(unit!==""&&Number.isFinite(Number(unit)))query.set("unit",String(unit));
    return ECHSInstitution.api("private-bank-api",`/student-questions?${query.toString()}`);
  }
  async function collect(scope){
    const rows=[],pageSize=1000,maximum=10000;
    let offset=0,total=Infinity;
    while(offset<total&&rows.length<maximum){
      const page=await requestPage({...scope,offset,limit:pageSize}),items=[...(page?.questions||[])];
      rows.push(...items);
      total=Number(page?.total||rows.length);
      if(!items.length)break;
      offset+=items.length;
    }
    if(total>maximum)console.warn(`Private practice capped at ${maximum} of ${total} questions for ${scope.courseKey}`);
    return rows;
  }
  async function privateRows(source){
    const courseKey=sourceCourse(source),lessonKey=requestedLesson,unit=sourceUnit(source,lessonKey);
    if(!supported.has(courseKey)||!window.ECHSInstitution?.api)return[];
    let rows=[];
    if(lessonKey){
      rows=await collect({courseKey,lessonKey});
      if(!rows.length&&courseKey==="ap-calculus"&&unit!=="")rows=await collect({courseKey,unit});
    }else if(staff()){
      if(unit!=="")rows=await collect({courseKey,unit});
      else if(courseKey==="ib-math-ai")rows=await collect({courseKey});
    }
    const seen=new Set();
    return rows.map(row=>normalise(row,courseKey)).filter(question=>{
      if(!question)return false;
      const fingerprint=question.source?.source_content_fingerprint||question.metadata?.source_content_fingerprint||question.id;
      const key=`${courseKey}|${fingerprint}`;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }
  function install(){
    if(!window.ECHSBank||!window.ECHSLearning)return setTimeout(install,40);
    const originalLoad=ECHSBank.loadBundle.bind(ECHSBank);
    ECHSBank.loadBundle=async source=>{
      const activeCourse=sourceCourse(source);
      const [base,direct]=await Promise.all([originalLoad(source),privateRows(source).catch(error=>{console.warn("Direct private practice unavailable",error);return[]})]);
      const seen=new Set(),out=[];
      [...base,...direct].forEach(question=>{
        if(!question?.id)return;
        const fingerprint=question.source?.source_content_fingerprint||question.metadata?.source_content_fingerprint||question.id;
        const key=`${activeCourse}|${fingerprint}`;
        if(seen.has(key))return;
        seen.add(key);
        out.push(question);
      });
      return out;
    };
    const originalLabel=ECHSBank.bankLabel.bind(ECHSBank);
    ECHSBank.bankLabel=code=>dynamicLabels.get(code)||labels[requestedCourse]?.[code]||originalLabel(code);
    const originalRecord=ECHSLearning.recordAttempt.bind(ECHSLearning);
    ECHSLearning.recordAttempt=payload=>{
      const result=originalRecord(payload),question=payload?.question;
      if(result&&question?._private_bank){
        const rows=JSON.parse(localStorage.getItem("echs_learning_events_v2")||"[]"),index=rows.findIndex(row=>row.id===result.id);
        if(index>=0){
          rows[index]={...rows[index],skill_key:question.skill_key,trust_tier:question.trust_tier||"publisher_key_direct",representation:"publisher-source",verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};
          localStorage.setItem("echs_learning_events_v2",JSON.stringify(rows));
        }
      }
      return result;
    };
    document.documentElement.dataset.privateLessonBanks="direct";
    document.documentElement.dataset.privateLessonKey=requestedLesson||"course-browser";
  }
  install();
})();
