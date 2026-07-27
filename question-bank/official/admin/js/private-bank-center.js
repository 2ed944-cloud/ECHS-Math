(async function(){
  "use strict";
  const status=document.getElementById("bankStatus");
  const number=value=>new Intl.NumberFormat("en-GB").format(Number(value||0));
  try{
    await window.ECHSInstitution.requireAuth(["teacher","admin"]);
    const response=await fetch("../../../private-sources/data/private-bank-registry.json",{cache:"no-store"});
    if(!response.ok) throw new Error(`Private bank registry returned ${response.status}`);
    const registry=await response.json();
    const totals=registry.totals||{};
    document.getElementById("bankTotal").textContent=number(totals.banks);
    document.getElementById("questionTotal").textContent=number(totals.questions);
    document.getElementById("poolTotal").textContent=number(totals.pools);
    document.getElementById("mediaTotal").textContent=number(totals.media_files);
    const grid=document.getElementById("bankGrid");
    grid.innerHTML=(registry.banks||[]).map(bank=>{
      const aliases=bank.display_aliases||{};
      const types=bank.question_types||{};
      return `<article class="bankCard"><div class="bankCardTop"><div><small>${bank.bank_code}</small><h2>${aliases["ap-precalculus"]||"AP Precalculus Bank"}</h2><div class="bankAliases"><span>${aliases["ap-precalculus"]||"AP Precalculus"}</span><span>${aliases["ib-math-ai"]||"IB Mathematics"}</span></div></div><span class="bankState">${String(bank.deployment_state||"").replaceAll("-"," ")}</span></div><div class="bankMetrics"><div><strong>${number(bank.questions)}</strong><small>questions</small></div><div><strong>${number(bank.pools)}</strong><small>pools</small></div><div><strong>${number(bank.media_files)}</strong><small>media</small></div><div><strong>${number((types.essay||0)+(types.fill_blank||0))}</strong><small>open response</small></div></div><div class="bankFooter"><span>SHA-256 ${String(bank.package_sha256||"").slice(0,12)}…</span><span class="bankTrust">Teacher review required</span></div></article>`;
    }).join("");
    status.textContent="Registry verified. Source content remains private; publisher names stay internal.";
  }catch(error){
    console.error(error);
    status.textContent=error instanceof Error?error.message:"Could not load the private bank registry.";
  }
})();
