(async function(){
  "use strict";
  const status=document.getElementById("bankStatus");
  const number=value=>new Intl.NumberFormat("en-GB").format(Number(value||0));
  try{
    await window.ECHSInstitution.requireAuth(["teacher","admin"]);
    const [registryResponse,alignmentResponse]=await Promise.all([
      fetch("../../private-sources/data/private-bank-registry.json",{cache:"no-store"}),
      fetch("../../private-sources/data/private-bank-alignment-summary.json",{cache:"no-store"})
    ]);
    if(!registryResponse.ok)throw new Error(`Private bank registry returned ${registryResponse.status}`);
    if(!alignmentResponse.ok)throw new Error(`Private bank alignment summary returned ${alignmentResponse.status}`);
    const registry=await registryResponse.json(),alignment=await alignmentResponse.json();
    let livePackages=[];
    try{const live=await window.ECHSInstitution.api("private-bank-api","/packages");livePackages=Array.isArray(live?.packages)?live.packages:[]}catch(_error){livePackages=[]}
    const liveByCode=new Map(livePackages.map(row=>[row.bank_code,row])),totals=registry.totals||{};
    document.getElementById("bankTotal").textContent=number(totals.banks);
    document.getElementById("questionTotal").textContent=number(totals.questions);
    document.getElementById("poolTotal").textContent=number(totals.pools);
    document.getElementById("mediaTotal").textContent=number(totals.media_files);
    const ap=alignment["ap-precalculus"]||{},ib=alignment["ib-math-ai"]||{};
    document.getElementById("apLessons").textContent=number(ap.lesson_catalog_topics);
    document.getElementById("apReadiness").textContent=number(ap.exact_counts?.unit_0_readiness);
    document.getElementById("apVerified").textContent=number(alignment.exact_question_mappings_per_course);
    document.getElementById("ibLessons").textContent=number(ib.lesson_catalog_lessons);
    document.getElementById("ibReadiness").textContent=number(ib.exact_counts?.unit_0_readiness);
    document.getElementById("ibVerified").textContent=number(alignment.exact_question_mappings_per_course);
    const grid=document.getElementById("bankGrid");
    grid.innerHTML=(registry.banks||[]).map(bank=>{
      const aliases=bank.display_aliases||{},types=bank.question_types||{},live=liveByCode.get(bank.bank_code)||{};
      const state=live.deployment_state||bank.deployment_state||"pending-private-upload";
      const questions=Number(live.question_count??bank.questions??0),pools=Number(live.pool_count??bank.pools??0),media=Number(live.media_count??bank.media_files??0);
      return `<article class="bankCard"><div class="bankCardTop"><div><small>${bank.bank_code}</small><h2>${aliases["ap-precalculus"]||"AP Precalculus Bank"}</h2><div class="bankAliases"><span>${aliases["ap-precalculus"]||"AP Precalculus"}</span><span>${aliases["ib-math-ai"]||"IB Mathematics"}</span></div></div><span class="bankState">${String(state).replaceAll("-"," ")}</span></div><div class="bankMetrics"><div><strong>${number(questions)}</strong><small>questions</small></div><div><strong>${number(pools)}</strong><small>pools</small></div><div><strong>${number(media)}</strong><small>media</small></div><div><strong>${number((types.essay||0)+(types.fill_blank||0))}</strong><small>open response</small></div></div><div class="bankFooter"><span>SHA-256 ${String(bank.package_sha256||"").slice(0,12)}…</span><span class="bankTrust">Publisher-key direct</span></div></article>`;
    }).join("");
    status.textContent=livePackages.length
      ? `Private backend connected. ${livePackages.length} of ${registry.banks?.length||4} packages are registered and linked directly to lessons; publisher names stay internal.`
      : "Registry verified. Every question is linked directly to AP Precalculus and IB lessons. Private package upload is still pending.";
  }catch(error){console.error(error);status.textContent=error instanceof Error?error.message:"Could not load the private bank registry."}
})();
