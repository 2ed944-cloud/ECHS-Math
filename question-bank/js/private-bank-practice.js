/* Merge authenticated private banks into lesson, unit, and staff course practice. */
(function(){
  "use strict";

  const params=new URLSearchParams(location.search);
  const from=params.get("from")||"";
  const inferred=from.match(/(?:^|[:/_-])((?:\d+\.\d+)|(?:u\d+-[a-z0-9_-]+)|(?:APCALC-[A-Z0-9-]+))$/i)?.[1]||"";
  const requestedLesson=params.get("topic")||params.get("lesson")||inferred;
  const requestedUnit=params.get("unit")||"";
  const supported=new Set(["ap-precalculus","ib-math-ai","ap-calculus","algebra-2","grade-9"]);
  const ibLessonUnits=new Map([
    ["u0-readiness",0],
    ["u1-number",1],["u1-algebra",1],["u1-sequences",1],["u1-matrices",1],["u1-modeling",1],
    ["u2-concept",2],["u2-linear_quadratic",2],["u2-poly_rational",2],["u2-exp_log",2],["u2-transform",2],["u2-regression",2],
    ["u3-coordinate",3],["u3-trig",3],["u3-conics",3],["u3-vectors",3],["u3-polar",3],
    ["u4-data",4],["u4-probability",4],["u4-distributions",4],["u4-correlation",4],["u4-inference",4],
    ["u5-change",5],["u5-derivative",5],["u5-integral",5],["u5-optimization",5],
    ...Array.from({length:8},(_,index)=>[`1.${index+1}`,1]),
    ...Array.from({length:6},(_,index)=>[`2.${index+1}`,2]),
    ...Array.from({length:5},(_,index)=>[`3.${index+1}`,3]),
    ...Array.from({length:5},(_,index)=>[`4.${index+1}`,4]),
    ...Array.from({length:4},(_,index)=>[`5.${index+1}`,5])
  ]);
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
    const lessonKey=String(mapping.lesson_key||""),lessonTitle=String(mapping.lesson_title||lessonKey),mappedUnit=Number(mapping.unit);
    if(courseKey==="ib-math-ai"&&(ibLessonUnits.get(lessonKey)!==mappedUnit||mapping.mapping_verified!==true))return null;
    question.classification={...(question.classification||{}),course_scope:courseKey,primary_unit:mapping.unit,primary_topic:lessonKey,primary_topic_title:lessonTitle,topic:lessonKey,topic_title:lessonTitle,ib_unit:courseKey==="ib-math-ai"?mapping.unit:question.classification?.ib_unit,ib_lesson:courseKey==="ib-math-ai"?lessonKey:question.classification?.ib_lesson,ib_lesson_title:courseKey==="ib-math-ai"?lessonTitle:question.classification?.ib_lesson_title,ap_unit:question.classification?.ap_unit??mapping.unit,ap_topic:question.classification?.ap_topic||lessonKey,ap_topic_title:question.classification?.ap_topic_title||lessonTitle,mapping_verified:true,mapping_basis:mapping.basis||"verified-private-package"};
    question.skill_key=mapping.skill_key||question.skill_key;question.skill_keys=[...new Set([mapping.skill_key,...(question.skill_keys||[])].filter(Boolean))];question.trust_tier=row?.trust_tier||question.trust?.tier||"publisher_key_direct";question.metadata={...(question.metadata||{}),student_ready:true,verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};
    const note=disclosure(question),prompt=String(question.prompt_html||"");if(!prompt.includes("sourceKeyNotice"))question.prompt_html=`<div class="notice sourceKeyNotice"><strong>${note.title}</strong> · ${note.text}</div>${prompt}`;question._private_bank=true;return question;
  }

  const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  const rangeExhausted=error=>/range not satisfiable|requested range/i.test(String(error?.message||error||""));
  async function requestPage({courseKey,offset=0,limit=200,lessonKey="",unit=""}={}){
    const query=new URLSearchParams({course:courseKey,limit:String(limit),offset:String(offset)});if(lessonKey)query.set("lesson",lessonKey);if(unit!==""&&Number.isFinite(Number(unit)))query.set("unit",String(unit));let lastError;
    for(let attempt=0;attempt<5;attempt+=1){
      try{return await window.ECHSInstitution.api("private-bank-api",`/student-questions?${query}`)}
      catch(error){if(rangeExhausted(error))return{total:offset,questions:[],range_exhausted:true};lastError=error;if(attempt<4)await wait(900*(attempt+1));}
    }
    throw lastError;
  }
  function emit(name,detail){if(typeof window.dispatchEvent!=="function"||typeof CustomEvent!=="function")return;window.dispatchEvent(new CustomEvent(name,{detail}))}
  function emitProgress(completed,total){emit("echs:bundle-progress",{completed,total})}
  const escapeHTML=value=>window.ECHSBank?.escape?.(value)||String(value||"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  function updateSelect(select,options,allLabel,labelFor){if(!select)return;const wanted=select.value||"all";select.innerHTML=`<option value="all">${escapeHTML(allLabel)}</option>`+options.map(value=>`<option value="${escapeHTML(value)}">${escapeHTML(labelFor(value))}</option>`).join("");select.value=options.includes(wanted)?wanted:"all"}
  function refreshInventory(detail){
    if(detail.course!=="ib-math-ai"||!Array.isArray(detail.questions))return;
    const questions=detail.questions,loaded=Number(detail.loaded??questions.length),total=Number(detail.total??loaded),complete=detail.complete===true;
    const heroLoaded=document.getElementById("heroLoaded"),heroBanks=document.getElementById("heroBanks"),status=document.getElementById("status"),shell=document.getElementById("shell");
    if(heroLoaded)heroLoaded.textContent=Number(loaded).toLocaleString();
    const banks=[...new Set(questions.map(question=>question?.bank_code).filter(Boolean))].sort();if(heroBanks)heroBanks.textContent=Number(banks.length).toLocaleString();updateSelect(document.getElementById("bank"),banks,"All ECHS banks",code=>window.ECHSBank?.bankLabel?.(code)||code);
    const sections=new Map();questions.forEach(question=>{const value=String(question?.source?.section||"unmapped"),title=question?.source?.section_title||question?.source?.skill_title||"";sections.set(value,value==="unmapped"?"General practice":`${value}${title?` · ${title}`:""}`)});const sectionValues=[...sections.keys()].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));updateSelect(document.getElementById("section"),sectionValues,"All practice sections",value=>window.ECHSBank?.cleanStudentLabel?.(sections.get(value))||sections.get(value));
    document.documentElement.dataset.ibCourseBankLoaded=String(loaded);document.documentElement.dataset.privateQuestionRows=String(loaded);if(!status||shell?.querySelector(".questionCard,.result"))return;
    const blocked=Number(detail.blocked||0),formatted=Number(loaded).toLocaleString();
    if(detail.partialError)status.innerHTML=`<span class="pill gold">${formatted} questions ready</span><span class="pill">Background loading will retry after refresh</span>`;
    else if(complete)status.innerHTML=`<span class="pill teal">${formatted} questions available</span>${blocked?`<span class="pill gold">${Number(blocked).toLocaleString()} non-catalog mappings withheld</span>`:""}`;
    else status.innerHTML=`<span class="pill teal">${formatted} questions ready now</span><span class="pill">Loading ${Number(total).toLocaleString()} mapped questions in the background…</span>`;
  }
  function emitSummary(detail){refreshInventory(detail);emit("echs:private-bank-summary",detail)}
  function fingerprint(question,courseKey){return`${courseKey}|${question.source?.source_content_fingerprint||question.metadata?.source_content_fingerprint||question.id}`}
  function addRows(rows,courseKey,questions,seen,bankCodes){
    let blocked=0,added=0;
    for(const row of rows){const question=normalise(row,courseKey);if(!question){blocked+=1;continue}const key=fingerprint(question,courseKey);if(seen.has(key))continue;seen.add(key);questions.push(question);added+=1;if(question.bank_code)bankCodes.add(String(question.bank_code));}
    return{blocked,added};
  }

  async function collect(scope,onTotal,{stream=false}={}){
    const pageSize=200,maximum=10000,probe=await requestPage({...scope,offset:0,limit:1});let liveTotal=Math.max(0,Number(probe?.total||0));
    if(typeof onTotal==="function")onTotal(liveTotal);
    if(!liveTotal){emitSummary({course:scope.courseKey,total:0,loaded:0,completed:0,pages:0,complete:true,questions:[],bankCodes:[],blocked:0});return{questions:[],total:0,stream:null}}
    const questions=[],seen=new Set(),bankCodes=new Set();let completed=0,blocked=0,nextOffset=0,done=false;
    const target=()=>Math.min(liveTotal,maximum);
    const loadNext=async()=>{
      if(nextOffset>=target()){done=true;return 0}
      const requested=Math.min(pageSize,Math.max(1,target()-nextOffset)),page=await requestPage({...scope,offset:nextOffset,limit:requested});
      const reported=Number(page?.total);if(Number.isFinite(reported)&&reported>=0){liveTotal=reported;if(typeof onTotal==="function")onTotal(liveTotal)}
      if(page?.range_exhausted||nextOffset>=target()){done=true;emitSummary({course:scope.courseKey,total:target(),loaded:questions.length,completed,pages:completed,complete:true,questions,bankCodes:[...bankCodes],blocked});return 0}
      const items=[...(page?.questions||[])],result=addRows(items,scope.courseKey,questions,seen,bankCodes);blocked+=result.blocked;nextOffset+=items.length;completed+=1;
      done=!items.length||items.length<requested||nextOffset>=target();const pages=Math.max(completed,Math.ceil(Math.max(target(),nextOffset)/pageSize));emitProgress(completed,pages);emitSummary({course:scope.courseKey,total:target(),loaded:questions.length,completed,pages,complete:done,questions,bankCodes:[...bankCodes],blocked});return items.length;
    };
    await loadNext();
    if(done)return{questions,total:target(),stream:null};
    if(!stream){while(!done)await loadNext();if(liveTotal>maximum)console.warn(`Private practice capped at ${maximum} of ${liveTotal} questions for ${scope.courseKey}`);return{questions,total:target(),stream:null}}
    const background=(async()=>{while(!done)await loadNext();if(liveTotal>maximum)console.warn(`Private practice capped at ${maximum} of ${liveTotal} questions for ${scope.courseKey}`);return{eligible:questions.length,total:target(),blocked}})();
    return{questions,total:target(),stream:background};
  }

  async function privateRows(source,onTotal){
    const courseKey=sourceCourse(source);activeCourse=courseKey||activeCourse;const lessonKey=requestedLesson,unit=sourceUnit(source,lessonKey);if(!supported.has(courseKey)||!window.ECHSInstitution?.api)return{questions:[],total:0,stream:null};
    const access=await resolvedAccess();let result={questions:[],total:0,stream:null};
    if(lessonKey){result=await collect({courseKey,lessonKey},onTotal);if(!result.questions.length&&courseKey==="ap-calculus"&&unit!=="")result=await collect({courseKey,unit},onTotal)}
    else if(staff(access)){result=unit!==""?await collect({courseKey,unit},onTotal):await collect({courseKey},onTotal,{stream:courseKey==="ib-math-ai"})}
    return result;
  }
  function mergeUnique(courseKey,groups){const seen=new Set(),out=[];groups.flat().forEach(question=>{if(!question?.id)return;const key=fingerprint(question,courseKey);if(seen.has(key))return;seen.add(key);out.push(question)});return out}
  function updateIBCourseOption(source,count,state="ready",loadedCount=0){
    if(activeCourse!=="ib-math-ai")return;source.private_bank_only=true;source.count=count;source.bank_counts={};const select=document.getElementById("bundle"),option=select?[...select.options].find(item=>item.value===String(source?.id||"")):null;
    if(option){const formatted=Number(count||0).toLocaleString(),loaded=Number(loadedCount||0).toLocaleString(),suffix=state==="error"?"connection unavailable":state==="streaming"?`${loaded} of ${formatted} ready`:state==="loading"?(count?`${formatted} uploaded questions · preparing…`:"checking uploaded banks…"):`${formatted} uploaded questions`;option.textContent=`IB Math AI · Uploaded Banks (${suffix})`;}
    document.documentElement.dataset.ibCourseBankSource="private-upload-manager";document.documentElement.dataset.ibCourseBankCount=String(count||0);document.documentElement.dataset.ibCourseBankLoaded=String(loadedCount||0);document.documentElement.dataset.ibCourseBankState=state;
  }

  function install(){
    if(!window.ECHSBank||!window.ECHSLearning)return setTimeout(install,40);const originalLoad=ECHSBank.loadBundle.bind(ECHSBank);
    ECHSBank.loadBundle=async source=>{
      activeCourse=sourceCourse(source);
      // Curated skill bundles remain available and can merge released Manager rows.
      if(source&&source.echs_curated_skill){
        const[base,result]=await Promise.all([
          originalLoad(source),
          privateRows(source).catch(error=>{console.warn("Direct private practice unavailable",error);return{questions:[],total:0,stream:null}})
        ]);
        return mergeUnique(activeCourse,[base,result.questions]);
      }
      if(activeCourse==="ib-math-ai"){
        updateIBCourseOption(source,0,"loading");
        try{
          const result=await privateRows(source,total=>updateIBCourseOption(source,total,"loading"));
          const streaming=Boolean(result.stream);updateIBCourseOption(source,result.total,streaming?"streaming":"ready",result.questions.length);
          document.documentElement.dataset.privateLessonBanks=requestedLesson?"direct-lesson":"private-course";document.documentElement.dataset.privateLessonKey=requestedLesson||"course-browser";document.documentElement.dataset.privateQuestionRows=String(result.questions.length);
          if(result.stream)result.stream.then(final=>{const eligible=Number(final?.eligible||result.questions.length);updateIBCourseOption(source,eligible,"ready",eligible);document.documentElement.dataset.privateQuestionRows=String(eligible);emitSummary({course:activeCourse,total:eligible,loaded:eligible,complete:true,questions:result.questions,bankCodes:[...new Set(result.questions.map(question=>question.bank_code).filter(Boolean))],blocked:Number(final?.blocked||0)})}).catch(error=>{console.warn("IB background question loading paused",error);updateIBCourseOption(source,result.total,"streaming",result.questions.length);emitSummary({course:activeCourse,total:result.total,loaded:result.questions.length,complete:false,partialError:true,questions:result.questions,bankCodes:[...new Set(result.questions.map(question=>question.bank_code).filter(Boolean))]})});
          return result.questions;
        }catch(error){console.error("Uploaded IB private banks could not be loaded",error);updateIBCourseOption(source,0,"error");if(requestedLesson)return[];throw new Error("Uploaded IB Mathematics AI banks are temporarily unavailable. The AP Calculus fallback banks were intentionally blocked.")}
      }
      const[base,result]=await Promise.all([originalLoad(source),privateRows(source).catch(error=>{console.warn("Direct private practice unavailable",error);return{questions:[],total:0,stream:null}})]);return mergeUnique(activeCourse,[base,result.questions]);
    };
    const originalLabel=ECHSBank.bankLabel.bind(ECHSBank);ECHSBank.bankLabel=code=>activeCourse==="ib-math-ai"?dynamicLabels.get(code)||neutralIBLabel(code):dynamicLabels.get(code)||labels[activeCourse]?.[code]||originalLabel(code);
    const originalRecord=ECHSLearning.recordAttempt.bind(ECHSLearning);ECHSLearning.recordAttempt=payload=>{const result=originalRecord(payload),question=payload?.question;if(result&&question?._private_bank){const rows=JSON.parse(localStorage.getItem("echs_learning_events_v2")||"[]"),index=rows.findIndex(row=>row.id===result.id);if(index>=0){rows[index]={...rows[index],skill_key:question.skill_key,trust_tier:question.trust_tier||"publisher_key_direct",representation:"publisher-source",verification_basis:question.metadata?.verification_basis||"publisher-answer-key"};localStorage.setItem("echs_learning_events_v2",JSON.stringify(rows));}}return result;};
    document.documentElement.dataset.privateBankAdapter="ready";
  }
  install();
})();
