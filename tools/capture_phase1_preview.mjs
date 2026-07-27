import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase4-visual';
await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const routes=[
  {key:'home',path:'/index.html',ready:'#courses',hybridHero:true},
  {key:'login',path:'/login.html',ready:'#loginForm',premium:true},
  {key:'learning-home',path:'/question-bank/index.html',ready:'#roleEntryStatus'},
  {key:'adaptive-practice',path:'/question-bank/practice.html?mode=adaptive',ready:'#start',delay:6500},
  {key:'adaptive-practice-compact',path:'/question-bank/practice.html?mode=adaptive',ready:'#practiceBuilder',delay:1600,compactBuilder:true},
  {key:'test-generator',path:'/question-bank/exam.html',ready:'#start',delay:6500},
  {key:'local-student-dashboard',path:'/question-bank/dashboard.html',ready:'#dailyPlan'},
  {key:'mistake-bank',path:'/question-bank/mistakes.html',ready:'#reviewList'},
  {key:'account-administration',path:'/question-bank/admin.html',ready:'#accountRows',premium:true,dock:true},
  {key:'institutional-student',path:'/question-bank/student.html',ready:'#masteryMeter',premium:true,dock:true},
  {key:'teacher-dashboard',path:'/question-bank/teacher.html',ready:'#studentRows',premium:true,dock:true},
  {key:'parent-dashboard',path:'/question-bank/parent.html',ready:'#familyPlan',premium:true,dock:true},
  {key:'privacy',path:'/privacy.html',ready:'main'},
  {key:'accessibility',path:'/accessibility.html',ready:'main'}
];
const devices=[
  {key:'desktop',viewport:{width:1440,height:1000},isMobile:false},
  {key:'mobile',viewport:{width:390,height:844},isMobile:true}
];
const previewInstitutionConfig={enabled:false,api_base:'https://YOUR_PROJECT_REF.supabase.co/functions/v1',setup_api_base:'https://wkqadnfloiohqfnesmyq.supabase.co/functions/v1',setup_enabled:true,backend_deployed:true,setup_path:'setup.html',institution_name:'Education City High School',platform_name:'ECHS Mathematics',site_base:'https://2ed944-cloud.github.io/ECHS-Math/',support_email:'',session_storage:'local'};
const report={generatedAt:new Date().toISOString(),baseURL,pages:[],errors:[]};
for(const device of devices){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/config/institution.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(previewInstitutionConfig)}));
  for(const route of routes){
    const page=await context.newPage(),consoleErrors=[],pageErrors=[],failedRequests=[];
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
    const url=`${baseURL}${route.path}`,entry={device:device.key,route:route.key,url,consoleErrors,pageErrors,failedRequests,interactions:{}};
    try{
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});entry.status=response?.status()??null;
      await page.locator(route.ready).first().waitFor({state:'attached',timeout:30000});
      await page.waitForTimeout(route.delay||2200);
      if(route.hybridHero){
        await page.waitForFunction(()=>document.querySelector('.premiumIdentityVisual')?.dataset.hybridHeroReady==='true'&&window.ECHSLandingCalculus?.setPhase,null,{timeout:12000});
        const hybrid=await page.evaluate(()=>{
          const board=document.querySelector('.calculusMotionBoard'),card=document.querySelector('.compactSchoolIdentityCard'),traveller=document.querySelector('#heroTangentTraveller'),maximumGuide=document.querySelector('.maximumTangentGuide'),minimumGuide=document.querySelector('.minimumTangentGuide');
          const boardRect=board?.getBoundingClientRect(),cardRect=card?.getBoundingClientRect();
          return{board:Boolean(board),card:Boolean(card),traveller:Boolean(traveller),maximumGuide:Boolean(maximumGuide),minimumGuide:Boolean(minimumGuide),boardHeight:Math.round(boardRect?.height||0),cardHeight:Math.round(cardRect?.height||0),overlap:Boolean(boardRect&&cardRect&&cardRect.top<boardRect.bottom&&cardRect.top>boardRect.top)};
        });
        Object.assign(entry.interactions,{hybridCalculusHero:true,...hybrid});
        if(!hybrid.board||!hybrid.card||!hybrid.traveller||!hybrid.maximumGuide||!hybrid.minimumGuide)report.errors.push(`${route.key}/${device.key}: extrema calculus artwork is incomplete`);
        if(hybrid.boardHeight<200)report.errors.push(`${route.key}/${device.key}: calculus board is unexpectedly short (${hybrid.boardHeight}px)`);
        if(hybrid.cardHeight>350)report.errors.push(`${route.key}/${device.key}: compact ECHS card is too tall (${hybrid.cardHeight}px)`);
        if(!hybrid.overlap)report.errors.push(`${route.key}/${device.key}: ECHS card does not visually overlap the calculus board`);
        await page.locator('.calculusMotionBoard').scrollIntoViewIfNeeded();
        await page.waitForTimeout(140);

        for(const phase of ['maximum','minimum']){
          await page.evaluate(value=>window.ECHSLandingCalculus.setPhase(value),phase);
          await page.waitForFunction(value=>document.querySelector('.calculusMotionBoard')?.dataset.extremumPhase===value,phase,{timeout:5000});
          await page.waitForTimeout(420);
          const state=await page.evaluate(value=>{
            const active=document.querySelector(`[data-extremum-callout="${value}"]`);
            const other=document.querySelector(`[data-extremum-callout="${value==='maximum'?'minimum':'maximum'}"]`);
            const formula=document.getElementById('calculusBoardFormula')?.textContent||'';
            const transform=document.getElementById('heroTangentTraveller')?.getAttribute('transform')||'';
            return{activeOpacity:Number.parseFloat(getComputedStyle(active).opacity||'0'),otherOpacity:Number.parseFloat(getComputedStyle(other).opacity||'0'),formula,transform};
          },phase);
          entry.interactions[`${phase}Reveal`]=state;
          if(state.activeOpacity<.75)report.errors.push(`${route.key}/${device.key}: ${phase} callout did not appear`);
          if(state.otherOpacity>.25)report.errors.push(`${route.key}/${device.key}: inactive extremum callout remained visible during ${phase}`);
          const expectedFormula=phase==='maximum'?"f′(0) = 0":"f′(a) = 0";
          if(state.formula!==expectedFormula)report.errors.push(`${route.key}/${device.key}: ${phase} formula is ${state.formula||'missing'}`);
          if(!/translate\(.+\) rotate\(.+\)/.test(state.transform))report.errors.push(`${route.key}/${device.key}: tangent transform was not calculated during ${phase}`);
          const phaseScreenshot=path.join(outputDir,`${route.key}-calculus-${phase}-${device.key}.png`);
          await page.screenshot({path:phaseScreenshot,fullPage:false});
          entry.interactions[`${phase}Screenshot`]=phaseScreenshot;
        }
        await page.evaluate(()=>window.ECHSLandingCalculus.setPhase('maximum'));
        await page.waitForTimeout(420);
        await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      }
      if(route.compactBuilder){
        await page.locator('#builderToggle').waitFor({state:'attached',timeout:8000});
        await page.evaluate(()=>{
          document.body.classList.add('studentFocused');
          const shell=document.getElementById('shell');
          shell.innerHTML='<article class="questionCard"><div class="pillRow"><span class="pill wine">Question 1 of 10</span><span class="pill teal">AP Calculus Bank 2</span><span class="pill gold">Adaptive practice</span><span class="pill">Skill 1.1</span><span class="pill">Multiple choice</span></div><div class="progressTrack"><i style="width:10%"></i></div><h2>Introducing Calculus: Can Change Occur at an Instant?</h2><div class="prompt"><p>Representative question content for compact-builder visual verification.</p></div></article>';
        });
        await page.locator('#practiceBuilder.isCollapsed').waitFor({state:'attached',timeout:8000});
        const compactHeight=await page.locator('#practiceBuilder .studioPanel').evaluate(node=>Math.round(node.getBoundingClientRect().height));
        entry.interactions.compactPracticeBuilder=true;entry.interactions.compactBuilderHeight=compactHeight;
        if(compactHeight>100)report.errors.push(`${route.key}/${device.key}: compact builder is ${compactHeight}px high`);
        await page.locator('#builderAdjust').click();
        await page.waitForFunction(()=>!document.getElementById('practiceBuilder')?.classList.contains('isCollapsed'));
        entry.interactions.builderAdjust=true;
        await page.locator('#builderToggle').click();
        await page.waitForFunction(()=>document.getElementById('practiceBuilder')?.classList.contains('isCollapsed'));
        entry.interactions.builderRecollapsed=true;
      }
      if(route.premium){await page.waitForFunction(()=>document.documentElement.dataset.premiumCompletion==='ready',null,{timeout:15000});entry.interactions.completionReady=true;}
      entry.title=await page.title();entry.h1=await page.locator('h1').first().textContent().catch(()=>null);
      const geometry=await page.evaluate(()=>{const viewport=document.documentElement.clientWidth;const describe=element=>{const rect=element.getBoundingClientRect(),style=getComputedStyle(element),selector=element.id?`#${element.id}`:element.classList.length?`${element.tagName.toLowerCase()}.${[...element.classList].slice(0,3).join('.')}`:element.tagName.toLowerCase();return{selector,left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,display:style.display,position:style.position,overflowX:style.overflowX,minWidth:style.minWidth,maxWidth:style.maxWidth,whiteSpace:style.whiteSpace}};const offenders=[...document.querySelectorAll('body *')].filter(element=>{const style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden')return false;const rect=element.getBoundingClientRect();return rect.right>viewport+2||rect.left<-2||element.scrollWidth>Math.max(element.clientWidth+2,viewport+2)}).map(describe).sort((a,b)=>(b.right-viewport)-(a.right-viewport)).slice(0,25);return{bodyWidth:document.body.scrollWidth,documentWidth:document.documentElement.scrollWidth,viewport,offenders};});
      entry.bodyWidth=geometry.bodyWidth;entry.documentWidth=geometry.documentWidth;entry.viewportWidth=device.viewport.width;entry.horizontalOverflow=Math.max(entry.bodyWidth,entry.documentWidth)>device.viewport.width+2;entry.overflowOffenders=geometry.offenders;
      entry.theme=await page.evaluate(()=>document.documentElement.dataset.theme||'light');entry.institutionState=await page.evaluate(()=>document.documentElement.dataset.institution||'public');
      const screenshot=path.join(outputDir,`${route.key}-${device.key}.png`);await page.screenshot({path:screenshot,fullPage:true});entry.screenshot=screenshot;
      if(route.premium){await page.keyboard.press('Control+K');await page.locator('#premiumCommandDialog[open]').waitFor({state:'visible',timeout:8000});entry.interactions.commandPalette=true;const commandScreenshot=path.join(outputDir,`${route.key}-command-${device.key}.png`);await page.screenshot({path:commandScreenshot,fullPage:false});entry.interactions.commandScreenshot=commandScreenshot;await page.keyboard.press('Escape');await page.keyboard.press('Shift+/');await page.locator('#premiumGuideDrawer.open').waitFor({state:'visible',timeout:8000});entry.interactions.roleGuide=true;const guideScreenshot=path.join(outputDir,`${route.key}-guide-${device.key}.png`);await page.screenshot({path:guideScreenshot,fullPage:false});entry.interactions.guideScreenshot=guideScreenshot;await page.keyboard.press('Escape');if(device.isMobile&&route.dock){const dock=page.locator('.premiumMobileDock');entry.interactions.mobileDock=await dock.isVisible().catch(()=>false);if(!entry.interactions.mobileDock)report.errors.push(`${route.key}/${device.key}: premium mobile dock is not visible`);}}
      if(entry.status&&entry.status>=400)report.errors.push(`${route.key}/${device.key}: HTTP ${entry.status}`);
      if(entry.horizontalOverflow){const names=entry.overflowOffenders.slice(0,5).map(row=>`${row.selector}[${row.left},${row.right};w=${row.width};sw=${row.scrollWidth}]`).join(', ');report.errors.push(`${route.key}/${device.key}: horizontal overflow ${Math.max(entry.bodyWidth,entry.documentWidth)}px > ${device.viewport.width}px${names?` :: ${names}`:''}`);}
      if(pageErrors.length)report.errors.push(`${route.key}/${device.key}: ${pageErrors.join(' | ')}`);
      const relevant=consoleErrors.filter(message=>!/favicon|Failed to load resource.*fonts\.gstatic|net::ERR_BLOCKED_BY_CLIENT/i.test(message));if(relevant.length)report.errors.push(`${route.key}/${device.key}: console ${relevant.join(' | ')}`);
      const relevantFailures=failedRequests.filter(message=>!/fonts\.googleapis|fonts\.gstatic/i.test(message));if(relevantFailures.length)report.errors.push(`${route.key}/${device.key}: requests ${relevantFailures.join(' | ')}`);
    }catch(error){entry.captureError=error.message;report.errors.push(`${route.key}/${device.key}: capture failed: ${error.message}`);}finally{report.pages.push(entry);await page.close();}
  }
  await context.close();
}
await browser.close();
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;