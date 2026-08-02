(async function(){
  "use strict";
  const CALCULUS="ap-calculus";
  const courseLabels={
    "ap-calculus":"AP Calculus",
    "ap-precalculus":"AP Precalculus",
    "ib-math-ai":"IB Mathematics AI",
    "algebra-2":"Algebra 2",
    "grade-9":"Grade 9"
  };
  const status=document.getElementById("bankStatus");
  let administrator=false;
  const number=value=>new Intl.NumberFormat("en-GB").format(Number(value||0));
  const escapeHTML=value=>String(value??"").replace(/[&<>'"]/g,char=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  })[char]);
  const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  const complete=row=>/^complete(?:-|$)/i.test(String(row?.deployment_state||""));
  const largestMetric=values=>Math.max(0,...values.map(value=>Number(value||0)).filter(Number.isFinite));
  const declaredQuestions=row=>largestMetric([row?.question_count,row?.questions,row?.manifest?.questions]);
  const declaredPools=row=>largestMetric([row?.pool_count,row?.pools,row?.manifest?.pools]);
  const declaredMedia=row=>largestMetric([row?.media_count,row?.media_files,row?.manifest?.media_files]);
  const mappingTotal=(row,course)=>Object.entries(row?.manifest?.mapping_counts||{})
    .filter(([key])=>key.startsWith(`${course}:`)).reduce((sum,[,value])=>sum+Number(value||0),0);
  const courseSnapshot=(rows,course)=>{
    const packages=rows.filter(row=>targets(row).includes(course));
    return{
      banks:packages.length,
      questions:packages.reduce((sum,row)=>sum+declaredQuestions(row),0),
      readiness:packages.reduce((sum,row)=>sum+Number(row?.manifest?.mapping_counts?.[`${course}:U0`]||0),0),
      mappings:packages.reduce((sum,row)=>sum+mappingTotal(row,course),0)
    };
  };
  const targets=row=>{
    const declared=Array.isArray(row?.manifest?.target_courses)?row.manifest.target_courses.filter(Boolean):[];
    if(declared.length)return[...new Set(declared)];
    const aliases={...(row?.display_aliases||{}),...(row?.manifest?.display_aliases||{})};
    return Object.keys(aliases).filter(key=>courseLabels[key]);
  };
  const visibleName=row=>{
    const aliases=row?.display_aliases||{};
    return aliases.teacher||aliases.student||aliases[CALCULUS]||row?.bank_code||"AP Calculus Bank";
  };

  async function load(){
    const result=await window.ECHSInstitution.api("private-bank-api","/packages");
    const all=Array.isArray(result?.packages)?result.packages:[];
    const calculus=all.filter(row=>targets(row).includes(CALCULUS));
    const live=all.filter(complete);
    const totals=all.reduce((acc,row)=>{
      acc.questions+=declaredQuestions(row);
      acc.pools+=declaredPools(row);
      acc.media+=declaredMedia(row);
      return acc;
    },{questions:0,pools:0,media:0});

    document.getElementById("bankTotal").textContent=number(all.length);
    document.getElementById("questionTotal").textContent=number(totals.questions);
    document.getElementById("poolTotal").textContent=number(totals.pools);
    document.getElementById("mediaTotal").textContent=number(totals.media);
    for(const[course,prefix]of [["ap-calculus","calc"],["ap-precalculus","precalc"],["ib-math-ai","ib"]]){
      const snapshot=courseSnapshot(all,course);
      document.getElementById(`${prefix}Banks`).textContent=number(snapshot.banks);
      document.getElementById(`${prefix}Readiness`).textContent=number(snapshot.readiness);
      document.getElementById(`${prefix}Verified`).textContent=number(snapshot.questions);
    }

    const grid=document.getElementById("bankGrid");
    grid.innerHTML=all.length?all
      .sort((a,b)=>visibleName(a).localeCompare(visibleName(b),"en"))
      .map((bank,index)=>{
        const state=bank.deployment_state||"pending-private-upload";
        const isComplete=complete(bank);
        const questions=declaredQuestions(bank);
        const pools=declaredPools(bank);
        const media=declaredMedia(bank);
        const typeCounts=bank.manifest?.question_types||{};
        const openResponse=Number(typeCounts.essay||0)+Number(typeCounts.fill_blank||0);
        return `<article class="bankCard">
          <div class="bankCardTop"><div><small>${escapeHTML(bank.bank_code||"")}</small>
            <h2>${escapeHTML(visibleName(bank)||`AP Calculus Bank ${index+1}`)}</h2>
            <div class="bankAliases">${targets(bank).map(course=>`<span>${escapeHTML(courseLabels[course]||course)}</span>`).join("")||"<span>Unassigned</span>"}</div>
          </div><span class="bankState">${escapeHTML(String(state).replaceAll("-"," "))}</span></div>
          <div class="bankMetrics"><div><strong>${number(questions)}</strong><small>live questions</small></div>
            <div><strong>${number(pools)}</strong><small>source pools</small></div>
            <div><strong>${number(media)}</strong><small>media</small></div>
            <div><strong>${number(openResponse)}</strong><small>open response</small></div></div>
          <div class="bankFooter"><span>SHA-256 ${escapeHTML(String(bank.package_sha256||"").slice(0,12))}${bank.package_sha256?"…":""}</span><span class="bankTrust">${escapeHTML(targets(bank).map(course=>courseLabels[course]||course).join(", ")||"Private bank")}</span></div>
          ${administrator?`<div class="bankActions"><button class="dangerButton deleteBankButton" type="button" data-delete-bank="${escapeHTML(bank.bank_code||"")}" data-delete-name="${escapeHTML(visibleName(bank))}">Delete this bank and package</button></div>`:""}
        </article>`;
      }).join("")
      :'<article class="bankCard"><h2>No private bank package is registered</h2><p>Upload a validated single-course package from the Upload Manager.</p></article>';

    status.textContent=`${number(all.length)} private-bank packages are registered across the ECHS courses; ${number(live.length)} are complete.`;
    return{all,calculus,live};
  }

  async function deleteSpecificBank(bankCode,bankName,button){
    const confirmation=prompt(`Delete ${bankName} and its questions, media, stored ZIP, and import record. Student learning history is retained.\n\nType ${bankCode} to confirm.`);
    if(confirmation!==bankCode)return;
    button.disabled=true;button.textContent="Deleting bank…";
    status.textContent=`Deleting ${bankName}. This operation is safely resumable.`;
    let steps=0,deleted={questions:0,media:0,archives:0,packages:0,trust_records:0,import_runs:0};
    try{
      while(true){
        if(++steps>10000)throw new Error("Bank deletion safety limit reached. Select the same bank again to resume.");
        const result=await window.ECHSInstitution.api("private-bank-api",`/packages/${encodeURIComponent(bankCode)}`,{method:"DELETE"});
        for(const[key,value]of Object.entries(result?.deleted||{}))deleted[key]=Number(deleted[key]||0)+Number(value||0);
        status.textContent=`Deleting ${bankName}: ${number(deleted.questions)} questions, ${number(deleted.media)} media files, ${number(deleted.archives)} package archives removed.`;
        if(result?.status==="completed")break;
        await sleep(80);
      }
      status.textContent=`${bankName} was deleted completely: ${number(deleted.questions)} questions, ${number(deleted.media)} media files, the stored package, and related import records were removed. Student learning history was preserved.`;
      await load();
    }catch(error){
      console.error(error);button.disabled=false;button.textContent="Resume deleting this bank";
      status.textContent=`Deletion paused safely for ${bankName}: ${error instanceof Error?error.message:"Could not continue."}`;
    }
  }

  try{
    const current=await window.ECHSInstitution.requireAuth(["teacher","admin"]);
    if(!current)return;
    administrator=current.role==="admin";
    await load();
    document.getElementById("bankGrid")?.addEventListener("click",event=>{
      const button=event.target.closest("[data-delete-bank]");
      if(!button||!administrator)return;
      deleteSpecificBank(button.dataset.deleteBank,button.dataset.deleteName||button.dataset.deleteBank,button);
    });
  }catch(error){
    console.error(error);
    status.textContent=error instanceof Error?error.message:"Could not load the private bank registry.";
  }
})();
