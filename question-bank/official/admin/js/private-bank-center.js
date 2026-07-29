(async function(){
  "use strict";
  const status=document.getElementById("bankStatus"),purgeButton=document.getElementById("purgeIbBanks"),purgeResult=document.getElementById("purgeIbResult"),dangerZone=document.getElementById("ibDangerZone");
  const number=value=>new Intl.NumberFormat("en-GB").format(Number(value||0));
  const escapeHTML=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const courseLabels={"ap-calculus":"AP Calculus","ap-precalculus":"AP Precalculus","ib-math-ai":"IB Mathematics AI","algebra-2":"Algebra 2","grade-9":"Grade 9"};
  const visibleName=row=>{const aliases=row.display_aliases||{};return aliases.teacher||aliases.student||aliases["ap-calculus"]||aliases["ap-precalculus"]||aliases["ib-math-ai"]||row.bank_code||"Private Bank"};
  const targets=row=>{const declared=Array.isArray(row.manifest?.target_courses)?row.manifest.target_courses.filter(Boolean):[];if(declared.length)return[...new Set(declared)];const aliases={...(row.display_aliases||{}),...(row.manifest?.display_aliases||{})};return Object.keys(aliases).filter(key=>courseLabels[key])};
  const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));

  async function load(){
    const [registryResult,alignmentResult,liveResult]=await Promise.allSettled([
      fetch("../../private-sources/data/private-bank-registry.json",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject(new Error(`Private bank registry returned ${response.status}`))),
      fetch("../../private-sources/data/private-bank-alignment-summary.json",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject(new Error(`Private bank alignment summary returned ${response.status}`))),
      window.ECHSInstitution.api("private-bank-api","/packages")
    ]);
    const registry=registryResult.status==="fulfilled"?registryResult.value:{banks:[],totals:{}},alignment=alignmentResult.status==="fulfilled"?alignmentResult.value:{},livePackages=liveResult.status==="fulfilled"&&Array.isArray(liveResult.value?.packages)?liveResult.value.packages:[];
    const liveByCode=new Map(livePackages.map(row=>[row.bank_code,row])),merged=[];
    for(const bank of registry.banks||[]){const live=liveByCode.get(bank.bank_code)||{};merged.push({...bank,...live,display_aliases:{...(bank.display_aliases||{}),...(live.display_aliases||{})},manifest:live.manifest||bank.manifest||null});liveByCode.delete(bank.bank_code)}
    for(const live of liveByCode.values())merged.push(live);
    merged.sort((a,b)=>visibleName(a).localeCompare(visibleName(b),"en"));
    const totals=merged.reduce((acc,row)=>{acc.questions+=Number(row.question_count??row.questions??row.manifest?.questions??0);acc.pools+=Number(row.pool_count??row.pools??row.manifest?.pools??0);acc.media+=Number(row.media_count??row.media_files??row.manifest?.media_files??0);return acc},{questions:0,pools:0,media:0});
    document.getElementById("bankTotal").textContent=number(merged.length);document.getElementById("questionTotal").textContent=number(totals.questions);document.getElementById("poolTotal").textContent=number(totals.pools);document.getElementById("mediaTotal").textContent=number(totals.media);
    const ap=alignment["ap-precalculus"]||{},ib=alignment["ib-math-ai"]||{};
    document.getElementById("apLessons").textContent=number(ap.lesson_catalog_topics||50);document.getElementById("apReadiness").textContent=number(ap.exact_counts?.unit_0_readiness);document.getElementById("apVerified").textContent=number(alignment.exact_question_mappings_per_course);
    document.getElementById("ibLessons").textContent=number(ib.lesson_catalog_lessons||30);document.getElementById("ibReadiness").textContent=number(ib.exact_counts?.unit_0_readiness);document.getElementById("ibVerified").textContent=number(merged.filter(row=>targets(row).includes("ib-math-ai")).reduce((sum,row)=>sum+Number(row.question_count??row.questions??row.manifest?.questions??0),0));
    const calc=merged.filter(row=>targets(row).includes("ap-calculus")),calcQuestions=calc.reduce((sum,row)=>sum+Number(row.question_count??row.questions??row.manifest?.questions??0),0),calcReadiness=calc.reduce((sum,row)=>sum+Number(row.manifest?.mapping_counts?.["ap-calculus:U0"]||0),0);
    document.getElementById("calcBanks").textContent=number(calc.length);document.getElementById("calcReadiness").textContent=number(calcReadiness);document.getElementById("calcVerified").textContent=number(calcQuestions);
    const grid=document.getElementById("bankGrid");
    grid.innerHTML=merged.length?merged.map(bank=>{const types=bank.question_types||bank.manifest?.question_types||{},state=bank.deployment_state||"pending-private-upload",questions=Number(bank.question_count??bank.questions??bank.manifest?.questions??0),pools=Number(bank.pool_count??bank.pools??bank.manifest?.pools??0),media=Number(bank.media_count??bank.media_files??bank.manifest?.media_files??0),aliases=bank.display_aliases||{},aliasValues=["student","teacher","ap-calculus","ap-precalculus","ib-math-ai","algebra-2","grade-9"].map(key=>aliases[key]).filter(Boolean),tagValues=[...new Set([...aliasValues,...targets(bank).map(course=>courseLabels[course]||course)])],targetTags=tagValues.map(value=>`<span>${escapeHTML(value)}</span>`).join("")||'<span>Manifest target pending</span>',openResponse=Number(types.essay||0)+Number(types.fill_blank||0);return `<article class="bankCard"><div class="bankCardTop"><div><small>${escapeHTML(bank.bank_code||"")}</small><h2>${escapeHTML(visibleName(bank))}</h2><div class="bankAliases">${targetTags}</div></div><span class="bankState">${escapeHTML(String(state).replaceAll("-"," "))}</span></div><div class="bankMetrics"><div><strong>${number(questions)}</strong><small>questions</small></div><div><strong>${number(pools)}</strong><small>pools</small></div><div><strong>${number(media)}</strong><small>media</small></div><div><strong>${number(openResponse)}</strong><small>open response</small></div></div><div class="bankFooter"><span>SHA-256 ${escapeHTML(String(bank.package_sha256||"").slice(0,12))}${bank.package_sha256?"…":""}</span><span class="bankTrust">Private · verified mapping</span></div></article>`}).join(""):'<article class="bankCard"><h2>No private banks registered yet</h2><p>Open Upload Manager and upload a validated private-bank ZIP.</p></article>';
    const ibPackages=livePackages.filter(row=>targets(row).includes("ib-math-ai"));
    status.textContent=livePackages.length?`Private backend connected. ${number(livePackages.length)} live packages are registered. ${number(ibPackages.length)} target IB Mathematics AI.`:"Static registry loaded. No live private packages were returned.";
    return {livePackages,ibPackages};
  }

  function renderPurge(job,{retrying=false}={}){
    const totals=job?.totals||{},progress=job?.progress||{},percent=Math.max(0,Math.min(100,Number(job?.percent||0)));
    const phase=retrying?`Retrying ${job?.phase_label||"the current batch"}…`:(job?.phase_label||"Preparing the reset…");
    const questionsDone=Number(progress.questions_processed||0),questionsTotal=Number(totals.questions||0),mediaDone=Number(progress.media_deleted||0),mediaTotal=Number(totals.media||0),packagesDone=Number(progress.packages_deleted||0)+Number(progress.mixed_packages_updated||0),packagesTotal=Number(totals.packages||0);
    purgeResult.classList.remove("hidden");
    purgeResult.innerHTML=`<div class="purgeResultHead"><strong>${escapeHTML(phase)}</strong><span>${percent}%</span></div><div class="purgeProgress" aria-label="IB reset progress"><i style="width:${percent}%"></i></div><div class="purgeMetrics"><span><b>${number(questionsDone)}</b> / ${number(questionsTotal)} questions</span><span><b>${number(mediaDone)}</b> / ${number(mediaTotal)} media</span><span><b>${number(packagesDone)}</b> / ${number(packagesTotal)} packages</span></div><small>Job ${escapeHTML(job?.id||"pending")} · safely resumable after refresh or temporary network interruption.</small>`;
  }

  function retryable(error){
    const statusCode=Number(error?.status||0),message=String(error?.message||"").toLowerCase();
    return !statusCode||[408,425,429,500,502,503,504,546].includes(statusCode)||/timeout|cpu time|temporar|network|fetch/.test(message);
  }

  async function runPurge(initialJob){
    let job=initialJob,retries=0,steps=0;
    while(job?.status!=="completed"){
      if(++steps>10000)throw new Error("The reset exceeded its safety step limit. Click the button again to resume the same job.");
      renderPurge(job);
      try{
        const result=await window.ECHSInstitution.api("private-bank-purge-api",`/jobs/${encodeURIComponent(job.id)}/step`,{method:"POST",body:{}});
        job=result.job;retries=0;
        await sleep(80);
      }catch(error){
        if(!retryable(error)||retries>=6)throw error;
        retries+=1;renderPurge(job,{retrying:true});await sleep(Math.min(8000,750*(2**retries)));
      }
    }
    renderPurge(job);
    purgeResult.insertAdjacentHTML("beforeend",'<p class="purgeComplete"><strong>IB Mathematics AI reset completed.</strong> All remaining IB package links were verified as removed. Student attempt and mastery history was preserved.</p>');
    await load();
    return job;
  }

  try{
    const current=await window.ECHSInstitution.requireAuth(["teacher","admin"]);if(!current)return;
    if(current.role==="admin")dangerZone.classList.remove("hidden");
    await load();
    purgeButton?.addEventListener("click",async()=>{
      const confirmation=prompt('Type DELETE IB AI to remove every existing IB Mathematics AI private bank and question mapping for this school.');
      if(confirmation!=="DELETE IB AI")return;
      purgeButton.disabled=true;purgeButton.textContent="IB AI reset in progress…";purgeResult.classList.remove("hidden");purgeResult.textContent="Creating or resuming the protected IB Mathematics AI reset job…";
      try{
        const startResult=await window.ECHSInstitution.api("private-bank-purge-api","/courses/ib-math-ai",{method:"DELETE"});
        await runPurge(startResult.job);
        purgeButton.textContent="IB AI banks and questions deleted";
      }catch(error){
        console.error(error);purgeResult.classList.remove("hidden");purgeResult.innerHTML=`<strong>Reset paused safely.</strong><br>${escapeHTML(error instanceof Error?error.message:"Could not continue the IB Mathematics AI reset.")}<br><small>Click the button again and enter DELETE IB AI to resume from the last completed batch.</small>`;
        purgeButton.disabled=false;purgeButton.textContent="Resume deleting existing IB AI banks and questions";
      }
    });
  }catch(error){console.error(error);status.textContent=error instanceof Error?error.message:"Could not load the private bank registry."}
})();
