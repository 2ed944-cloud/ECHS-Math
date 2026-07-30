/* Harden the legacy bank engine with explicit course, unit, and lesson scopes. */
(function(){
  "use strict";
  function install(){
    if(!window.ECHSBank)return setTimeout(install,40);
    if(document.documentElement.dataset.practiceCourseIsolation==="ready")return;
    const bank=window.ECHSBank;
    const normalise=value=>window.ECHSPortalAccess?.normaliseCourseKey?.(value||"")||String(value||"").trim().toLowerCase();
    const mappings=question=>Array.isArray(question?.course_mappings)?question.course_mappings:[];
    const questionCourse=question=>{
      const classification=question?.classification||{};
      const direct=normalise(classification.course_scope||classification.course||question?.metadata?.course_key||question?.course_key||"");
      if(direct)return direct;
      const mapped=mappings(question).map(item=>normalise(item?.course)).find(Boolean);
      if(mapped)return mapped;
      if(["PCALRT5S","CAF5S"].includes(question?.bank_code))return"ap-precalculus";
      if(["CALCT3BC","ADAMS10","PEARSON_CH0"].includes(question?.bank_code))return"ap-calculus";
      return"";
    };
    const questionUnit=question=>{
      const c=question?.classification||{},course=questionCourse(question);
      const mapping=mappings(question).find(item=>normalise(item?.course)===course);
      const value=c.primary_unit??c.ib_unit??c.ap_unit??mapping?.unit??question?.unit;
      return value==null||value===""?"":String(value);
    };
    const questionTopic=question=>{
      const c=question?.classification||{},course=questionCourse(question);
      const mapping=mappings(question).find(item=>normalise(item?.course)===course);
      return String(c.primary_topic??c.topic??c.ib_lesson??c.ap_topic??mapping?.lesson_key??question?.topic??"");
    };
    const scopeQuestion=(question,row={})=>{
      if(!question||!row)return question;
      const course=normalise(row.course_key||row.course||"");
      if(!course)return question;
      const classification={...(question.classification||{})};
      const unit=row.unit??row.course_unit??classification.primary_unit??classification.ib_unit??classification.ap_unit??"";
      const topic=row.topic??row.lesson_key??classification.primary_topic??classification.topic??classification.ib_lesson??classification.ap_topic??"";
      const title=row.topic_title??row.lesson_title??classification.primary_topic_title??classification.topic_title??classification.ib_lesson_title??classification.ap_topic_title??"";
      classification.course_scope=course;
      if(unit!==""){
        classification.primary_unit=unit;
        if(course==="ib-math-ai")classification.ib_unit=unit;
        if(["ap-calculus","ap-precalculus"].includes(course))classification.ap_unit=unit;
      }
      if(topic!==""){
        classification.primary_topic=String(topic);classification.topic=String(topic);
        if(course==="ib-math-ai")classification.ib_lesson=String(topic);
        if(["ap-calculus","ap-precalculus"].includes(course))classification.ap_topic=String(topic);
      }
      if(title){
        classification.primary_topic_title=String(title);classification.topic_title=String(title);
        if(course==="ib-math-ai")classification.ib_lesson_title=String(title);
        if(["ap-calculus","ap-precalculus"].includes(course))classification.ap_topic_title=String(title);
      }
      classification.mapping_basis=classification.mapping_basis||"catalog-bundle-scope";
      const current=mappings(question);
      const courseMappings=current.some(item=>normalise(item?.course)===course)?current:[...current,{course,unit:unit===""?null:Number.isFinite(Number(unit))?Number(unit):unit,lesson_key:topic?String(topic):"",lesson_title:title?String(title):"",mapping_verified:true,basis:"catalog-bundle-scope"}];
      return{...question,course_mappings:courseMappings,classification,metadata:{...(question.metadata||{}),bundle_course_scope:course,bundle_unit_scope:unit,bundle_topic_scope:topic},_bundle_scope:{course,unit:unit===""?null:unit,topic:topic||null,bundle_id:row.id||null}};
    };
    const courseCompatible=(question,course)=>!normalise(course||"")||questionCourse(question)===normalise(course);
    const mappingCompatible=(question,{course="",unit="",topic=""}={})=>{
      if(course&&!courseCompatible(question,course))return false;
      if(unit!==""&&unit!=null&&questionUnit(question)!==String(unit))return false;
      if(topic!==""&&topic!=null&&questionTopic(question)!==String(topic))return false;
      return true;
    };

    bank.normaliseCourse=normalise;
    bank.questionMappings=mappings;
    bank.questionCourse=questionCourse;
    bank.questionUnit=questionUnit;
    bank.questionTopic=questionTopic;
    bank.scopeQuestion=scopeQuestion;
    bank.courseCompatible=courseCompatible;
    bank.mappingCompatible=mappingCompatible;

    const originalLoad=bank.loadBundle.bind(bank);
    bank.loadBundle=async source=>{
      const row=typeof source==="string"?{file:source}:source;
      const rows=await originalLoad(source);
      const scoped=row?.course_key?rows.map(question=>scopeQuestion(question,row)).filter(question=>courseCompatible(question,row.course_key)):rows;
      return row?.questionFilter?scoped.filter(question=>bank.matchesQuestionFilter(question,row.questionFilter)):scoped;
    };
    const originalFilter=bank.filterQuestions.bind(bank);
    bank.filterQuestions=(questions,filters={})=>{
      const legacyFilters={...filters};
      delete legacyFilters.course;delete legacyFilters.unit;delete legacyFilters.topic;
      return originalFilter(questions,legacyFilters).filter(question=>mappingCompatible(question,filters));
    };
    const originalSave=bank.saveAttempt.bind(bank);
    bank.saveAttempt=(question,correct,response,context={})=>originalSave(question,correct,response,{...context,course:context.course||new URLSearchParams(location.search).get("course")||questionCourse(question),unit:context.unit??questionUnit(question),topic:context.topic??questionTopic(question)});

    bank.selectedBundleFromParams=catalog=>{
      const params=new URLSearchParams(location.search),course=normalise(params.get("course")||""),topic=params.get("topic"),unit=params.get("unit"),bundle=params.get("bundle");
      const courseMatch=row=>!course||normalise(row?.course_key||"")===course;
      const topicGroups=course==="ap-calculus"?["topics"]:course==="ap-precalculus"?["precalc_topics"]:course==="ib-math-ai"?["ib_topics"]:["topics","precalc_topics","ib_topics"];
      if(course&&topic){for(const group of topicGroups){const row=(catalog.bundles[group]||[]).find(item=>courseMatch(item)&&[item.topic,item.lesson_key,item.id].some(value=>String(value??"")===String(topic)));if(row)return{group,row};}}
      if(course&&unit){const row=(catalog.bundles.course_units||[]).find(item=>courseMatch(item)&&String(item.unit)===String(unit));if(row)return{group:"course_units",row};}
      if(course){const row=(catalog.bundles.course_all||[]).find(courseMatch);if(row)return{group:"course_all",row};}
      if(bundle){for(const group of Object.keys(catalog.bundles||{})){const row=(catalog.bundles[group]||[]).find(item=>item.id===bundle&&courseMatch(item));if(row)return{group,row};}}
      if(topic){for(const group of ["topics","precalc_topics","ib_topics"]){const row=(catalog.bundles[group]||[]).find(item=>[item.topic,item.lesson_key,item.id].some(value=>String(value??"")===String(topic)));if(row)return{group,row};}}
      if(unit){const row=(catalog.bundles.ap_units||[]).find(item=>String(item.unit)===String(unit));if(row)return{group:"ap_units",row};}
      const row=(catalog.bundles.course_all||[]).find(courseMatch)||(catalog.bundles.course_units||[]).find(courseMatch)||(catalog.bundles.topics||[])[0];
      return{group:row?.course_key?"course_all":row?.topic?"topics":"course_all",row};
    };
    document.documentElement.dataset.practiceCourseIsolation="ready";
  }
  install();
})();
