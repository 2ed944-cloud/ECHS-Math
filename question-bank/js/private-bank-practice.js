/* Merge direct-linked private banks into lesson practice. */
(function(){
  "use strict";
  const params=new URLSearchParams(location.search),from=params.get("from")||"";
  const course=window.ECHSPortalAccess?.normaliseCourseKey(params.get("course")||"")||params.get("course")||"";
  const inferred=from.match(/(?:^|[:/_-])((?:\d+\.\d+)|(?:u\d+-[a-z0-9_-]+)|(?:APCALC-[A-Z0-9-]+))$/i)?.[1]||"";
  const lesson=params.get("topic")||params.get("lesson")||inferred;
  const supported=new Set(["ap-precalculus","ib-math-ai","ap-calculus","algebra-2","grade-9"]);
  const labels={
    "ap-precalculus":{"ECHS-BB-AT9":"AP Precalculus Bank 1","ECHS-BB-CA9":"AP Precalculus Bank 2","ECHS-BB-CA9B":"AP Precalculus Bank 3","ECHS-BB-ACS10":"AP Precalculus Bank 4"},
    "ib-math-ai":{"ECHS-BB-AT9":"IB Mathematics Bank 1","ECHS-BB-CA9":"IB Mathematics Bank 2","ECHS-BB-CA9B":"IB Mathematics Bank 3","ECHS-BB-ACS10":"IB Mathematics Bank 4"},
    "ap-calculus":{"CALC-BANK-01":"AP Calculus Bank 1"}
  };
  const dynamicLabels=new Map();
  function courseUnit(value){
    const text=String(value||"");
    const topic=text.match(/^(\d{1,2})\./),key=text.match(/(?:^|-)U(\d{1,2})(?:-|$)/i),readiness=/READINESS|EXT-/i.test(text);
    if(readiness)return 0;
    return Number(topic?.[1]||key?.[1]||NaN);
  }
  function disclosure(question){
    const trust=question.trust||{};
    if(trust.independent_math_verified===true||trust.mathematical_verified===true&&trust.katex_verified===true){
      return {title:"Verified private practice",text:trust.disclosure||"Source-checked and mathematically verified for authenticated school practice."};
    }
    return {title:"Source-key practice",text:trust.disclosure||"Linked from the private source package. Independent mathematical audit is not claimed."};
  }
  function normalise(row){
    const question={...(row.payload||{})},mapping=(question.course_mappings||[]).find(item=>item.course===course);
    if(!mapping)return null;
    const aliases=question.display_bank_aliases||{};
    const visible=aliases.student||aliases[course]||aliases.teacher||question.bank_code;
    if(question.bank_code&&visible)dynamicLabels.set(question.bank_code,visible);
    question.classification={...(question.classification||{}),course_scope:course,primary_unit:mapping.unit,primary_topic:mapping.lesson_key,primary_topic_title:mapping.lesson_title,mapping_verified:true,mapping_basis:mapping.basis||"verified-private-package"};
    if(course==="ap-calculus")question.classification={...question.classification,ap_unit:mapping.unit,ap_topic:mapping.lesson_key,ap_topic_title:mapping.lesson_title};
    question.skill_key=mapping.skill_key;question.trust_tier=row.trust_tier||"publisher_key_direct";
    question.metadata={...(question.metadata||{}),student_ready:true,verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};
    const note=disclosure(question);
    question.prompt_html=`<div class="notice sourceKeyNotice"><strong>${note.title}</strong> · ${note.text}</div>${question.prompt_html||""}`;
    question._private_bank=true;return question;
  }
  async function requestPage({offset=0,limit=500,lessonKey="",unit=""}={}){
    const query=new URLSearchParams({course,limit:String(limit),offset:String(offset)});
    if(lessonKey)query.set("lesson",lessonKey);
    if(unit!==""&&Number.isFinite(Number(unit)))query.set("unit",String(unit));
    return ECHSInstitution.api("private-bank-api",`/student-questions?${query.toString()}`);
  }
  async function collect(scope){
    const first=await requestPage({...scope,offset:0,limit:500}),rows=[...(first?.questions||[])],total=Number(first?.total||rows.length);
    if(total>500){
      const maxOffset=Math.max(0,total-500),offset=Math.floor(Math.random()*(maxOffset+1));
      if(offset>0){const extra=await requestPage({...scope,offset,limit:500});rows.push(...(extra?.questions||[]));}
    }
    return rows;
  }
  async function privateRows(){
    if(!supported.has(course)||!lesson||!window.ECHSInstitution?.api)return[];
    let rows=await collect({lessonKey:lesson});
    if(!rows.length&&course==="ap-calculus"){
      const unit=courseUnit(lesson);
      if(Number.isFinite(unit))rows=await collect({unit});
    }
    const seen=new Set();return rows.map(normalise).filter(question=>question&&!seen.has(question.id)&&seen.add(question.id));
  }
  function install(){
    if(!window.ECHSBank||!window.ECHSLearning)return setTimeout(install,40);
    const originalLoad=ECHSBank.loadBundle.bind(ECHSBank);
    ECHSBank.loadBundle=async source=>{
      const [base,direct]=await Promise.all([originalLoad(source),privateRows().catch(error=>{console.warn("Direct private lesson practice unavailable",error);return[]})]);
      const seen=new Set(),out=[];[...base,...direct].forEach(question=>{if(question?.id&&!seen.has(question.id)){seen.add(question.id);out.push(question)}});return out;
    };
    const originalLabel=ECHSBank.bankLabel.bind(ECHSBank);ECHSBank.bankLabel=code=>dynamicLabels.get(code)||labels[course]?.[code]||originalLabel(code);
    const originalRecord=ECHSLearning.recordAttempt.bind(ECHSLearning);
    ECHSLearning.recordAttempt=payload=>{
      const result=originalRecord(payload),question=payload?.question;
      if(result&&question?._private_bank){
        const rows=JSON.parse(localStorage.getItem("echs_learning_events_v2")||"[]"),index=rows.findIndex(row=>row.id===result.id);
        if(index>=0){rows[index]={...rows[index],skill_key:question.skill_key,trust_tier:question.trust_tier||"publisher_key_direct",representation:"publisher-source",verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};localStorage.setItem("echs_learning_events_v2",JSON.stringify(rows));}
      }
      return result;
    };
    document.documentElement.dataset.privateLessonBanks="direct";document.documentElement.dataset.privateLessonKey=lesson;
  }
  install();
})();
