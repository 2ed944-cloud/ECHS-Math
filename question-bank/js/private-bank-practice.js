/* Merge direct-linked private banks into lesson practice. */
(function(){
  "use strict";
  const params=new URLSearchParams(location.search);
  const course=window.ECHSPortalAccess?.normaliseCourseKey(params.get("course")||"")||params.get("course")||"";
  const lesson=params.get("topic")||params.get("lesson")||"";
  const supported=new Set(["ap-precalculus","ib-math-ai"]);
  const labels={
    "ap-precalculus":{"ECHS-BB-AT9":"AP Precalculus Bank 1","ECHS-BB-CA9":"AP Precalculus Bank 2","ECHS-BB-CA9B":"AP Precalculus Bank 3","ECHS-BB-ACS10":"AP Precalculus Bank 4"},
    "ib-math-ai":{"ECHS-BB-AT9":"IB Mathematics Bank 1","ECHS-BB-CA9":"IB Mathematics Bank 2","ECHS-BB-CA9B":"IB Mathematics Bank 3","ECHS-BB-ACS10":"IB Mathematics Bank 4"}
  };
  function normalise(row){
    const question={...(row.payload||{})};
    const mapping=(question.course_mappings||[]).find(item=>item.course===course);
    if(!mapping)return null;
    question.classification={...(question.classification||{}),course_scope:course,ap_unit:mapping.unit,ap_topic:mapping.lesson_key,ap_topic_title:mapping.lesson_title,mapping_verified:true,mapping_basis:"publisher-key-direct"};
    question.skill_key=mapping.skill_key;
    question.trust_tier=row.trust_tier||"publisher_key_direct";
    question.metadata={...(question.metadata||{}),student_ready:true,verification_basis:"publisher-answer-key"};
    question.prompt_html=`<div class="notice sourceKeyNotice"><strong>Source-key practice</strong> · Linked directly to this lesson using the publisher objective and answer key. Independent audit is not claimed.</div>${question.prompt_html||""}`;
    question._private_bank=true;
    return question;
  }
  async function privateRows(){
    if(!supported.has(course)||!lesson||!window.ECHSInstitution?.api)return[];
    const result=await ECHSInstitution.api("private-bank-api",`/student-questions?course=${encodeURIComponent(course)}&lesson=${encodeURIComponent(lesson)}&limit=2000`);
    return (result?.questions||[]).map(normalise).filter(Boolean);
  }
  function install(){
    if(!window.ECHSBank||!window.ECHSLearning)return setTimeout(install,40);
    const originalLoad=ECHSBank.loadBundle.bind(ECHSBank);
    ECHSBank.loadBundle=async source=>{
      const [base,direct]=await Promise.all([originalLoad(source),privateRows().catch(error=>{console.warn("Direct private lesson practice unavailable",error);return[]})]);
      const seen=new Set(),out=[];
      [...base,...direct].forEach(question=>{if(question?.id&&!seen.has(question.id)){seen.add(question.id);out.push(question)}});
      return out;
    };
    const originalLabel=ECHSBank.bankLabel.bind(ECHSBank);
    ECHSBank.bankLabel=code=>labels[course]?.[code]||originalLabel(code);
    const originalRecord=ECHSLearning.recordAttempt.bind(ECHSLearning);
    ECHSLearning.recordAttempt=payload=>{
      const result=originalRecord(payload);
      const question=payload?.question;
      if(result&&question?._private_bank){
        const rows=JSON.parse(localStorage.getItem("echs_learning_events_v2")||"[]");
        const index=rows.findIndex(row=>row.id===result.id);
        if(index>=0){rows[index]={...rows[index],skill_key:question.skill_key,trust_tier:question.trust_tier||"publisher_key_direct",representation:"publisher-source",verification_basis:"publisher-answer-key"};localStorage.setItem("echs_learning_events_v2",JSON.stringify(rows));}
      }
      return result;
    };
    document.documentElement.dataset.privateLessonBanks="direct";
  }
  install();
})();
