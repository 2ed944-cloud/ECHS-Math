(async function(){
  "use strict";
  const status=document.getElementById("bankStatus");
  const number=value=>new Intl.NumberFormat("en-GB").format(Number(value||0));
  const escapeHTML=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const courseLabels={"ap-calculus":"AP Calculus","ap-precalculus":"AP Precalculus","ib-math-ai":"IB Mathematics AI","algebra-2":"Algebra 2","grade-9":"Grade 9"};
  const visibleName=row=>{const aliases=row.display_aliases||{};return aliases.teacher||aliases.student||aliases["ap-calculus"]||aliases["ap-precalculus"]||aliases["ib-math-ai"]||row.bank_code||"Private Bank"};
  const targets=row=>{
    const declared=Array.isArray(row.manifest?.target_courses)?row.manifest.target_courses.filter(Boolean):[];
    if(declared.length)return [...new Set(declared)];
    const aliases=row.display_aliases||{};
    return Object.keys(aliases).filter(key=>courseLabels[key]);
  };
  try{
    await window.ECHSInstitution.requireAuth(["teacher","admin"]);
    const [registryResult,alignmentResult,liveResult]=await Promise.allSettled([
      fetch("../../private-sources/data/private-bank-registry.json",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject(new Error(`Private bank registry returned ${response.status}`))),
      fetch("../../private-sources/data/private-bank-alignment-summary.json",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject(new Error(`Private bank alignment summary returned ${response.status}`))),
      window.ECHSInstitution.api("private-bank-api","/packages")
    ]);
    const registry=registryResult.status==="fulfilled"?registryResult.value:{banks:[],totals:{}};
    const alignment=alignmentResult.status==="fulfilled"?alignmentResult.value:{};
    const livePackages=liveResult.status==="fulfilled"&&Array.isArray(liveResult.value?.packages)?liveResult.value.packages:[];
    const liveByCode=new Map(livePackages.map(row=>[row.bank_code,row]));
    const merged=[];
    for(const bank of registry.banks||[]){
      const live=liveByCode.get(bank.bank_code)||{};
      merged.push({...bank,...live,display_aliases:{...(bank.display_aliases||{}),...(live.display_aliases||{})},manifest:live.manifest||bank.manifest||null});
      liveByCode.delete(bank.bank_code);
    }
    for(const live of liveByCode.values())merged.push(live);
    merged.sort((a,b)=>visibleName(a).localeCompare(visibleName(b),"en"));

    const totals=merged.reduce((acc,row)=>{
      acc.questions+=Number(row.question_count??row.questions??row.manifest?.questions??0);
      acc.pools+=Number(row.pool_count??row.pools??row.manifest?.pools??0);
      acc.media+=Number(row.media_count??row.media_files??row.manifest?.media_files??0);
      return acc;
    },{questions:0,pools:0,media:0});
    document.getElementById("bankTotal").textContent=number(merged.length);
    document.getElementById("questionTotal").textContent=number(totals.questions);
    document.getElementById("poolTotal").textContent=number(totals.pools);
    document.getElementById("mediaTotal").textContent=number(totals.media);

    const ap=alignment["ap-precalculus"]||{},ib=alignment["ib-math-ai"]||{};
    document.getElementById("apLessons").textContent=number(ap.lesson_catalog_topics||50);
    document.getElementById("apReadiness").textContent=number(ap.exact_counts?.unit_0_readiness);
    document.getElementById("apVerified").textContent=number(alignment.exact_question_mappings_per_course);
    document.getElementById("ibLessons").textContent=number(ib.lesson_catalog_lessons||26);
    document.getElementById("ibReadiness").textContent=number(ib.exact_counts?.unit_0_readiness);
    document.getElementById("ibVerified").textContent=number(alignment.exact_question_mappings_per_course);

    const calc=merged.filter(row=>targets(row).includes("ap-calculus"));
    const calcQuestions=calc.reduce((sum,row)=>sum+Number(row.question_count??row.questions??row.manifest?.questions??0),0);
    const calcReadiness=calc.reduce((sum,row)=>sum+Number(row.manifest?.mapping_counts?.["ap-calculus:U0"]||0),0);
    document.getElementById("calcBanks").textContent=number(calc.length);
    document.getElementById("calcReadiness").textContent=number(calcReadiness);
    document.getElementById("calcVerified").textContent=number(calcQuestions);

    const grid=document.getElementById("bankGrid");
    grid.innerHTML=merged.length?merged.map(bank=>{
      const types=bank.question_types||bank.manifest?.question_types||{};
      const state=bank.deployment_state||"pending-private-upload";
      const questions=Number(bank.question_count??bank.questions??bank.manifest?.questions??0),pools=Number(bank.pool_count??bank.pools??bank.manifest?.pools??0),media=Number(bank.media_count??bank.media_files??bank.manifest?.media_files??0);
      const targetTags=targets(bank).map(course=>`<span>${escapeHTML(courseLabels[course]||course)}</span>`).join("")||'<span>Manifest target pending</span>';
      const openResponse=Number(types.essay||0)+Number(types.fill_blank||0);
      return `<article class="bankCard"><div class="bankCardTop"><div><small>${escapeHTML(bank.bank_code||"")}</small><h2>${escapeHTML(visibleName(bank))}</h2><div class="bankAliases">${targetTags}</div></div><span class="bankState">${escapeHTML(String(state).replaceAll("-"," "))}</span></div><div class="bankMetrics"><div><strong>${number(questions)}</strong><small>questions</small></div><div><strong>${number(pools)}</strong><small>pools</small></div><div><strong>${number(media)}</strong><small>media</small></div><div><strong>${number(openResponse)}</strong><small>open response</small></div></div><div class="bankFooter"><span>SHA-256 ${escapeHTML(String(bank.package_sha256||"").slice(0,12))}${bank.package_sha256?"…":""}</span><span class="bankTrust">Private · verified mapping</span></div></article>`;
    }).join(""):'<article class="bankCard"><h2>No private banks registered yet</h2><p>Open Upload Manager and upload a validated private-bank ZIP.</p></article>';

    const extra=calc.length?` AP Calculus is active with ${number(calcQuestions)} mapped questions.`:" AP Calculus Bank 1 can now be added through Upload Manager.";
    status.textContent=livePackages.length?`Private backend connected. ${number(livePackages.length)} live packages are registered.${extra}`:`Static registry loaded.${extra}`;
  }catch(error){console.error(error);status.textContent=error instanceof Error?error.message:"Could not load the private bank registry."}
})();
