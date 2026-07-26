/* ECHS Mathematics Learning System — Phase 2 local-first engine */
(function(){
  "use strict";

  const VERSION="2.0.0";
  const DAY=86400000;
  const KEYS={
    profile:"echs_learning_profile_v2",
    attempts:"echs_learning_events_v2",
    mastery:"echs_learning_mastery_v2",
    reviews:"echs_learning_reviews_v2",
    sessions:"echs_learning_sessions_v2",
    continue:"echs_learning_continue_v2",
    achievements:"echs_learning_achievements_v2",
    streak:"echs_learning_streak_v2",
    classes:"echs_learning_classes_v2",
    assignments:"echs_learning_assignments_v2",
    submissions:"echs_learning_submissions_v2",
    settings:"echs_learning_settings_v2"
  };
  const COURSE_LABELS={
    "ap-calculus":"AP Calculus",
    "ap-precalculus":"AP Precalculus",
    "algebra-2":"Algebra 2 Concepts",
    "ib-math-ai":"IB Mathematics AI",
    "grade-9":"Grade 9 Pre-Precalculus",
    "unassigned":"General Mathematics"
  };
  const ACHIEVEMENTS=[
    {id:"first-step",title:"First Step",description:"Answer your first practice question.",icon:"✦",test:s=>s.attempts>=1},
    {id:"ten-questions",title:"Getting Started",description:"Answer 10 practice questions.",icon:"10",test:s=>s.attempts>=10},
    {id:"fifty-questions",title:"Practice Builder",description:"Answer 50 practice questions.",icon:"50",test:s=>s.attempts>=50},
    {id:"hundred-questions",title:"Century",description:"Answer 100 practice questions.",icon:"100",test:s=>s.attempts>=100},
    {id:"five-hundred",title:"Deep Practice",description:"Answer 500 practice questions.",icon:"500",test:s=>s.attempts>=500},
    {id:"streak-3",title:"Three-Day Streak",description:"Learn on three consecutive days.",icon:"🔥",test:s=>s.streak>=3},
    {id:"streak-7",title:"Weekly Momentum",description:"Learn on seven consecutive days.",icon:"🔥",test:s=>s.streak>=7},
    {id:"streak-30",title:"Monthly Discipline",description:"Learn on thirty consecutive days.",icon:"🏆",test:s=>s.streak>=30},
    {id:"accuracy-80",title:"Accurate Thinker",description:"Reach at least 80% accuracy after 25 attempts.",icon:"✓",test:s=>s.attempts>=25&&s.accuracy>=80},
    {id:"first-mastery",title:"Topic Master",description:"Master your first topic.",icon:"★",test:s=>s.mastered>=1},
    {id:"five-masteries",title:"Mastery Five",description:"Master five topics.",icon:"★★★★★",test:s=>s.mastered>=5},
    {id:"review-clear",title:"Review Complete",description:"Clear every due review after at least 20 attempts.",icon:"↻",test:s=>s.attempts>=20&&s.due===0}
  ];

  const safeParse=(value,fallback)=>{try{const parsed=JSON.parse(value);return parsed??fallback}catch{return fallback}};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const nowISO=()=>new Date().toISOString();
  const dateKey=value=>{
    const d=value?new Date(value):new Date();
    return Number.isNaN(d.getTime())?"":d.toISOString().slice(0,10);
  };
  const read=(key,fallback)=>safeParse(localStorage.getItem(key),fallback);
  const write=(key,value)=>{localStorage.setItem(key,JSON.stringify(value));return value};
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid=prefix=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
  const unique=items=>[...new Set(items.filter(Boolean))];

  function profile(){
    const existing=read(KEYS.profile,null);
    if(existing)return existing;
    return write(KEYS.profile,{schemaVersion:VERSION,id:uid("student"),name:"Student",grade:"",school:"ECHS",dailyGoal:10,createdAt:nowISO()});
  }
  function saveProfile(patch){
    return write(KEYS.profile,{...profile(),...patch,schemaVersion:VERSION,updatedAt:nowISO()});
  }
  function settings(){return read(KEYS.settings,{adaptive:true,dailyGoal:profile().dailyGoal||10,reviewReminder:true});}
  function saveSettings(patch){return write(KEYS.settings,{...settings(),...patch,updatedAt:nowISO()});}

  function inferCourse(question,context={}){
    if(context.course)return context.course;
    const scope=String(question?.classification?.course_scope||"").toLowerCase();
    if(scope.includes("precalculus"))return"ap-precalculus";
    if(scope.includes("calculus"))return"ap-calculus";
    const params=new URLSearchParams(location.search);
    return params.get("course")||"unassigned";
  }
  function topicDescriptor(question,context={}){
    const cls=question?.classification||{},src=question?.source||{};
    const course=inferCourse(question,context);
    const unit=String(context.unit??cls.ap_unit??new URLSearchParams(location.search).get("unit")??"all");
    const topic=String(cls.ap_topic||context.topic||src.section||src.skill_id||"general");
    const title=String(cls.ap_topic_title||src.skill_title||src.section_title||question?.pool_title||`Unit ${unit}`);
    const key=[course,unit,topic].map(v=>String(v).trim().toLowerCase()).join("::");
    return{key,course,unit,topic,title,courseLabel:COURSE_LABELS[course]||course};
  }

  function attempts(){return read(KEYS.attempts,[]);}
  function masteryMap(){return read(KEYS.mastery,{});}
  function reviewMap(){return read(KEYS.reviews,{});}
  function sessions(){return read(KEYS.sessions,[]);}
  function achievements(){return read(KEYS.achievements,{});}
  function streak(){return read(KEYS.streak,{current:0,longest:0,lastActiveDate:"",activeDates:[]});}

  function updateStreak(at=nowISO()){
    const state=streak(),today=dateKey(at);
    if(!today)return state;
    const dates=unique([...(state.activeDates||[]),today]).sort().slice(-400);
    const yesterday=dateKey(Date.now()-DAY);
    if(state.lastActiveDate===today){
      state.activeDates=dates;
      return write(KEYS.streak,state);
    }
    state.current=state.lastActiveDate===yesterday?(state.current||0)+1:1;
    state.longest=Math.max(state.longest||0,state.current);
    state.lastActiveDate=today;
    state.activeDates=dates;
    return write(KEYS.streak,state);
  }

  function masteryLevel(score){
    if(score>=80)return"Mastered";
    if(score>=65)return"Proficient";
    if(score>=45)return"Developing";
    return"Starting";
  }
  function recalculateMastery(record){
    const attempts=Math.max(0,record.attempts||0);
    const accuracy=attempts?(record.correct||0)/attempts:0;
    const recent=(record.recent||[]).slice(-8);
    const recentAccuracy=recent.length?recent.reduce((sum,x)=>sum+(x?1:0),0)/recent.length:accuracy;
    const evidence=0.55+0.45*Math.min(attempts/8,1);
    const score=Math.round(clamp((accuracy*0.4+recentAccuracy*0.6)*evidence*100,0,100));
    return{...record,score,accuracy:Math.round(accuracy*100),level:masteryLevel(score)};
  }
  function updateMastery(question,correct,context={}){
    const descriptor=topicDescriptor(question,context);
    const all=masteryMap();
    const previous=all[descriptor.key]||{...descriptor,attempts:0,correct:0,recent:[],score:0,accuracy:0,level:"Starting"};
    previous.attempts++;
    if(correct)previous.correct++;
    previous.recent=[...(previous.recent||[]),Boolean(correct)].slice(-12);
    previous.lastAttemptAt=nowISO();
    all[descriptor.key]=recalculateMastery(previous);
    write(KEYS.mastery,all);
    return all[descriptor.key];
  }

  function reviewInterval(box){
    return[0,1,3,7,14,30,60][clamp(box,0,6)];
  }
  function updateReview(question,correct,context={}){
    const all=reviewMap(),id=String(question?.id||"");
    if(!id)return null;
    const descriptor=topicDescriptor(question,context);
    const previous=all[id]||{questionId:id,box:0,attempts:0,correct:0};
    previous.attempts++;
    if(correct)previous.correct++;
    previous.box=correct?clamp((previous.box||0)+1,1,6):0;
    previous.unresolved=!correct;
    previous.lastResult=Boolean(correct);
    previous.lastAttemptAt=nowISO();
    previous.dueAt=new Date(Date.now()+(correct?reviewInterval(previous.box):1)*DAY).toISOString();
    previous.course=descriptor.course;
    previous.unit=descriptor.unit;
    previous.topic=descriptor.topic;
    previous.topicKey=descriptor.key;
    previous.title=descriptor.title;
    previous.bankCode=question.bank_code||"";
    previous.section=question.source?.section||"";
    previous.promptText=String(question.prompt_text||"").slice(0,300);
    all[id]=previous;
    write(KEYS.reviews,all);
    return previous;
  }

  function summary(){
    const rows=attempts();
    const correct=rows.filter(x=>x.correct).length;
    const mastery=Object.values(masteryMap());
    const due=dueReviews().length;
    const s=streak();
    return{
      attempts:rows.length,
      correct,
      accuracy:rows.length?Math.round(correct/rows.length*100):0,
      uniqueQuestions:new Set(rows.map(x=>x.questionId||x.id)).size,
      topics:mastery.length,
      mastered:mastery.filter(x=>x.score>=80).length,
      proficient:mastery.filter(x=>x.score>=65).length,
      due,
      unresolved:mistakes().length,
      streak:s.current||0,
      longestStreak:s.longest||0,
      completedLessons:read("echs_math_complete",[]).length,
      bookmarkedLessons:read("echs_math_bookmarks",[]).length
    };
  }

  function evaluateAchievements(){
    const state=summary(),earned=achievements(),newly=[];
    ACHIEVEMENTS.forEach(item=>{
      if(!earned[item.id]&&item.test(state)){
        earned[item.id]={id:item.id,title:item.title,description:item.description,icon:item.icon,earnedAt:nowISO()};
        newly.push(earned[item.id]);
      }
    });
    write(KEYS.achievements,earned);
    if(newly.length)window.dispatchEvent(new CustomEvent("echs:achievement",{detail:{earned:newly}}));
    return newly;
  }

  function recordAttempt({question,correct,response="",mode="practice",sessionId=null,durationMs=null,context={}}){
    if(!question?.id)return null;
    const descriptor=topicDescriptor(question,context);
    const event={
      schemaVersion:VERSION,
      id:uid("attempt"),
      questionId:String(question.id),
      bankCode:question.bank_code||"",
      type:question.type||"",
      correct:Boolean(correct),
      response:String(response??""),
      mode,
      sessionId,
      durationMs:Number.isFinite(durationMs)?durationMs:null,
      assignmentId:context.assignmentId||null,
      ...descriptor,
      at:nowISO()
    };
    const rows=attempts();
    rows.push(event);
    write(KEYS.attempts,rows.slice(-15000));
    updateMastery(question,Boolean(correct),context);
    updateReview(question,Boolean(correct),context);
    updateStreak(event.at);
    evaluateAchievements();
    window.dispatchEvent(new CustomEvent("echs:learning-attempt",{detail:event}));
    return event;
  }

  function dueReviews({course=null,unit=null,limit=Infinity}={}){
    const now=Date.now();
    return Object.values(reviewMap())
      .filter(row=>new Date(row.dueAt||0).getTime()<=now)
      .filter(row=>!course||row.course===course)
      .filter(row=>unit==null||String(row.unit)===String(unit))
      .sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt))
      .slice(0,limit);
  }
  function mistakes({course=null,unit=null,limit=Infinity}={}){
    return Object.values(reviewMap())
      .filter(row=>row.unresolved)
      .filter(row=>!course||row.course===course)
      .filter(row=>unit==null||String(row.unit)===String(unit))
      .sort((a,b)=>new Date(b.lastAttemptAt)-new Date(a.lastAttemptAt))
      .slice(0,limit);
  }
  function markReviewResolved(questionId,resolved=true){
    const all=reviewMap();
    if(!all[questionId])return false;
    all[questionId].unresolved=!resolved;
    all[questionId].manuallyResolvedAt=resolved?nowISO():null;
    write(KEYS.reviews,all);
    return true;
  }

  function masteryRows({course=null}={}){
    return Object.values(masteryMap())
      .filter(row=>!course||row.course===course)
      .sort((a,b)=>a.score-b.score||b.attempts-a.attempts);
  }
  function weakTopics(limit=5){
    return masteryRows().filter(row=>row.attempts>=2&&row.score<65).slice(0,limit);
  }

  function startSession(meta={}){
    const row={schemaVersion:VERSION,id:uid("session"),type:meta.type||"practice",mode:meta.mode||"manual",status:"active",startedAt:nowISO(),questionIds:meta.questionIds||[],answered:0,correct:0,...meta};
    const rows=sessions();rows.push(row);write(KEYS.sessions,rows.slice(-1000));
    return row;
  }
  function patchSession(id,patch={}){
    const rows=sessions(),index=rows.findIndex(row=>row.id===id);
    if(index<0)return null;
    rows[index]={...rows[index],...patch,updatedAt:nowISO()};
    write(KEYS.sessions,rows);
    return rows[index];
  }
  function endSession(id,patch={}){
    return patchSession(id,{...patch,status:"completed",endedAt:nowISO()});
  }
  function activeSession(id){return sessions().find(row=>row.id===id&&row.status==="active")||null;}

  function setContinue(state){
    if(!state){localStorage.removeItem(KEYS.continue);return null;}
    const value={schemaVersion:VERSION,...state,updatedAt:nowISO()};
    write(KEYS.continue,value);
    return value;
  }
  function getContinue(){return read(KEYS.continue,null);}
  function clearContinue(){localStorage.removeItem(KEYS.continue);}

  function questionDifficulty(question){
    const value=Number(question?.metadata?.difficulty);
    return Number.isFinite(value)&&value>=1&&value<=3?value:2;
  }
  function adaptiveTarget(question){
    const descriptor=topicDescriptor(question);
    const score=masteryMap()[descriptor.key]?.score??35;
    return score<40?1:score<72?2:3;
  }
  function adaptiveScore(question,{excludedIds=[],lastCorrect=null}={}){
    if(excludedIds.includes(String(question.id)))return-Infinity;
    const descriptor=topicDescriptor(question);
    const mastery=masteryMap()[descriptor.key];
    const review=reviewMap()[question.id];
    const difficulty=questionDifficulty(question);
    let target=adaptiveTarget(question);
    if(lastCorrect===true)target=Math.min(3,target+1);
    if(lastCorrect===false)target=Math.max(1,target-1);
    let score=0;
    if(review?.unresolved)score+=80;
    if(review&&new Date(review.dueAt||0)<=new Date())score+=65;
    if(!review)score+=28;
    score+=(100-(mastery?.score??30))*0.65;
    score-=Math.abs(difficulty-target)*22;
    score+=Math.random()*18;
    return score;
  }
  function selectAdaptive(questions,count=10,options={}){
    const excluded=[...(options.excludedIds||[])];
    const selected=[];
    for(let i=0;i<count;i++){
      const ranked=questions
        .map(question=>({question,score:adaptiveScore(question,{...options,excludedIds:excluded})}))
        .filter(row=>Number.isFinite(row.score))
        .sort((a,b)=>b.score-a.score);
      if(!ranked.length)break;
      const window=ranked.slice(0,Math.min(8,ranked.length));
      const choice=window[Math.floor(Math.random()*window.length)].question;
      selected.push(choice);excluded.push(String(choice.id));
    }
    return selected;
  }

  function dailyPlan(){
    const p=profile(),goal=Number(settings().dailyGoal||p.dailyGoal||10);
    const today=dateKey(),todayAttempts=attempts().filter(row=>dateKey(row.at)===today).length;
    const due=dueReviews({limit:20}),weak=weakTopics(3),cont=getContinue();
    const items=[];
    if(cont)items.push({type:"continue",title:"Continue where you stopped",detail:cont.label||"Resume your last activity",href:cont.url||"practice.html?resume=1",priority:100});
    if(due.length)items.push({type:"review",title:`Review ${Math.min(due.length,10)} due question${due.length===1?"":"s"}`,detail:"Spaced review is ready now.",href:"practice.html?mode=review&autostart=1",priority:90});
    if(weak.length)items.push({type:"adaptive",title:`Strengthen ${weak[0].title}`,detail:`Current mastery ${weak[0].score}%.",href:`practice.html?course=${encodeURIComponent(weak[0].course)}&unit=${encodeURIComponent(weak[0].unit)}&mode=adaptive&autostart=1`,priority:80});
    if(todayAttempts<goal)items.push({type:"goal",title:`Complete ${goal-todayAttempts} more question${goal-todayAttempts===1?"":"s"} today`,detail:`Daily goal: ${goal}.",href:"practice.html?mode=adaptive&autostart=1",priority:70});
    if(!items.length)items.push({type:"complete",title:"Today's plan is complete",detail:"Choose a challenge set or continue a lesson.",href:"practice.html?mode=adaptive",priority:1});
    return{goal,todayAttempts,progress:goal?Math.min(100,Math.round(todayAttempts/goal*100)):0,items:items.sort((a,b)=>b.priority-a.priority)};
  }

  function recentSessions(limit=10){return sessions().slice().sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt)).slice(0,limit);}
  function earnedAchievements(){const earned=achievements();return ACHIEVEMENTS.map(item=>({...item,earned:earned[item.id]||null}));}

  function exportStudentReport(){
    const p=profile(),s=summary();
    return{
      schema:"echs-learning-report",
      schemaVersion:VERSION,
      generatedAt:nowISO(),
      student:{id:p.id,name:p.name,grade:p.grade,school:p.school},
      summary:s,
      mastery:masteryRows(),
      dueReviews:dueReviews({limit:100}).map(({questionId,course,unit,topic,title,dueAt,unresolved})=>({questionId,course,unit,topic,title,dueAt,unresolved})),
      weakTopics:weakTopics(10),
      achievements:Object.values(achievements()),
      recentSessions:recentSessions(25).map(({id,type,mode,status,startedAt,endedAt,answered,correct,score,assignmentId})=>({id,type,mode,status,startedAt,endedAt,answered,correct,score,assignmentId}))
    };
  }
  function downloadJSON(filename,data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function exportReport(){const report=exportStudentReport();downloadJSON(`ECHS-learning-report-${dateKey()}.json`,report);return report;}

  function migrateLegacyAttempts(){
    const current=attempts();
    if(current.length)return 0;
    const legacy=read("echs_qbank_attempts_v20",[]);
    if(!Array.isArray(legacy)||!legacy.length)return 0;
    const events=[],mastery={...masteryMap()},reviews={...reviewMap()};
    legacy.slice(-15000).forEach(row=>{
      const course=row.course||"unassigned",unit=String(row.unit||"all"),topic=String(row.topic||row.section||"general");
      const key=[course,unit,topic].map(value=>String(value).toLowerCase()).join("::");
      const title=row.lesson||row.section||`Unit ${unit}`;
      events.push({schemaVersion:VERSION,id:uid("legacy"),questionId:String(row.id||""),bankCode:row.bank_code||"",type:row.type||"",correct:Boolean(row.correct),response:String(row.response||""),mode:"legacy",sessionId:null,durationMs:null,key,course,unit,topic,title,courseLabel:COURSE_LABELS[course]||course,at:row.at||nowISO(),migrated:true});
      const record=mastery[key]||{key,course,unit,topic,title,courseLabel:COURSE_LABELS[course]||course,attempts:0,correct:0,recent:[],score:0,accuracy:0,level:"Starting"};
      record.attempts++;if(row.correct)record.correct++;record.recent=[...(record.recent||[]),Boolean(row.correct)].slice(-12);record.lastAttemptAt=row.at||nowISO();mastery[key]=recalculateMastery(record);
      if(row.id){
        const review=reviews[row.id]||{questionId:String(row.id),box:0,attempts:0,correct:0};
        review.attempts++;if(row.correct)review.correct++;review.box=row.correct?Math.max(1,review.box||0):0;review.unresolved=!row.correct;review.lastResult=Boolean(row.correct);review.lastAttemptAt=row.at||nowISO();review.dueAt=new Date(new Date(row.at||Date.now()).getTime()+(row.correct?reviewInterval(review.box):1)*DAY).toISOString();review.course=course;review.unit=unit;review.topic=topic;review.topicKey=key;review.title=title;review.bankCode=row.bank_code||"";review.section=row.section||"";reviews[row.id]=review;
      }
    });
    write(KEYS.attempts,events);write(KEYS.mastery,mastery);write(KEYS.reviews,reviews);
    legacy.forEach(row=>updateStreak(row.at||nowISO()));
    evaluateAchievements();
    return events.length;
  }

  function resetLearningData({keepProfile=true,keepTeacher=true}={}){
    const preserve=new Set();
    if(keepProfile)preserve.add(KEYS.profile);
    if(keepTeacher){preserve.add(KEYS.classes);preserve.add(KEYS.assignments);preserve.add(KEYS.submissions);}
    Object.values(KEYS).forEach(key=>{if(!preserve.has(key))localStorage.removeItem(key)});
  }

  const api={
    VERSION,KEYS,COURSE_LABELS,ACHIEVEMENTS,escapeHTML,uid,dateKey,
    profile,saveProfile,settings,saveSettings,
    attempts,masteryMap,reviewMap,sessions,achievements,streak,
    topicDescriptor,recordAttempt,summary,updateStreak,evaluateAchievements,
    dueReviews,mistakes,markReviewResolved,masteryRows,weakTopics,
    startSession,patchSession,endSession,activeSession,recentSessions,
    setContinue,getContinue,clearContinue,
    selectAdaptive,adaptiveScore,adaptiveTarget,questionDifficulty,
    dailyPlan,earnedAchievements,exportStudentReport,exportReport,downloadJSON,
    resetLearningData,migrateLegacyAttempts,read,write
  };
  window.ECHSLearning=api;
  migrateLegacyAttempts();

  window.addEventListener("echs:achievement",event=>{
    const earned=event.detail?.earned||[];
    if(!earned.length)return;
    const message=`Achievement unlocked: ${earned.map(item=>item.title).join(", ")}`;
    if(window.ECHSPlatform?.toast)window.ECHSPlatform.toast(message);
  });
})();