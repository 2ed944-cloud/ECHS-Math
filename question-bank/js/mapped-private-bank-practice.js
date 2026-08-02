/* Authenticated private-bank adapter with strict course and target mappings. */
(function(){
  "use strict";
  const params=new URLSearchParams(location.search);
  const READY=new Set(["publisher_key_direct","student_ready_verified"]);
  const dynamicLabels=new Map();let activeCourse="";
  const normalise=value=>window.ECHSPortalAccess?.normaliseCourseKey?.(value||"")||String(value||"");
  const sourceCourse=source=>normalise(source?.course_key||source?.course||params.get("course")||"");
  const sourceLesson=source=>String(source?.topic||source?.lesson_key||params.get("topic")||params.get("lesson")||"").trim();
  const sourceUnit=(source,lesson)=>{const value=source?.unit??source?.course_unit??params.get("unit")??"";if(value!==""&&Number.isFinite(Number(value)))return Number(value);const m=String(lesson||"").match(/^(\d+)\./);return m?Number(m[1]):"";};
  const resolvedAccess=async()=>{try{return await window.ECHSPortalAccess?.ready;}catch{return window.ECHSPortalAccess?.current||null;}};
  const staff=access=>["teacher","admin"].includes(access?.role||window.ECHSPortalAccess?.current?.role||"");
  const courseLabel=course=>window.ECHSLearning?.COURSE_LABELS?.[course]||String(course||"Course").replaceAll("-"," ");
  const labelFor=(code,course=activeCourse)=>{if(!code)return`${courseLabel(course)} Bank`;if(!dynamicLabels.has(code))dynamicLabels.set(code,`${courseLabel(course)} · ${code}`);return dynamicLabels.get(code);};
  const fingerprint=q=>q?.source?.source_content_fingerprint||q?.metadata?.source_content_fingerprint||q?.id;
  const dispatch=(type,detail)=>window.dispatchEvent?.(new CustomEvent(type,{detail}));
  const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));

  function selectMapping(mappings,course,{lesson="",unit=""}={}){
    const rows=(mappings||[]).filter(row=>normalise(row?.course)===course);
    if(lesson){const exact=rows.find(row=>String(row?.lesson_key||"")===String(lesson));if(exact)return exact;}
    if(unit!==""){const exact=rows.find(row=>String(row?.unit??"")===String(unit));if(exact)return exact;}
    return rows[0]||null;
  }
  function normaliseRow(row,course,scope,{allowAll=false}={}){
    const question={...(row?.payload||{})};question.bank_code=question.bank_code||row?.bank_code||"";
    const rowMappings=Array.isArray(row?.course_mappings)?row.course_mappings:[],payloadMappings=Array.isArray(question.course_mappings)?question.course_mappings:[],mappings=rowMappings.length?rowMappings:payloadMappings;
    const mapping=selectMapping(mappings,course,scope);if(!mapping)return null;question.course_mappings=mappings;
    const mappedCourses=[...new Set(mappings.map(item=>normalise(item?.course)).filter(Boolean))],dedicated=mappedCourses.length===1&&mappedCourses[0]===course;
    const lesson=String(mapping.lesson_key||""),title=String(mapping.lesson_title||lesson||"Mapped practice"),unit=Number(mapping.unit);
    const trust=String(row?.trust_tier||question.trust?.tier||"publisher_key_direct"),mapped=row?.mapping_verified!==false&&mapping.mapping_verified!==false,visible=row?.student_visible!==false;
    const exactRoute=unit>=1&&Boolean(lesson)&&Boolean(title),studentReady=visible&&mapped&&READY.has(trust)&&exactRoute&&dedicated;
    if(!studentReady&&!allowAll)return null;
    const aliases=question.display_bank_aliases||{},visibleName=aliases.student||aliases[course]||aliases.teacher||labelFor(question.bank_code,course);
    if(question.bank_code&&visibleName)dynamicLabels.set(question.bank_code,visibleName);
    question.classification={...(question.classification||{}),course_scope:course,primary_unit:mapping.unit,primary_topic:lesson,primary_topic_title:title,topic:lesson,topic_title:title,mapping_verified:mapped,mapping_basis:mapping.basis||"verified-private-package"};
    if(course==="ib-math-ai")Object.assign(question.classification,{ib_unit:mapping.unit,ib_lesson:lesson,ib_lesson_title:title});
    if(["ap-calculus","ap-precalculus"].includes(course))Object.assign(question.classification,{ap_unit:mapping.unit,ap_topic:lesson,ap_topic_title:title});
    question.skill_key=mapping.skill_key||question.skill_key;question.skill_keys=[...new Set([mapping.skill_key,...(question.skill_keys||[])].filter(Boolean))];question.trust_tier=trust;
    question.metadata={...(question.metadata||{}),student_ready:studentReady,alignment_status:studentReady?"student-ready":"staff-review",dedicated_course_mapping:dedicated,staff_review_only:!studentReady};
    // Trust and mapping metadata remain available to the platform, but the
    // internal source-key disclosure does not belong inside the student prompt.
    // Strip older persisted copies as well as avoiding any new injection.
    question.prompt_html=String(question.prompt_html||"").replace(/<div\b[^>]*\bsourceKeyNotice\b[^>]*>[\s\S]*?<\/div>/gi,"");
    question._private_bank=true;question._staff_only=!studentReady;return question;
  }
  function queryFor(scope,offset,limit){
    const query=new URLSearchParams({course:scope.course,offset:String(offset),limit:String(limit)});if(scope.bank)query.set("bank",scope.bank);if(scope.lesson)query.set("lesson",scope.lesson);if(scope.unit!=="")query.set("unit",String(scope.unit));return query;
  }
  async function strictRequest(scope,offset,limit){
    const query=queryFor(scope,offset,limit);query.set("view",scope.view);return await window.ECHSInstitution.api("practice-bank-api",`/questions?${query}`);
  }
  async function protectedCompatibilityRequest(scope,offset,limit){
    const query=queryFor(scope,offset,limit);const result=await window.ECHSInstitution.api("private-bank-api",`/student-questions?${query}`);return{...result,compatibility_fallback:true};
  }
  async function request(scope,offset,limit){
    let lastError;const access=await resolvedAccess(),staffAccess=staff(access),attempts=staffAccess?2:4;
    for(let attempt=0;attempt<attempts;attempt++){
      try{return await strictRequest(scope,offset,limit);}
      catch(error){lastError=error;if(attempt<attempts-1)await wait(500*(attempt+1));}
    }
    if(staffAccess){
      try{return await protectedCompatibilityRequest(scope,offset,limit);}
      catch(error){lastError=error;}
    }
    throw lastError;
  }
  async function collect(scope,requestKey){
    const pageSize=1500,maximum=20000,questions=[],seen=new Set();let blocked=0,fallback=false;
    const probe=await request(scope,0,1);fallback=Boolean(probe?.compatibility_fallback);const reported=Math.max(0,Number(probe?.total||0)),total=Math.min(reported,maximum);
    if(!total){dispatch("echs:private-bank-summary",{requestKey,course:scope.course,total:0,loaded:0,complete:true,questions,blocked,view:scope.view,fallback,transport:fallback?"protected-compatibility":"strict-api"});return{questions,fallback};}
    const offsets=[];for(let offset=0;offset<total;offset+=pageSize)offsets.push(offset);
    let cursor=0,completed=0;
    const worker=async()=>{
      while(cursor<offsets.length){
        const index=cursor++,offset=offsets[index],page=await request(scope,offset,Math.min(pageSize,total-offset)),items=[...(page?.questions||[])];fallback=fallback||Boolean(page?.compatibility_fallback);
        for(const row of items){const q=normaliseRow(row,scope.course,scope,{allowAll:scope.view==="all"||fallback});if(!q){blocked++;continue;}const key=`${scope.course}|${fingerprint(q)}`;if(!seen.has(key)){seen.add(key);questions.push(q);}}
        completed++;
        dispatch("echs:bundle-progress",{completed,total:offsets.length});
        dispatch("echs:private-bank-summary",{requestKey,course:scope.course,total,loaded:questions.length,complete:completed===offsets.length,questions,blocked,view:scope.view,fallback,transport:fallback?"protected-compatibility":"strict-api"});
      }
    };
    await Promise.all(Array.from({length:Math.min(3,offsets.length)},worker));
    return{questions,fallback};
  }
  function merge(course,groups){const out=[],seen=new Set();groups.flat().forEach(q=>{if(!q?.id)return;const key=`${course}|${fingerprint(q)}`;if(!seen.has(key)){seen.add(key);out.push(q);}});return out;}
  function install(){
    if(!window.ECHSBank||!window.ECHSLearning||!window.ECHSInstitution?.api)return setTimeout(install,40);
    const originalLoad=ECHSBank.loadBundle.bind(ECHSBank),originalLabel=ECHSBank.bankLabel.bind(ECHSBank),originalRecord=ECHSLearning.recordAttempt.bind(ECHSLearning);
    ECHSBank.loadBundle=async source=>{
      activeCourse=sourceCourse(source);const lesson=sourceLesson(source),unit=sourceUnit(source,lesson),access=await resolvedAccess(),view=staff(access)&&source?.staff_view_all===true?"all":"ready",requestKey=String(source?.id||`${activeCourse}:${unit}:${lesson}:${view}`);
      if(!activeCourse)return originalLoad(source);
      const scope={course:activeCourse,bank:String(source?.bank_code||""),lesson,unit,view};
      try{
        const [base,direct]=await Promise.all([source?.private_bank_only?Promise.resolve([]):originalLoad(source),collect(scope,requestKey)]),rows=merge(activeCourse,[base,direct.questions]);
        document.documentElement.dataset.practiceBankTransport=direct.fallback?"protected-compatibility":"strict-api";
        return rows;
      }catch(error){console.error("Mapped private practice could not be loaded",error);if(source?.private_bank_only)return[];return originalLoad(source);}
    };
    ECHSBank.bankLabel=(code,course)=>{const fallback=originalLabel(code,course);return dynamicLabels.get(code)||(fallback&&fallback!=="ECHS Practice Bank"?fallback:labelFor(code,normalise(course||activeCourse)));};
    ECHSLearning.recordAttempt=payload=>{const result=originalRecord(payload),q=payload?.question;if(result&&q?._private_bank){try{const rows=JSON.parse(localStorage.getItem("echs_learning_events_v2")||"[]"),index=rows.findIndex(row=>row.id===result.id);if(index>=0){rows[index]={...rows[index],skill_key:q.skill_key,trust_tier:q.trust_tier||"publisher_key_direct",representation:"publisher-source",verification_basis:q.metadata?.alignment_status||"mapped-private-bank",staff_review_only:Boolean(q._staff_only)};localStorage.setItem("echs_learning_events_v2",JSON.stringify(rows));}}catch{}}return result;};
    document.documentElement.dataset.privateBankAdapter="ready";
  }
  install();
})();
