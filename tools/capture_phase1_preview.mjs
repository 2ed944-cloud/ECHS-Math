import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase4-visual';
const routeFilter=process.env.ECHS_PREVIEW_ROUTES||'';
if(routeFilter&&process.env.CI)throw new Error('Partial visual captures are local diagnostics only; CI must cover every route');
await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const routes=[
  {key:'home',path:'/index.html',ready:'#courses',hybridHero:true},
  {key:'lesson-portal',path:'/preview.html',ready:'#units .lessonCardOpen',delay:1200,lessonPortal:true},
  {key:'login',path:'/login.html',ready:'#loginForm',premium:true},
  {key:'learning-home',path:'/question-bank/index.html',ready:'#roleEntryStatus'},
  {key:'adaptive-practice',path:'/question-bank/practice.html?mode=adaptive',ready:'#start',delay:6500},
  {key:'adaptive-practice-compact',path:'/question-bank/practice.html?mode=adaptive',ready:'#practiceBuilder',delay:1600,compactBuilder:true},
  {key:'test-generator',path:'/question-bank/exam.html',ready:'#start',delay:6500},
  {key:'local-student-dashboard',path:'/question-bank/dashboard.html',ready:'#dailyPlan'},
  {key:'mistake-bank',path:'/question-bank/mistakes.html',ready:'#reviewList'},
  {key:'account-administration',path:'/question-bank/admin.html',ready:'#accountRows',premium:true,dock:true},
  {key:'institutional-student',path:'/question-bank/student.html',ready:'#masteryMeter',premium:true,dock:true},
  {key:'teacher-dashboard',path:'/question-bank/teacher.html',ready:'#studentRows',premium:true,dock:true,evidenceHeatmap:true},
  {key:'parent-dashboard',path:'/question-bank/parent.html',ready:'#familyPlan',premium:true,dock:true},
  {key:'question-trust',path:'/question-bank/official/admin/question-trust.html',ready:'#trustStatus',trustCenter:true},
  {key:'privacy',path:'/privacy.html',ready:'main'},
  {key:'accessibility',path:'/accessibility.html',ready:'main'}
];
const devices=[
  {key:'desktop',viewport:{width:1440,height:1000},isMobile:false},
  {key:'mobile',viewport:{width:390,height:844},isMobile:true}
];
const previewInstitutionConfig={enabled:false,api_base:'https://YOUR_PROJECT_REF.supabase.co/functions/v1',setup_api_base:'https://wkqadnfloiohqfnesmyq.supabase.co/functions/v1',setup_enabled:true,backend_deployed:true,setup_path:'setup.html',institution_name:'Education City High School',platform_name:'ECHS Mathematics',site_base:'https://2ed944-cloud.github.io/ECHS-Math/',support_email:'',session_storage:'local'};
const teacherAccount={id:'t1',display_name:'Mohammad Abu Ghuwaleh',username:'m.abughuwaleh',role:'teacher',organization_name:'ECHS Mathematics',can_manage_accounts:true};
const evidenceFixture={ok:true,authoritative:true,class:{id:'c1',name:'AP Calculus · Period 1',course_key:'AP Calculus'},coverage:{students_with_evidence:3,students_total:4,percent:75},students:[{id:'s1',display_name:'Amina Hassan'},{id:'s2',display_name:'Yousef Ali'},{id:'s3',display_name:'Sara Omar'},{id:'s4',display_name:'Khalid Noor'}],skills:[{skill_key:'APCALC.U1.LIMIT.GRAPH',title:'Estimate limits from graphs',lesson_ids:['1.3'],average_score:74},{skill_key:'APCALC.U1.LIMIT.TABLE',title:'Estimate limits from numerical tables',lesson_ids:['1.4'],average_score:67},{skill_key:'APCALC.U1.CONTINUITY.POINT',title:'Justify continuity at a point',lesson_ids:['1.11'],average_score:58}],matrix:[{account_id:'s1',skill_key:'APCALC.U1.LIMIT.GRAPH',score:91,confidence:.84,attempts:12,independent_evidence:9,retention_evidence:3,transfer_evidence:2},{account_id:'s1',skill_key:'APCALC.U1.LIMIT.TABLE',score:78,confidence:.72,attempts:9,independent_evidence:7,retention_evidence:2,transfer_evidence:1},{account_id:'s2',skill_key:'APCALC.U1.LIMIT.GRAPH',score:72,confidence:.66,attempts:8,independent_evidence:6,retention_evidence:1,transfer_evidence:1},{account_id:'s2',skill_key:'APCALC.U1.CONTINUITY.POINT',score:63,confidence:.58,attempts:7,independent_evidence:5,retention_evidence:1,transfer_evidence:0},{account_id:'s3',skill_key:'APCALC.U1.LIMIT.TABLE',score:56,confidence:.52,attempts:6,independent_evidence:4,retention_evidence:0,transfer_evidence:0}]};
// Synthetic API responses use a real-shaped class ID; production correctly
// refuses to request evidence for preview labels such as "c1".
const evidenceClass={id:'00000000-0000-4000-8000-000000000004',name:'Synthetic Calculus Class',course_key:'ap-calculus',academic_year:'Synthetic QA',counts:{students:4}};
const evidenceTeacher={...teacherAccount,id:'00000000-0000-4000-8000-000000000005',organization_id:'00000000-0000-4000-8000-000000000002',status:'active',display_name:'Synthetic Teacher',username:'synthetic-teacher'};
const evidenceStudents=evidenceFixture.students.map((student,index)=>({...student,username:'synthetic-'+(index+1),mastery:[91,72,56,null][index],accuracy:[91,72,56,null][index],attempts:[12,8,6,0][index],open_mistakes:0,grade:'12',last_login_at:null}));
const evidenceDashboard={ok:true,class:evidenceClass,summary:{students:4,active_this_week:0,average_mastery:73,average_accuracy:73,need_support:1,mastered_topics:0},students:evidenceStudents,assignments:[],support_priorities:[]};
const report={generatedAt:new Date().toISOString(),baseURL,pages:[],errors:[]};
report.partialDiagnostic=Boolean(routeFilter);
for(const device of devices){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/config/institution.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(previewInstitutionConfig)}));
  for(const route of routes){
    if(routeFilter&&!routeFilter.split(',').includes(route.key))continue;
    const page=await context.newPage(),consoleErrors=[],pageErrors=[],failedRequests=[],expectedEvidenceConsole=[];
    let evidenceUnavailable=false,expectedEvidence503=0;
    page.on('console',message=>{if(message.type()==='error'){
      // Preserve only the exact synthetic503 diagnostics separately. Every other
      // console error, including an unexpected503 on another URL, still fails.
      if(route.evidenceHeatmap&&expectedEvidenceConsole.length<expectedEvidence503&&message.location().url===`${baseURL}/functions/v1/mastery-evidence/classes/${evidenceClass.id}`&&/^Failed to load resource: the server responded with a status of 503 \(Service Unavailable\)$/.test(message.text()))expectedEvidenceConsole.push(message.text());
      else consoleErrors.push(message.text());
    }});
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
    if(route.evidenceHeatmap){
      await page.addInitScript(account=>{localStorage.setItem('echs_institution_token_v1','synthetic-visual-teacher');localStorage.setItem('echs_institution_account_v1',JSON.stringify(account));localStorage.setItem('echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString());},evidenceTeacher);
      await page.route('**/config/institution.json*',request=>request.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...previewInstitutionConfig,enabled:true,api_base:`${baseURL}/functions/v1`})}));
      await page.route('**/functions/v1/**',request=>{
        const apiPath=new URL(request.request().url()).pathname.split('/functions/v1/')[1];
        const send=(body,status=200)=>request.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
        if(request.request().method()!=='GET'){report.errors.push('Teacher fixture attempted a write: '+apiPath);return send({ok:false},405);}
        if(apiPath==='account-api/me')return send({ok:true,account:evidenceTeacher});
        if(apiPath==='account-api/accounts')return send({ok:true,accounts:evidenceStudents});
        if(apiPath==='institution-api/classes')return send({ok:true,classes:[evidenceClass]});
        if(apiPath===`institution-api/classes/${evidenceClass.id}/dashboard`)return send(evidenceDashboard);
        if(apiPath===`institution-api/classes/${evidenceClass.id}/lesson-access`)return send({ok:true,lessons:[]});
        if(apiPath===`mastery-evidence/classes/${evidenceClass.id}`){if(evidenceUnavailable)expectedEvidence503++;return send(evidenceUnavailable?{ok:false,error:{message:'Synthetic evidence unavailable'}}:{...evidenceFixture,class:evidenceClass},evidenceUnavailable?503:200);}
        if(apiPath==='institution-api/timetable')return send({ok:true,entries:[]});
        if(apiPath==='practice-bank-api/inventory')return send({ok:true,banks:[]});
        report.errors.push('Unexpected teacher fixture API: '+apiPath);return send({ok:false},400);
      });
    }
    if(route.trustCenter){
      await page.addInitScript(account=>{localStorage.setItem('echs_institution_token_v1','visual-qa-token');localStorage.setItem('echs_institution_account_v1',JSON.stringify(account));localStorage.setItem('echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString())},teacherAccount);
      const configured={...previewInstitutionConfig,enabled:true,api_base:`${baseURL}/functions/v1`};
      await page.route('**/config/institution.json*',request=>request.fulfill({status:200,contentType:'application/json',body:JSON.stringify(configured)}));
      await page.route('**/functions/v1/account-api/me*',request=>request.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,account:teacherAccount})}));
    }
    const url=`${baseURL}${route.path}`,entry={device:device.key,route:route.key,url,consoleErrors,pageErrors,failedRequests,interactions:{}};
    try{
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});entry.status=response?.status()??null;
      await page.locator(route.ready).first().waitFor({state:'attached',timeout:30000});
      await page.waitForTimeout(route.delay||2200);
      if(route.trustCenter){
        await page.locator('#trustStatus').filter({hasText:'Authorised as teacher'}).waitFor({state:'visible',timeout:12000});
        const trust=await page.evaluate(()=>({canonical:document.getElementById('canonicalCount')?.textContent,ready:document.getElementById('readyCount')?.textContent,restricted:document.getElementById('restrictedCount')?.textContent,tiers:document.querySelectorAll('.trustTier').length,gates:document.querySelectorAll('#releaseGate>div').length}));
        Object.assign(entry.interactions,{questionTrust:true,...trust});
        if(trust.canonical!=='1,217'||trust.ready!=='1,104'||trust.restricted!=='113'||trust.tiers<4||trust.gates<5)report.errors.push(`${route.key}/${device.key}: Question Trust Center did not render the audited boundary`);
      }
      if(route.evidenceHeatmap){
        // Locator waits do not eval a page predicate under the unchanged CSP.
        const heatmap=page.locator('#classHeatmap[data-grading-authoritative="false"]');
        await heatmap.locator('.evidenceLegend').filter({hasText:'Provisional practice'}).waitFor({state:'visible',timeout:12000});
        evidenceUnavailable=true;
        await page.locator('#classSelector').dispatchEvent('change');
        await heatmap.locator('.evidenceHeatmapMessage').filter({hasText:'Synthetic evidence unavailable'}).waitFor({state:'visible',timeout:12000});
        if(await heatmap.locator('.evidenceCell').count())report.errors.push(`${route.key}/${device.key}: unavailable evidence retained prior scores`);
        entry.interactions.unavailableEvidenceCleared=true;
        entry.interactions.expectedEvidence503Responses=expectedEvidence503;
        entry.interactions.expectedEvidenceConsole=expectedEvidenceConsole;
        if(expectedEvidence503<1)throw new Error('Unavailable-state check did not reach the synthetic evidence API');
        evidenceUnavailable=false;
        await page.locator('#classSelector').dispatchEvent('change');
        await heatmap.locator('.evidenceLegend').filter({hasText:'Provisional practice'}).waitFor({state:'visible',timeout:12000});
        const evidence=await page.evaluate(()=>({cells:document.querySelectorAll('#classHeatmap .evidenceCell').length,realCells:document.querySelectorAll('#classHeatmap .evidenceCell:not(.noEvidence)').length,noEvidence:document.querySelectorAll('#classHeatmap .evidenceCell.noEvidence').length,coverage:document.getElementById('coverageMetric')?.textContent,legend:document.querySelector('.evidenceLegend')?.textContent||'',sample:document.querySelector('#classHeatmap .evidenceCell:not(.noEvidence)')?.getAttribute('title')||''}));
        const scores=await heatmap.locator('.evidenceCell:not(.noEvidence) strong').allTextContents();
        const missing=await heatmap.locator('.evidenceCell.noEvidence').allTextContents();
        Object.assign(entry.interactions,{provisionalHeatmap:true,gradingAuthoritative:false,...evidence,scores});
        if(evidence.cells!==12||evidence.realCells!==5||evidence.noEvidence!==7||evidence.coverage!=='75%'||!evidence.legend.includes('Provisional practice')||!evidence.legend.includes('Verified mastery is unavailable')||!evidence.sample.includes('recorded confidence')||!evidence.sample.includes('authenticated grading unavailable')||JSON.stringify(scores)!==JSON.stringify(['91','78','72','63','56'])||missing.some(value=>value!=='—')||await heatmap.locator('.mastered').count())report.errors.push(`${route.key}/${device.key}: provisional evidence heatmap is incomplete or claims certification`);
      }
      if(route.hybridHero){
        await page.locator('.premiumIdentityVisual[data-hybrid-hero-ready="true"]').waitFor({state:'attached',timeout:12000});
        if(!await page.evaluate(()=>typeof window.ECHSLandingCalculus?.setPhase==='function'))throw new Error('Calculus hero controls did not initialize');
        const hybrid=await page.evaluate(()=>{const board=document.querySelector('.calculusMotionBoard'),card=document.querySelector('.compactSchoolIdentityCard'),traveller=document.querySelector('#heroTangentTraveller'),maximumGuide=document.querySelector('.maximumTangentGuide'),minimumGuide=document.querySelector('.minimumTangentGuide');const boardRect=board?.getBoundingClientRect(),cardRect=card?.getBoundingClientRect();return{board:Boolean(board),card:Boolean(card),traveller:Boolean(traveller),maximumGuide:Boolean(maximumGuide),minimumGuide:Boolean(minimumGuide),boardHeight:Math.round(boardRect?.height||0),cardHeight:Math.round(cardRect?.height||0),overlap:Boolean(boardRect&&cardRect&&cardRect.top<boardRect.bottom&&cardRect.top>boardRect.top)}});
        Object.assign(entry.interactions,{hybridCalculusHero:true,...hybrid});
        if(!hybrid.board||!hybrid.card||!hybrid.traveller||!hybrid.maximumGuide||!hybrid.minimumGuide)report.errors.push(`${route.key}/${device.key}: extrema calculus artwork is incomplete`);
        if(hybrid.boardHeight<200)report.errors.push(`${route.key}/${device.key}: calculus board is unexpectedly short (${hybrid.boardHeight}px)`);
        if(hybrid.cardHeight>350)report.errors.push(`${route.key}/${device.key}: compact ECHS card is too tall (${hybrid.cardHeight}px)`);
        if(hybrid.overlap)report.errors.push(`${route.key}/${device.key}: ECHS card overlaps the calculus board instead of remaining below it`);
        await page.locator('.calculusMotionBoard').scrollIntoViewIfNeeded();await page.waitForTimeout(140);
        for(const phase of ['maximum','minimum']){await page.evaluate(value=>window.ECHSLandingCalculus.setPhase(value),phase);await page.waitForTimeout(120);await page.waitForTimeout(420);const state=await page.evaluate(value=>{const active=document.querySelector(`[data-extremum-callout="${value}"]`),other=document.querySelector(`[data-extremum-callout="${value==='maximum'?'minimum':'maximum'}"]`),formula=document.getElementById('calculusBoardFormula')?.textContent||'',transform=document.getElementById('heroTangentTraveller')?.getAttribute('transform')||'';return{activeOpacity:Number.parseFloat(getComputedStyle(active).opacity||'0'),otherOpacity:Number.parseFloat(getComputedStyle(other).opacity||'0'),formula,transform}},phase);entry.interactions[`${phase}Reveal`]=state;if(state.activeOpacity<.75)report.errors.push(`${route.key}/${device.key}: ${phase} callout did not appear`);if(state.otherOpacity>.25)report.errors.push(`${route.key}/${device.key}: inactive extremum callout remained visible during ${phase}`);const expectedFormula=phase==='maximum'?"f′(0) = 0":"f′(a) = 0";if(state.formula!==expectedFormula)report.errors.push(`${route.key}/${device.key}: ${phase} formula is ${state.formula||'missing'}`);if(!/translate\(.+\) rotate\(.+\)/.test(state.transform))report.errors.push(`${route.key}/${device.key}: tangent transform was not calculated during ${phase}`);const phaseScreenshot=path.join(outputDir,`${route.key}-calculus-${phase}-${device.key}.png`);await page.screenshot({path:phaseScreenshot,fullPage:false});entry.interactions[`${phase}Screenshot`]=phaseScreenshot}await page.evaluate(()=>window.ECHSLandingCalculus.setPhase('maximum'));await page.waitForTimeout(420);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      }
      if(route.compactBuilder){await page.locator('#builderToggle').waitFor({state:'attached',timeout:8000});await page.evaluate(()=>{document.body.classList.add('studentFocused');const shell=document.getElementById('shell');shell.innerHTML='<article class="questionCard"><div class="pillRow"><span class="pill wine">Question 1 of 10</span><span class="pill teal">AP Calculus Bank 2</span><span class="pill gold">Adaptive practice</span><span class="pill">Skill 1.1</span><span class="pill">Multiple choice</span></div><div class="progressTrack"><i style="width:10%"></i></div><h2>Introducing Calculus: Can Change Occur at an Instant?</h2><div class="prompt"><p>Representative question content for compact-builder visual verification.</p></div></article>'});await page.locator('#practiceBuilder.isCollapsed').waitFor({state:'attached',timeout:8000});const compactHeight=await page.locator('#practiceBuilder .studioPanel').evaluate(node=>Math.round(node.getBoundingClientRect().height));entry.interactions.compactPracticeBuilder=true;entry.interactions.compactBuilderHeight=compactHeight;if(compactHeight>100)report.errors.push(`${route.key}/${device.key}: compact builder is ${compactHeight}px high`);await page.locator('#builderAdjust').click();await page.locator('#practiceBuilder:not(.isCollapsed)').waitFor({state:'attached'});entry.interactions.builderAdjust=true;await page.locator('#builderToggle').click();await page.locator('#practiceBuilder.isCollapsed').waitFor({state:'attached'});entry.interactions.builderRecollapsed=true}
      if(route.lessonPortal){await page.locator('#smartRoute-lessons .slrDecision').waitFor({state:'attached',timeout:8000});const calm=await page.evaluate(()=>{const first=document.querySelector('#units .lesson'),unit=document.querySelector('#units .unitHeader'),hero=document.querySelector('.lessonPortalHero'),command=document.querySelector('#lessonCommand'),identity=document.querySelector('.calmIdentityBanner'),smartRoute=document.querySelector('#smartRoute-lessons');return{cards:document.querySelectorAll('#units .lessonCardOpen').length,firstLessonTop:Math.round((first?.getBoundingClientRect().top||0)+scrollY),cardHeight:Math.round(first?.getBoundingClientRect().height||0),unitHeaderHeight:Math.round(unit?.getBoundingClientRect().height||0),heroDisplay:hero?getComputedStyle(hero).display:'missing',commandDisplay:command?getComputedStyle(command).display:'missing',identityBanner:Boolean(identity),identityDisplay:identity?getComputedStyle(identity).display:'missing',identityHeight:Math.round(identity?.getBoundingClientRect().height||0),smartRouteDisplay:smartRoute?getComputedStyle(smartRoute).display:'missing',smartRouteHeight:Math.round(smartRoute?.getBoundingClientRect().height||0),smartRouteTitle:smartRoute?.querySelector('.slrDecision h3')?.textContent?.trim()||'',routeScaleCount:smartRoute?.querySelectorAll('.slrMiniRoute>span').length||0}});Object.assign(entry.interactions,{lessonFirstPortal:true,...calm});const maxTop=device.isMobile?820:720,maxIdentity=device.isMobile?220:170,maxRoute=device.isMobile?160:105;if(calm.cards<1)report.errors.push(`${route.key}/${device.key}: no compact lesson cards rendered`);if(calm.firstLessonTop>maxTop)report.errors.push(`${route.key}/${device.key}: first lesson begins at ${calm.firstLessonTop}px instead of within ${maxTop}px`);if(calm.cardHeight>140)report.errors.push(`${route.key}/${device.key}: compact lesson card is ${calm.cardHeight}px high`);if(calm.unitHeaderHeight>92)report.errors.push(`${route.key}/${device.key}: unit header is ${calm.unitHeaderHeight}px high`);if(calm.heroDisplay!=='none'||calm.commandDisplay!=='none')report.errors.push(`${route.key}/${device.key}: legacy hero or command panel remains visible`);if(!calm.identityBanner||calm.identityDisplay==='none'||calm.identityHeight>maxIdentity)report.errors.push(`${route.key}/${device.key}: compact maroon identity banner is missing or too tall (${calm.identityHeight}px)`);if(calm.smartRouteDisplay==='none'||!calm.smartRouteTitle||calm.smartRouteHeight>maxRoute||calm.routeScaleCount!==3)report.errors.push(`${route.key}/${device.key}: compact Smart Learning Route is missing or too tall (${calm.smartRouteHeight}px)`);await page.locator('#units .lessonCardOpen').first().click();await page.locator('#lessonDetailDialog[open]').waitFor({state:'visible',timeout:8000});const drawer=await page.evaluate(()=>{const dialog=document.getElementById('lessonDetailDialog'),surface=dialog?.querySelector('.lessonDrawerSurface'),rect=surface?.getBoundingClientRect();return{open:Boolean(dialog?.open),width:Math.round(rect?.width||0),objectives:dialog?.querySelectorAll('.objectiveBlock li').length||0,actions:dialog?.querySelectorAll('.lessonActions a,.lessonActions button').length||0,bodyLocked:document.documentElement.classList.contains('lessonDrawerOpen')}});entry.interactions.lessonDrawer=drawer;if(!drawer.open||!drawer.bodyLocked||drawer.objectives<1||drawer.actions<1)report.errors.push(`${route.key}/${device.key}: lesson details drawer is incomplete`);if(device.isMobile&&drawer.width<device.viewport.width-2)report.errors.push(`${route.key}/${device.key}: mobile lesson drawer does not fill the screen`);const drawerScreenshot=path.join(outputDir,`${route.key}-drawer-${device.key}.png`);await page.screenshot({path:drawerScreenshot,fullPage:false});entry.interactions.lessonDrawerScreenshot=drawerScreenshot;await page.locator('.lessonDrawerClose').click();await page.locator('#lessonDetailDialog').waitFor({state:'hidden',timeout:8000})}
      if(route.premium){await page.locator('html[data-premium-completion="ready"]').waitFor({state:'attached',timeout:15000});entry.interactions.completionReady=true}
      entry.title=await page.title();entry.h1=await page.locator('h1').first().textContent().catch(()=>null);
      const geometry=await page.evaluate(()=>{const viewport=document.documentElement.clientWidth;const describe=element=>{const rect=element.getBoundingClientRect(),style=getComputedStyle(element),selector=element.id?`#${element.id}`:element.classList.length?`${element.tagName.toLowerCase()}.${[...element.classList].slice(0,3).join('.')}`:element.tagName.toLowerCase();return{selector,left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,display:style.display,position:style.position,overflowX:style.overflowX,minWidth:style.minWidth,maxWidth:style.maxWidth,whiteSpace:style.whiteSpace}};const offenders=[...document.querySelectorAll('body *')].filter(element=>{const style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden')return false;const rect=element.getBoundingClientRect();return rect.right>viewport+2||rect.left<-2||element.scrollWidth>Math.max(element.clientWidth+2,viewport+2)}).map(describe).sort((a,b)=>(b.right-viewport)-(a.right-viewport)).slice(0,25);return{bodyWidth:document.body.scrollWidth,documentWidth:document.documentElement.scrollWidth,viewport,offenders}});
      entry.bodyWidth=geometry.bodyWidth;entry.documentWidth=geometry.documentWidth;entry.viewportWidth=device.viewport.width;entry.horizontalOverflow=Math.max(entry.bodyWidth,entry.documentWidth)>device.viewport.width+2;entry.overflowOffenders=geometry.offenders;entry.theme=await page.evaluate(()=>document.documentElement.dataset.theme||'light');entry.institutionState=await page.evaluate(()=>document.documentElement.dataset.institution||'public');const screenshot=path.join(outputDir,`${route.key}-${device.key}.png`);await page.screenshot({path:screenshot,fullPage:true});entry.screenshot=screenshot;
      if(route.premium){await page.keyboard.press('Control+K');await page.locator('#premiumCommandDialog[open]').waitFor({state:'visible',timeout:8000});entry.interactions.commandPalette=true;const commandScreenshot=path.join(outputDir,`${route.key}-command-${device.key}.png`);await page.screenshot({path:commandScreenshot,fullPage:false});entry.interactions.commandScreenshot=commandScreenshot;await page.keyboard.press('Escape');await page.keyboard.press('Shift+/');await page.locator('#premiumGuideDrawer.open').waitFor({state:'visible',timeout:8000});entry.interactions.roleGuide=true;const guideScreenshot=path.join(outputDir,`${route.key}-guide-${device.key}.png`);await page.screenshot({path:guideScreenshot,fullPage:false});entry.interactions.guideScreenshot=guideScreenshot;await page.keyboard.press('Escape');if(device.isMobile&&route.dock){const dock=page.locator('.premiumMobileDock');entry.interactions.mobileDock=await dock.isVisible().catch(()=>false);if(!entry.interactions.mobileDock)report.errors.push(`${route.key}/${device.key}: premium mobile dock is not visible`)}}
      if(entry.status&&entry.status>=400)report.errors.push(`${route.key}/${device.key}: HTTP ${entry.status}`);if(entry.horizontalOverflow){const names=entry.overflowOffenders.slice(0,5).map(row=>`${row.selector}[${row.left},${row.right};w=${row.width};sw=${row.scrollWidth}]`).join(', ');report.errors.push(`${route.key}/${device.key}: horizontal overflow ${Math.max(entry.bodyWidth,entry.documentWidth)}px > ${device.viewport.width}px${names?` :: ${names}`:''}`)}if(pageErrors.length)report.errors.push(`${route.key}/${device.key}: ${pageErrors.join(' | ')}`);const relevant=consoleErrors.filter(message=>!/favicon|Failed to load resource.*fonts\.gstatic|net::ERR_BLOCKED_BY_CLIENT/i.test(message));if(relevant.length)report.errors.push(`${route.key}/${device.key}: console ${relevant.join(' | ')}`);const relevantFailures=failedRequests.filter(message=>!/fonts\.googleapis|fonts\.gstatic/i.test(message));if(relevantFailures.length)report.errors.push(`${route.key}/${device.key}: requests ${relevantFailures.join(' | ')}`)
    }catch(error){entry.captureError=error.message;report.errors.push(`${route.key}/${device.key}: capture failed: ${error.message}`)}finally{report.pages.push(entry);await page.close()}
  }
  await context.close();
}
await browser.close();
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
