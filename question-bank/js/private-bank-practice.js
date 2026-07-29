/* Merge authenticated private banks into lesson, unit, and staff course practice. */
(function(){
  "use strict";

  const params=new URLSearchParams(location.search);
  const from=params.get("from")||"";
  const inferred=from.match(/(?:^|[:/_-])((?:\d+\.\d+)|(?:u\d+-[a-z0-9_-]+)|(?:APCALC-[A-Z0-9-]+))$/i)?.[1]||"";
  const requestedLesson=params.get("topic")||params.get("lesson")||inferred;
  const requestedUnit=params.get("unit")||"";
  const supported=new Set(["ap-precalculus","ib-math-ai","ap-calculus","algebra-2","grade-9"]);
  const labels={
    "ap-precalculus":{"ECHS-BB-AT9":"AP Precalculus Bank 1","ECHS-BB-CA9":"AP Precalculus Bank 2","ECHS-BB-CA9B":"AP Precalculus Bank 3","ECHS-BB-ACS10":"AP Precalculus Bank 4"},
    "ib-math-ai":{
      "IBAI-SL-MASTERY-2026":"IB Mathematics AI Bank 1","IBAI-DP-COMPLETE":"IB Mathematics AI Bank 2","IBAI-CURRENT-02":"IB Mathematics AI Bank 3","IBAI-LEGACY-SL-03":"IB Mathematics AI Bank 4","ECHS-IBAI-CURATED-01":"IB Mathematics AI Bank 5","ECHS-IBAI-OXFORD-01":"IB Mathematics AI Bank 6","IBAI-RT24-CORE":"IB Mathematics AI Bank 7","IBAI-RT24-HL":"IB Mathematics AI Bank 8","IBAI-SIB23-SL":"IB Mathematics AI Bank 9","IBAI-SIB23-VERIFIED":"IB Mathematics AI Bank 10","ECHS-BB-AT9":"IB Mathematics Bank 1","ECHS-BB-CA9":"IB Mathematics Bank 2","ECHS-BB-CA9B":"IB Mathematics Bank 3","ECHS-BB-ACS10":"IB Mathematics Bank 4"
    },
    "ap-calculus":{"CALC-BANK-01":"AP Calculus Bank 1"}
  };

  const dynamicLabels=new Map(),generatedIBLabels=new Map();
  let activeCourse="",nextIBLabel=11;
  function normaliseCourse(value){return window.ECHSPortalAccess?.normaliseCourseKey?.(value||"")||String(value||"")}
  function sourceCourse(source){return normaliseCourse(params.get("course")||"")||normaliseCourse(source?.course_key||source?.course||source?.target_course||"")}
  function courseUnit(value){const text=String(value||""),topic=text.match(/^(\d{1,2})\./),key=text.match(/(?:^|-)U(\d{1,2})(?:-|$)/i);if(/READINESS|EXT-/i.test(text))return 0;return Number(topic?.[1]||key?.[1]||NaN)}
  function sourceUnit(source,lessonKey){const candidate=requestedUnit||source?.unit||source?.course_unit||"";if(candidate!==""&&Number.isFinite(Number(candidate)))return Number(candidate);const inferredUnit=courseUnit(lessonKey);return Number.isFinite(inferredUnit)?inferredUnit:""}
  async function resolvedAccess(){try{return await window.ECHSPortalAccess?.ready}catch{return window.ECHSPortalAccess?.current||null}}
  function staff(access){return["teacher","admin"].includes(access?.role||window.ECHSPortalAccess?.current?.role||"")}
  function disclosure(question){const trust=question.trust||{};if(trust.independent_math_verified===true||trust.mathematical_verified===true&&trust.katex_verified===true)return{title:"Verified private practice",text:trust.disclosure||"Source-checked and mathematically verified for authenticated school practice."};return{title:"Source-key practice",text:trust.disclosure||"Linked from the private source package. Independent mathematical audit is not claimed."}}
  function neutralIBLabel(code){if(!code)return"IB Mathematics AI Bank";if(labels["ib-math-ai"][code])return labels["ib-math-ai"][code];if(!generatedIBLabels.has(code))generatedIBLabels.set(code,`IB Mathematics AI Bank ${nextIBLabel++}`);return generatedIBLabels.get(code)}

  function normalise(row,courseKey){
    const question={...(row?.payload||{})};question.bank_code=question.bank_code||row?.bank_code||"";
    const payloadMappings=Array.isArray(question.course_mappings)?question.course_mappings:[],rowMappings=Array.isArray(row?.course_mappings)?row.course_mappings:[],mappings=payloadMappings.length?payloadMappings:rowMappings;
    const mapping=mappings.find(item=>normaliseCourse(item?.course)===courseKey);if(!mapping)return null;question.course_mappings=mappings;
    const aliases=question.display_bank_aliases||{},visible=courseKey==="ib-math-ai"?neutralIBLabel(question.bank_code):aliases.student||aliases[courseKey]||aliases.teacher||labels[courseKey]?.[question.bank_code]||question.bank_code;if(question.bank_code&&visible)dynamicLabels.set(question.bank_code,visible);
    const lessonKey=String(mapping.lesson_key||""),lessonTitle=String(mapping.lesson_title||lessonKey),expectedUnit=courseUnit(lessonKey),mappedUnit=Number(mapping.unit);
    if(courseKey==="ib-math-ai"&&Number.isFinite(expectedUnit)&&Number.isFinite(mappedUnit)&&expectedUnit!==mappedUnit){console.error("Blocked an IB question with inconsistent unit and lesson mapping",{question_id:row?.question_id||question.id,unit:mapping.unit,lesson_key:lessonKey});return null}
    question.classification={...(question.classification||{}),course_scope:courseKey,primary_unit:mapping.unit,primary_topic:lessonKey,primary_topic_title:lessonTitle,topic:lessonKey,topic_title:lessonTitle,ib_unit:courseKey==="ib-math-ai"?mapping.unit:question.classification?.ib_unit,ib_lesson:courseKey==="ib-math-ai"?lessonKey:question.classification?.ib_lesson,ib_lesson_title:courseKey==="ib-math-ai"?lessonTitle:question.classification?.ib_lesson_title,ap_unit:question.classification?.ap_unit??mapping.unit,ap_topic:question.classification?.ap_topic||lessonKey,ap_topic_title:question.classification?.ap_topic_title||lessonTitle,mapping_verified:true,mapping_basis:mapping.basis||"verified-private-package"};
    question.skill_key=mapping.skill_key||question.skill_key;question.skill_keys=[...new Set([mapping.skill_key,...(question.skill_keys||[])].filter(Boolean))];question.trust_tier=row?.trust_tier||question.trust?.tier||"publisher_key_direct";question.metadata={...(question.metadata||{}),student_ready:true,verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};
    const note=disclosure(question),prompt=String(question.prompt_html||"");if(!prompt.includes("sourceKeyNotice"))question.prompt_html=`<div class="notice sourceKeyNotice"><strong>${note.title}</strong> · ${note.text}</div>${prompt}`;question._private_bank=true;return question;
  }

  const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  async function requestPage({courseKey,offset=0,limit=500,lessonKey="",unit=""}={}){
    const query=new URLSearchParams({course:courseKey,limit:String(limit),offset:String(offset)});if(lessonKey)query.set("lesson",lessonKey);if(unit!==""&&Number.isFinite(Number(unit)))query.set("unit",String(unit));let lastError;
    for(let attempt=0;attempt<4;attempt+=1){try{return await ECHSInstitution.api("private-bank-api",`/student-questions?${query}`)}catch(error){lastError=error;if(attempt<3)await wait(750*(attempt+1));}}
    throw lastError;
  }
  function emitProgress(completed,total){if(typeof window.dispatchEvent!=="function"||typeof CustomEvent!=="function")return;window.dispatchEvent(new CustomEvent("echs:bundle-progress",{detail:{completed,total}}))}
  function emitSummary(detail){if(typeof window.dispatchEvent!=="function"||typeof CustomEvent!=="function")return;window.dispatchEvent(new CustomEvent("echs:private-bank-summary",{detail}))}

  async function collect(scope,onTotal){
    const pageSize=500,maximum=10000,probe=await requestPage({...scope,offset:0,limit:1}),total=Math.max(0,Number(probe?.total||0));
    if(typeof onTotal==="function")onTotal(total);emitSummary({course:scope.courseKey,total,completed:0,pages:total?Math.ceil(Math.min(total,maximum)/pageSize):0,bankCodes:[]});
    if(!total)return{rows:[],total:0};
    const target=Math.min(total,maximum),pageCount=Math.ceil(target/pageSize),rows=[],bankCodes=new Set();
    for(let index=0;index<pageCount;index+=1){
      const offset=index*pageSize,page=await requestPage({...scope,offset,limit:Math.min(pageSize,target-offset)}),items=[...(page?.questions||[])];
      rows.push(...items);items.forEach(item=>{const code=item?.payload?.bank_code||item?.bank_code;if(code)bankCodes.add(String(code))});emitProgress(index+1,pageCount);emitSummary({course:scope.courseKey,total,completed:index+1,pages:pageCount,loaded:rows.length,bankCodes:[...bankCodes]});
      if(!items.length)break;
    }
    if(total>maximum)console.warn(`Private practice capped at ${maximum} of ${total} questions for ${scope.courseKey}`);if(rows.length<target)console.warn(`Private practice received ${rows.length} of ${target} requested rows for ${scope.courseKey}`);return{rows:rows.slice(0,target),total};
  }

  async function privateRows(source,onTotal){
    const courseKey=sourceCourse(source);activeCourse=courseKey||activeCourse;const lessonKey=requestedLesson,unit=sourceUnit(source,lessonKey);if(!supported.has(courseKey)||!window.ECHSInstitution?.api)return{questions:[],total:0};
    const access=await resolvedAccess();let result={rows:[],total:0};if(lessonKey){result=await collect({courseKey,lessonKey},onTotal);if(!result.rows.length&&courseKey==="ap-calculus"&&unit!=="")result=await collect({courseKey,unit},onTotal)}else if(staff(access)){result=unit!==""?await collect({courseKey,unit},onTotal):await collect({courseKey},onTotal)}
    const seen=new Set(),questions=result.rows.map(row=>normalise(row,courseKey)).filter(question=>{if(!question)return false;const fingerprint=question.source?.source_content_fingerprint||question.metadata?.source_content_fingerprint||question.id,key=`${courseKey}|${fingerprint}`;if(seen.has(key))return false;seen.add(key);return true});return{questions,total:result.total};
  }
  function mergeUnique(courseKey,groups){const seen=new Set(),out=[];groups.flat().forEach(question=>{if(!question?.id)return;const fingerprint=question.source?.source_content_fingerprint||question.metadata?.source_content_fingerprint||question.id,key=`${courseKey}|${fingerprint}`;if(seen.has(key))return;seen.add(key);out.push(question)});return out}
  function updateIBCourseOption(source,count,state="ready"){if(activeCourse!=="ib-math-ai")return;source.private_bank_only=true;source.count=count;source.bank_counts={};const select=document.getElementById("bundle"),option=select?[...select.options].find(item=>item.value===String(source?.id||"")):null;if(option){const formatted=Number(count||0).toLocaleString(),suffix=state==="error"?"connection unavailable":state==="loading"?(count?`${formatted} uploaded questions · loading…`:"checking uploaded banks…"):`${formatted} uploaded questions`;option.textContent=`IB Math AI · Uploaded Banks (${suffix})`;}document.documentElement.dataset.ibCourseBankSource="private-upload-manager";document.documentElement.dataset.ibCourseBankCount=String(count||0);document.documentElement.dataset.ibCourseBankState=state}

  function install(){
    if(!window.ECHSBank||!window.ECHSLearning)return setTimeout(install,40);const originalLoad=ECHSBank.loadBundle.bind(ECHSBank);
    ECHSBank.loadBundle=async source=>{activeCourse=sourceCourse(source);if(activeCourse==="ib-math-ai"){updateIBCourseOption(source,0,"loading");try{const result=await privateRows(source,total=>updateIBCourseOption(source,total,"loading"));updateIBCourseOption(source,result.total,"ready");document.documentElement.dataset.privateLessonBanks=requestedLesson?"direct-lesson":"private-course";document.documentElement.dataset.privateLessonKey=requestedLesson||"course-browser";document.documentElement.dataset.privateQuestionRows=String(result.questions.length);return mergeUnique(activeCourse,[result.questions])}catch(error){console.error("Uploaded IB private banks could not be loaded",error);updateIBCourseOption(source,0,"error");if(requestedLesson)return[];throw new Error("Uploaded IB Mathematics AI banks are temporarily unavailable. The AP Calculus fallback banks were intentionally blocked.")}}
      const[base,result]=await Promise.all([originalLoad(source),privateRows(source).catch(error=>{console.warn("Direct private practice unavailable",error);return{questions:[],total:0}})]);return mergeUnique(activeCourse,[base,result.questions]);};
    const originalLabel=ECHSBank.bankLabel.bind(ECHSBank);ECHSBank.bankLabel=code=>activeCourse==="ib-math-ai"?dynamicLabels.get(code)||neutralIBLabel(code):dynamicLabels.get(code)||labels[activeCourse]?.[code]||originalLabel(code);
    const originalRecord=ECHSLearning.recordAttempt.bind(ECHSLearning);ECHSLearning.recordAttempt=payload=>{const result=originalRecord(payload),question=payload?.question;if(result&&question?._private_bank){const rows=JSON.parse(localStorage.getItem("echs_learning_events_v2")||"[]"),index=rows.findIndex(row=>row.id===result.id);if(index>=0){rows[index]={...rows[index],skill_key:question.skill_key,trust_tier:question.trust_tier||"publisher_key_direct",representation:"publisher-source",verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};localStorage.setItem("echs_learning_events_v2",JSON.stringify(rows));}}return result;};
    document.documentElement.dataset.privateBankAdapter="ready";
  }
  install();
})();
