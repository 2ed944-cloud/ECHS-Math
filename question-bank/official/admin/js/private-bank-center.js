(async function(){
  "use strict";
  const status=document.getElementById("bankStatus"),purgeButton=document.getElementById("purgeIbBanks"),purgeResult=document.getElementById("purgeIbResult"),dangerZone=document.getElementById("ibDangerZone");
  const number=value=>new Intl.NumberFormat("en-GB").format(Number(value||0));
  const escapeHTML=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const courseLabels={"ap-calculus":"AP Calculus","ap-precalculus":"AP Precalculus","ib-math-ai":"IB Mathematics AI","algebra-2":"Algebra 2","grade-9":"Grade 9"};
  const visibleName=row=>{const aliases=row.display_aliases||{};return aliases.teacher||aliases.student||aliases["ap-calculus"]||aliases["ap-precalculus"]||aliases["ib-math-ai"]||row.bank_code||"Private Bank"};
  const targets=row=>{const declared=Array.isArray(row.manifest?.target_courses)?row.manifest.target_courses.filter(Boolean):[];if(declared.length)return[...new Set(declared)];const aliases=row.display_aliases||{};return Object.keys(aliases).filter(key=>courseLabels[key])};
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
  try{
    const current=await window.ECHSInstitution.requireAuth(["teacher","admin"]);if(!current)return;
    if(current.role==="admin")dangerZone.classList.remove("hidden");
    await load();
    purgeButton?.addEventListener("click",async()=>{
      const confirmation=prompt('Type DELETE IB AI to remove every existing IB Mathematics AI private bank and question mapping for this school.');
      if(confirmation!=="DELETE IB AI")return;
      purgeButton.disabled=true;purgeResult.classList.remove("hidden");purgeResult.textContent="Deleting IB Mathematics AI private banks, questions, and media…";
      try{
        const result=await window.ECHSInstitution.api("private-bank-api","/courses/ib-math-ai",{method:"DELETE"}),deleted=result.deleted||{},updated=result.updated||{};
        purgeResult.textContent=`Deleted ${number(deleted.packages)} packages, ${number(deleted.questions)} questions, ${number(deleted.media_objects)} media objects, and ${number(deleted.trust_records)} orphaned trust records. Removed ${number(updated.mappings_removed)} IB mappings from ${number(updated.mixed_packages)} mixed-course packages. Student history was preserved.`;
        await load();
      }catch(error){purgeResult.textContent=error instanceof Error?error.message:"Could not delete the IB Mathematics AI banks."}finally{purgeButton.disabled=false}
    });
  }catch(error){console.error(error);status.textContent=error instanceof Error?error.message:"Could not load the private bank registry."}
})();
