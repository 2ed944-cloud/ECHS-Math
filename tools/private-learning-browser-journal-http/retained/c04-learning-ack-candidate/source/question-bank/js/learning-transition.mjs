// Generated from the pinned existing engine; only storage/environment, effect capture,
// pre-commit private-bank metadata and the closed exported surface are adapted.
// Isolated P1 candidate: no browser/storage/network authority lives in this module.
export const BASELINE_SHA256 = 'd9ce5918121145383a37f916665fb1a7b62eadea631eceb1799d9baa05ab9161';
export const MUTATIONS = Object.freeze(['initialize','saveProfile','saveSettings','recordAttempt','markReviewResolved','startSession','patchSession','endSession','setContinue','clearContinue','updateStreak','evaluateAchievements','resetLearningData']);
export const QUERIES = Object.freeze(['profile','settings','attempts','masteryMap','reviewMap','sessions','achievements','streak','topicDescriptor','summary','dueReviews','mistakes','masteryRows','weakTopics','activeSession','recentSessions','getContinue','selectAdaptive','adaptiveScore','adaptiveTarget','questionDifficulty','dailyPlan','earnedAchievements','exportStudentReport']);
export const DOMAIN_KEYS = Object.freeze(['echs_learning_profile_v2','echs_learning_events_v2','echs_learning_mastery_v2','echs_learning_reviews_v2','echs_learning_sessions_v2','echs_learning_continue_v2','echs_learning_achievements_v2','echs_learning_streak_v2','echs_learning_classes_v2','echs_learning_assignments_v2','echs_learning_submissions_v2','echs_learning_settings_v2','echs_learning_lesson_events_v2','echs_math_complete','echs_math_bookmarks']);
const NativeDate=globalThis.Date, NativeMath=globalThis.Math;
export function createLearningTransition(initialState={}, {at=NativeDate.now(),seed=1,search=''}={}) {
  const state=structuredClone(initialState),effects=[];
  if(!Number.isSafeInteger(at)||!Number.isInteger(seed)||seed<0||seed>4294967295||typeof search!=='string'||search.length>4096)throw new TypeError('Invalid transition environment');
  for(const key of Object.keys(state))if(!DOMAIN_KEYS.includes(key))throw new TypeError('Unknown learning domain');
  const localStorage={getItem(key){if(!DOMAIN_KEYS.includes(key))throw new TypeError('Raw learning access blocked');return Object.hasOwn(state,key)?JSON.stringify(state[key]):null},setItem(key,value){if(!DOMAIN_KEYS.includes(key))throw new TypeError('Raw learning access blocked');state[key]=JSON.parse(value)},removeItem(key){if(!DOMAIN_KEYS.includes(key))throw new TypeError('Raw learning access blocked');delete state[key]}};
  const Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[at]))}static now(){return at}};
  let randomState=seed;const Math=Object.create(NativeMath);Math.random=()=>{randomState=(1664525*randomState+1013904223)>>>0;return randomState/4294967296};
  const location={search};
  const CustomEvent=class{constructor(type,options={}){this.type=type;this.detail=options.detail}};
  const window={dispatchEvent(event){effects.push({type:event.type,detail:structuredClone(event.detail)});return true}};
  const document={createElement(){throw new Error('DOM is unavailable in a transition')}};
  const setTimeout=()=>{throw new Error('Timers are unavailable in a transition')};
  function ownedAttemptMetadata(q){if(!q?._private_bank)return{};return{...(q.skill_key!==undefined?{skill_key:q.skill_key}:{}),trust_tier:q.trust_tier||'publisher_key_direct',representation:'publisher-source',verification_basis:q.metadata?.alignment_status||'mapped-private-bank',staff_review_only:Boolean(q._staff_only)}}
// BEGIN GENERATED ECHS MASTERY STATUS
const MASTERY_STATUS = (() => {
// ECHS-C02: presentation policy, not a grader or a certification authority.
// Current attempt ingestion accepts client-reported answers and assistance/time.
// Recomputing those records on the server does not authenticate their correctness.
const STATUS_CONTRACT = 'echs.mastery-status.v1';

function field(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
  } catch { return undefined; }
}
function numeric(value, maximum = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum ? value : null;
}

/** Pure projection of existing evidence. No input, including receipt-like fields,
 * can enable verified mastery until a separate authenticated grading contract exists.
 * Missing-evidence codes describe recorded practice diagnostics, not trusted proofs.
 */
function projectMasteryStatus(record) {
  const attempts = numeric(field(record, 'attempts'));
  const score = numeric(field(record, 'score'), 100);
  const hasAttempts = attempts !== null && attempts > 0;
  const sufficient = hasAttempts && score !== null;
  const missing = ['grading_provenance_missing'];
  if (!hasAttempts) missing.push('practice_attempts_missing');
  if (score === null) missing.push('practice_score_missing');
  const rules = field(field(record, 'payload'), 'requirements');
  const diagnostic = (key, minimum, name, maximum) => {
    const value = numeric(field(record, key), maximum);
    if (value === null) missing.push(`${name}_unavailable`);
    else if (value < minimum) missing.push(`${name}_insufficient`);
  };
  // These are the existing foundation's defaults; they do not change its score.
  diagnostic('independent_evidence', numeric(field(rules, 'minimumIndependent')) ?? 4, 'independent_evidence');
  diagnostic('active_days', numeric(field(rules, 'minimumDays')) ?? 2, 'active_days');
  diagnostic('confidence', numeric(field(rules, 'minimumConfidence'), 1) ?? .72, 'confidence', 1);
  for (const [key, rule] of [['transfer_evidence', 'requiresTransfer'], ['retention_evidence', 'requiresRetention']]) {
    const value = numeric(field(record, key));
    if (value === null) missing.push(`${key}_unavailable`);
    else if (field(rules, rule) === true && value < 1) missing.push(`${key}_insufficient`);
  }
  const display = !sufficient ? 'Insufficient practice evidence'
    : score >= 85 ? 'Strong practice performance'
    : score >= 65 ? 'Proficient practice performance'
    : score >= 35 ? 'Developing practice performance' : 'Starting practice performance';
  return Object.freeze({
    status_contract: STATUS_CONTRACT,
    evidence_status: sufficient ? 'provisional' : 'insufficient',
    verified_mastery: false,
    display_level: display,
    provenance: hasAttempts ? 'client_reported' : 'unknown',
    missing_evidence: Object.freeze(missing),
  });
}

/** Response-only compatibility projection; the supplied/stored record is untouched.
 * Old algorithm claims remain explicitly diagnostic, never the active label/flag.
 */
function projectMasteryRecord(record) {
  const status = projectMasteryStatus(record);
  const payload = field(record, 'payload');
  const hasPayload = payload && typeof payload === 'object' && !Array.isArray(payload);
  return {
    ...record,
    ...status,
    level: status.display_level,
    last_verified_at: null,
    ...(hasPayload ? {payload: {...payload, level: status.display_level, verified: false}} : {}),
    legacy_algorithm_diagnostics: {
      interpretation: 'Server recomputation of client-reported practice; not authenticated grading.',
      level: field(payload, 'level') ?? null,
      verified: field(payload, 'verified') ?? null,
      last_verified_at: field(record, 'last_verified_at') ?? null,
    },
  };
}

/** Aggregate certification status only; score/accuracy/routing remain caller-owned. */
function projectMasterySummary(records) {
  const statuses = Array.isArray(records) ? records.map(projectMasteryStatus) : [];
  const hasPractice = statuses.some(value => value.provenance === 'client_reported');
  const provisional = statuses.some(value => value.evidence_status === 'provisional');
  return {
    status_contract: STATUS_CONTRACT,
    grading_authoritative: false,
    verified_mastery: false,
    evidence_status: provisional ? 'provisional' : 'insufficient',
    provenance: hasPractice ? 'client_reported' : 'unknown',
    missing_evidence: statuses.length ? [...new Set(statuses.flatMap(value => value.missing_evidence))] : [...projectMasteryStatus(null).missing_evidence],
  };
}

return Object.freeze({STATUS_CONTRACT,projectMasteryStatus,projectMasteryRecord,projectMasterySummary});
})();
// END GENERATED ECHS MASTERY STATUS
const evidenceStatus=MASTERY_STATUS.projectMasteryStatus,projectMasteryRecord=MASTERY_STATUS.projectMasteryRecord,projectMasterySummary=MASTERY_STATUS.projectMasterySummary;
// Read models only. Never write these projections back over recorded practice.
function evidencePercent(record,key="score"){
  const value=record?.[key];
  return evidenceStatus({score:value,attempts:record?.attempts}).evidence_status==="provisional"?`${Math.round(value)}%`:"—";
}
function projectPracticeAchievement(row){
  if(!row||typeof row!=="object")return{};
  if(!["first-mastery","five-masteries"].includes(row.id)){
    const known=ACHIEVEMENTS.find(item=>item.id===row.id);
    return{...row,title:known?.title||"Recorded practice milestone",description:known?.description||"Imported historical practice entry; not a verified mastery certificate.",verified_mastery:false,evidence_status:"provisional"};
  }
  return{...row,title:row.id==="first-mastery"?"Historical topic practice milestone":"Historical five-topic practice milestone",description:"Recorded by the earlier practice-score system; this is not verified mastery.",verified_mastery:false,evidence_status:"provisional"};
}
function projectLearningReport(data={}){
  if(!data||typeof data!=="object"||Array.isArray(data))data={};
  const result={...data};
  for(const key of ["mastery","strengths","priorities","weakTopics"])if(Array.isArray(data[key]))result[key]=data[key].map(projectMasteryRecord);
  const status=projectMasterySummary(result.mastery||[...(result.strengths||[]),...(result.priorities||[])]);
  Object.assign(result,status);
  if(data.counters)result.counters={...data.counters,mastered_topics:0,...status};
  if(data.summary)result.summary={...data.summary,mastered:0,mastered_topics:0,...status};
  if(Array.isArray(data.achievements))result.achievements=data.achievements.map(projectPracticeAchievement);
  return result;
}
const VERSION="2.0.0",DAY=86400000;
const KEYS={profile:"echs_learning_profile_v2",attempts:"echs_learning_events_v2",mastery:"echs_learning_mastery_v2",reviews:"echs_learning_reviews_v2",sessions:"echs_learning_sessions_v2",continue:"echs_learning_continue_v2",achievements:"echs_learning_achievements_v2",streak:"echs_learning_streak_v2",classes:"echs_learning_classes_v2",assignments:"echs_learning_assignments_v2",submissions:"echs_learning_submissions_v2",settings:"echs_learning_settings_v2"};
const COURSE_LABELS={"ap-calculus":"AP Calculus","ap-precalculus":"AP Precalculus","algebra-2":"Algebra 2 Concepts","ib-math-ai":"IB Mathematics AI","grade-9":"Grade 9 Pre-Precalculus",unassigned:"General Mathematics"};
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
const parse=(v,f)=>{try{return JSON.parse(v)??f}catch{return f}},read=(k,f)=>parse(localStorage.getItem(k),f),write=(k,v)=>(localStorage.setItem(k,JSON.stringify(v)),v);
const now=()=>new Date().toISOString(),dateKey=v=>{const d=v?new Date(v):new Date();return Number.isNaN(d.getTime())?"":d.toISOString().slice(0,10)};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`,uniq=a=>[...new Set(a.filter(Boolean))];
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function profile(){const p=read(KEYS.profile,null);return p||write(KEYS.profile,{schemaVersion:VERSION,id:uid("student"),name:"Student",grade:"",school:"ECHS",dailyGoal:10,createdAt:now()})}
function saveProfile(p={}){return write(KEYS.profile,{...profile(),...p,schemaVersion:VERSION,updatedAt:now()})}
function settings(){return read(KEYS.settings,{adaptive:true,dailyGoal:profile().dailyGoal||10,reviewReminder:true})}
function saveSettings(p={}){return write(KEYS.settings,{...settings(),...p,updatedAt:now()})}
const attempts=()=>read(KEYS.attempts,[]),masteryMap=()=>read(KEYS.mastery,{}),reviewMap=()=>read(KEYS.reviews,{}),sessions=()=>read(KEYS.sessions,[]),achievements=()=>read(KEYS.achievements,{}),streak=()=>read(KEYS.streak,{current:0,longest:0,lastActiveDate:"",activeDates:[]});
function inferCourse(q,c={}){if(c.course)return c.course;const s=String(q?.classification?.course_scope||"").toLowerCase();if(s.includes("precalculus"))return"ap-precalculus";if(s.includes("calculus"))return"ap-calculus";return new URLSearchParams(location.search).get("course")||"unassigned"}
function topicDescriptor(q,c={}){const x=q?.classification||{},s=q?.source||{},course=inferCourse(q,c),unit=String(c.unit??x.ap_unit??new URLSearchParams(location.search).get("unit")??"all"),topic=String(x.ap_topic||c.topic||s.section||s.skill_id||"general"),title=String(x.ap_topic_title||s.skill_title||s.section_title||q?.pool_title||`Unit ${unit}`),key=[course,unit,topic].map(v=>String(v).trim().toLowerCase()).join("::");return{key,course,unit,topic,title,courseLabel:COURSE_LABELS[course]||course}}
function updateStreak(at=now()){const s=streak(),today=dateKey(at);if(!today)return s;const dates=uniq([...(s.activeDates||[]),today]).sort().slice(-400),yesterday=dateKey(Date.now()-DAY);if(s.lastActiveDate!==today){s.current=s.lastActiveDate===yesterday?(s.current||0)+1:1;s.longest=Math.max(s.longest||0,s.current);s.lastActiveDate=today}s.activeDates=dates;return write(KEYS.streak,s)}
const level=s=>s>=80?"Mastered":s>=65?"Proficient":s>=45?"Developing":"Starting";
function recalc(r){const n=Math.max(0,r.attempts||0),a=n?(r.correct||0)/n:0,z=(r.recent||[]).slice(-8),ra=z.length?z.reduce((t,x)=>t+(x?1:0),0)/z.length:a,e=.55+.45*Math.min(n/8,1),score=Math.round(clamp((a*.4+ra*.6)*e*100,0,100));return{...r,score,accuracy:Math.round(a*100),level:level(score)}}
function updateMastery(q,ok,c={}){const d=topicDescriptor(q,c),all=masteryMap(),r=all[d.key]||{...d,attempts:0,correct:0,recent:[],score:0,accuracy:0,level:"Starting"};r.attempts++;if(ok)r.correct++;r.recent=[...(r.recent||[]),Boolean(ok)].slice(-12);r.lastAttemptAt=now();all[d.key]=recalc(r);write(KEYS.mastery,all);return all[d.key]}
const interval=b=>[0,1,3,7,14,30,60][clamp(b,0,6)];
function updateReview(q,ok,c={}){const all=reviewMap(),id=String(q?.id||"");if(!id)return null;const d=topicDescriptor(q,c),r=all[id]||{questionId:id,box:0,attempts:0,correct:0};r.attempts++;if(ok)r.correct++;r.box=ok?clamp((r.box||0)+1,1,6):0;r.unresolved=!ok;r.lastResult=Boolean(ok);r.lastAttemptAt=now();r.dueAt=new Date(Date.now()+(ok?interval(r.box):1)*DAY).toISOString();Object.assign(r,{course:d.course,unit:d.unit,topic:d.topic,topicKey:d.key,title:d.title,bankCode:q.bank_code||"",section:q.source?.section||"",promptText:String(q.prompt_text||"").slice(0,300)});all[id]=r;write(KEYS.reviews,all);return r}
function dueReviews({course=null,unit=null,limit=Infinity}={}){return Object.values(reviewMap()).filter(r=>new Date(r.dueAt||0).getTime()<=Date.now()).filter(r=>!course||r.course===course).filter(r=>unit==null||String(r.unit)===String(unit)).sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt)).slice(0,limit)}
function mistakes({course=null,unit=null,limit=Infinity}={}){return Object.values(reviewMap()).filter(r=>r.unresolved).filter(r=>!course||r.course===course).filter(r=>unit==null||String(r.unit)===String(unit)).sort((a,b)=>new Date(b.lastAttemptAt)-new Date(a.lastAttemptAt)).slice(0,limit)}
function masteryRows({course=null}={}){return Object.values(masteryMap()).filter(r=>!course||r.course===course).sort((a,b)=>a.score-b.score||b.attempts-a.attempts).map(projectMasteryRecord)}
function weakTopics(limit=5){return masteryRows().filter(r=>r.attempts>=2&&r.score<65).slice(0,limit)}
function summary(){const a=attempts(),correct=a.filter(x=>x.correct).length,m=Object.values(masteryMap()),s=streak();return{attempts:a.length,correct,accuracy:a.length?Math.round(correct/a.length*100):0,uniqueQuestions:new Set(a.map(x=>x.questionId||x.id)).size,topics:m.length,mastered:m.map(evidenceStatus).filter(x=>x.verified_mastery).length,...projectMasterySummary(m),legacy_practice_points:{topics_at_80_percent:m.filter(x=>x.score>=80).length,certified:false},proficient:m.filter(x=>x.score>=65).length,due:dueReviews().length,unresolved:mistakes().length,streak:s.current||0,longestStreak:s.longest||0,completedLessons:read("echs_math_complete",[]).length,bookmarkedLessons:read("echs_math_bookmarks",[]).length}}
function evaluateAchievements(){const s=summary(),all=achievements(),newly=[];ACHIEVEMENTS.forEach(x=>{if(!all[x.id]&&x.test(s)){all[x.id]={id:x.id,title:x.title,description:x.description,icon:x.icon,earnedAt:now()};newly.push(all[x.id])}});write(KEYS.achievements,all);if(newly.length)window.dispatchEvent(new CustomEvent("echs:achievement",{detail:{earned:newly}}));return newly}
function recordAttempt({question,correct,response="",mode="practice",sessionId=null,durationMs=null,context={}}){if(!question?.id)return null;const d=topicDescriptor(question,context),e={schemaVersion:VERSION,id:uid("attempt"),questionId:String(question.id),bankCode:question.bank_code||"",type:question.type||"",correct:Boolean(correct),response:String(response??""),mode,sessionId,durationMs:Number.isFinite(durationMs)?durationMs:null,assignmentId:context.assignmentId||null,...d,at:now(),...ownedAttemptMetadata(question)},a=attempts();a.push(e);write(KEYS.attempts,a.slice(-15000));updateMastery(question,Boolean(correct),context);updateReview(question,Boolean(correct),context);updateStreak(e.at);evaluateAchievements();window.dispatchEvent(new CustomEvent("echs:learning-attempt",{detail:e}));return e}
function markReviewResolved(id,resolved=true){const all=reviewMap();if(!all[id])return false;all[id].unresolved=!resolved;all[id].manuallyResolvedAt=resolved?now():null;write(KEYS.reviews,all);return true}
function startSession(meta={}){const r={schemaVersion:VERSION,id:uid("session"),type:meta.type||"practice",mode:meta.mode||"manual",status:"active",startedAt:now(),questionIds:meta.questionIds||[],answered:0,correct:0,...meta},a=sessions();a.push(r);write(KEYS.sessions,a.slice(-1000));return r}
function patchSession(id,p={}){const a=sessions(),i=a.findIndex(x=>x.id===id);if(i<0)return null;a[i]={...a[i],...p,updatedAt:now()};write(KEYS.sessions,a);return a[i]}
const endSession=(id,p={})=>{const row=patchSession(id,{...p,status:"completed",endedAt:now()});if(row)window.dispatchEvent(new CustomEvent("echs:learning-session",{detail:row}));return row},activeSession=id=>sessions().find(x=>x.id===id&&x.status==="active")||null,recentSessions=(limit=10)=>sessions().slice().sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt)).slice(0,limit);
function setContinue(s){if(!s){localStorage.removeItem(KEYS.continue);return null}return write(KEYS.continue,{schemaVersion:VERSION,...s,updatedAt:now()})}
const getContinue=()=>read(KEYS.continue,null),clearContinue=()=>localStorage.removeItem(KEYS.continue);
const questionDifficulty=q=>{const v=Number(q?.metadata?.difficulty);return Number.isFinite(v)&&v>=1&&v<=3?v:2};
function adaptiveTarget(q){const d=topicDescriptor(q),s=masteryMap()[d.key]?.score??35;return s<40?1:s<72?2:3}
function adaptiveScore(q,{excludedIds=[],lastCorrect=null}={}){if(excludedIds.includes(String(q.id)))return-Infinity;const d=topicDescriptor(q),m=masteryMap()[d.key],r=reviewMap()[q.id],difficulty=questionDifficulty(q);let target=adaptiveTarget(q),score=0;if(lastCorrect===true)target=Math.min(3,target+1);if(lastCorrect===false)target=Math.max(1,target-1);if(r?.unresolved)score+=80;if(r&&new Date(r.dueAt||0)<=new Date())score+=65;if(!r)score+=28;score+=(100-(m?.score??30))*.65;score-=Math.abs(difficulty-target)*22;return score+Math.random()*18}
function selectAdaptive(qs,count=10,o={}){const excluded=[...(o.excludedIds||[])],out=[];for(let i=0;i<count;i++){const ranked=qs.map(q=>({q,score:adaptiveScore(q,{...o,excludedIds:excluded})})).filter(x=>Number.isFinite(x.score)).sort((a,b)=>b.score-a.score);if(!ranked.length)break;const top=ranked.slice(0,Math.min(8,ranked.length)),q=top[Math.floor(Math.random()*top.length)].q;out.push(q);excluded.push(String(q.id))}return out}
function dailyPlan(){const p=profile(),goal=Number(settings().dailyGoal||p.dailyGoal||10),today=dateKey(),todayAttempts=attempts().filter(r=>dateKey(r.at)===today).length,due=dueReviews({limit:20}),weak=weakTopics(3),cont=getContinue(),items=[];if(cont)items.push({type:"continue",title:"Continue where you stopped",detail:cont.label||"Resume your last activity",href:cont.url||"practice.html?resume=1",priority:100});if(due.length)items.push({type:"review",title:`Review ${Math.min(due.length,10)} due question${due.length===1?"":"s"}`,detail:"Spaced review is ready now.",href:"practice.html?mode=review&autostart=1",priority:90});if(weak.length)items.push({type:"adaptive",title:`Strengthen ${weak[0].title}`,detail:`Current provisional practice score ${weak[0].score}%.`,href:`practice.html?course=${encodeURIComponent(weak[0].course)}&unit=${encodeURIComponent(weak[0].unit)}&mode=adaptive&autostart=1`,priority:80});if(todayAttempts<goal)items.push({type:"goal",title:`Complete ${goal-todayAttempts} more question${goal-todayAttempts===1?"":"s"} today`,detail:`Daily goal: ${goal}.`,href:"practice.html?mode=adaptive&autostart=1",priority:70});if(!items.length)items.push({type:"complete",title:"Today's plan is complete",detail:"Choose a challenge set or continue a lesson.",href:"practice.html?mode=adaptive",priority:1});return{goal,todayAttempts,progress:goal?Math.min(100,Math.round(todayAttempts/goal*100)):0,items:items.sort((a,b)=>b.priority-a.priority)}}
const earnedAchievements=()=>{const e=achievements();return ACHIEVEMENTS.map(x=>({...projectPracticeAchievement(x),earned:e[x.id]?projectPracticeAchievement(e[x.id]):null}))};
function exportStudentReport(){const p=profile();return{schema:"echs-learning-report",schemaVersion:VERSION,generatedAt:now(),student:{id:p.id,name:p.name,grade:p.grade,school:p.school},summary:summary(),mastery:masteryRows(),dueReviews:dueReviews({limit:100}).map(({questionId,course,unit,topic,title,dueAt,unresolved})=>({questionId,course,unit,topic,title,dueAt,unresolved})),weakTopics:weakTopics(10),achievements:Object.values(achievements()).map(projectPracticeAchievement),recentSessions:recentSessions(25).map(({id,type,mode,status,startedAt,endedAt,answered,correct,score,assignmentId,course,unit,topic})=>({id,type,mode,status,startedAt,endedAt,answered,correct,score,assignmentId,course,unit,topic}))}}
function downloadJSON(name,data){const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
const exportReport=()=>{const r=exportStudentReport();downloadJSON(`ECHS-learning-report-${dateKey()}.json`,r);return r};
function migrateLegacyAttempts(){if(attempts().length)return 0;const old=read("echs_qbank_attempts_v20",[]);if(!Array.isArray(old)||!old.length)return 0;const events=[],mastery={...masteryMap()},reviews={...reviewMap()};old.slice(-15000).forEach(r=>{const course=r.course||"unassigned",unit=String(r.unit||"all"),topic=String(r.topic||r.section||"general"),key=[course,unit,topic].map(v=>String(v).toLowerCase()).join("::"),title=r.lesson||r.section||`Unit ${unit}`;events.push({schemaVersion:VERSION,id:uid("legacy"),questionId:String(r.id||""),bankCode:r.bank_code||"",type:r.type||"",correct:Boolean(r.correct),response:String(r.response||""),mode:"legacy",key,course,unit,topic,title,courseLabel:COURSE_LABELS[course]||course,at:r.at||now(),migrated:true});const m=mastery[key]||{key,course,unit,topic,title,courseLabel:COURSE_LABELS[course]||course,attempts:0,correct:0,recent:[]};m.attempts++;if(r.correct)m.correct++;m.recent=[...(m.recent||[]),Boolean(r.correct)].slice(-12);m.lastAttemptAt=r.at||now();mastery[key]=recalc(m);if(r.id){const v=reviews[r.id]||{questionId:String(r.id),box:0,attempts:0,correct:0};v.attempts++;if(r.correct)v.correct++;v.box=r.correct?Math.max(1,v.box||0):0;v.unresolved=!r.correct;v.lastAttemptAt=r.at||now();v.dueAt=new Date(new Date(r.at||Date.now()).getTime()+(r.correct?interval(v.box):1)*DAY).toISOString();Object.assign(v,{course,unit,topic,topicKey:key,title,bankCode:r.bank_code||"",section:r.section||""});reviews[r.id]=v}});write(KEYS.attempts,events);write(KEYS.mastery,mastery);write(KEYS.reviews,reviews);old.forEach(r=>updateStreak(r.at||now()));evaluateAchievements();return events.length}
function resetLearningData({keepProfile=true,keepTeacher=true}={}){const keep=new Set();if(keepProfile)keep.add(KEYS.profile);if(keepTeacher)[KEYS.classes,KEYS.assignments,KEYS.submissions].forEach(k=>keep.add(k));Object.values(KEYS).forEach(k=>{if(!keep.has(k))localStorage.removeItem(k)})}
const api={evidenceStatus,projectMasteryRecord,projectMasterySummary,evidencePercent,projectPracticeAchievement,projectLearningReport,VERSION,KEYS,COURSE_LABELS,ACHIEVEMENTS,escapeHTML,uid,dateKey,profile,saveProfile,settings,saveSettings,attempts,masteryMap:()=>Object.fromEntries(Object.entries(masteryMap()).map(([key,row])=>[key,projectMasteryRecord(row)])),reviewMap,sessions,achievements:()=>Object.fromEntries(Object.entries(achievements()).map(([key,row])=>[key,projectPracticeAchievement(row)])),streak,topicDescriptor,recordAttempt,summary,updateStreak,evaluateAchievements,dueReviews,mistakes,markReviewResolved,masteryRows,weakTopics,startSession,patchSession,endSession,activeSession,recentSessions,setContinue,getContinue,clearContinue,selectAdaptive,adaptiveScore,adaptiveTarget,questionDifficulty,dailyPlan,earnedAchievements,exportStudentReport,resetLearningData};

  return Object.freeze({run(method,args=[]){
    if(!Array.isArray(args))throw new TypeError('Arguments must be an array');
    if(method==='initialize')return profile();
    if(!MUTATIONS.includes(method)&&!QUERIES.includes(method))throw new TypeError('Unsupported learning operation');
    return api[method](...args);
  },state:()=>structuredClone(state),effects:()=>structuredClone(effects),constants:()=>({VERSION,KEYS,COURSE_LABELS})});
}
