/* ECHS Mathematics Question Trust Center */
(async()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const escape=value=>window.ECHSExperience?.escapeHTML?.(value)??String(value??"");
  const current=await ECHSInstitution.requireAuth(["teacher","admin"]);
  if(!current)return;
  ECHSInstitution.mountIdentity(current);
  try{
    const response=await fetch("data/question-trust-manifest.json",{cache:"no-store"});
    if(!response.ok)throw new Error("Question trust manifest could not be loaded");
    const manifest=await response.json(),scope=manifest.canonical_scope||{};
    const canonical=Number(scope.questions||0),ready=Number(scope.student_ready||0),restricted=Number(scope.teacher_archive_restricted||0),warnings=Number(scope.media_warnings||0);
    $("canonicalCount").textContent=canonical.toLocaleString();
    $("readyCount").textContent=ready.toLocaleString();
    $("restrictedCount").textContent=restricted.toLocaleString();
    $("warningCount").textContent=warnings.toLocaleString();
    $("readyRate").textContent=canonical?`${(ready/canonical*100).toFixed(1)}%`:"0%";
    $("trustTiers").innerHTML=(manifest.trust_tiers||[]).map(tier=>`<article class="trustCard trustTier ${tier.student_visible?"":"restricted"}"><span class="trustTierIcon">${tier.student_visible?"✓":"!"}</span><small>${tier.student_visible?"Student visible":"Restricted"}</small><h3>${escape(tier.label)}</h3><ul>${(tier.requirements||[]).map(item=>`<li>${escape(item)}</li>`).join("")}</ul></article>`).join("");
    const gate=manifest.student_release_gate||{};
    const labels={forbid_unknown_answer:"Verified answer",forbid_missing_media:"Resolved media",forbid_unmapped_skill:"Atomic skill mapping",forbid_unverified_math:"Independent mathematics verification",forbid_unresolved_rights:"Publication rights resolved"};
    $("releaseGate").innerHTML=Object.entries(labels).filter(([key])=>gate[key]).map(([,label])=>`<div>${escape(label)}</div>`).join("");
    $("trustWarning").innerHTML=`<strong>${restricted.toLocaleString()} records remain outside the student boundary.</strong> They stay preserved for audit and teacher review, but cannot enter practice, tests, recommendations or mastery until every release gate passes. ${warnings?`${warnings.toLocaleString()} media warnings also remain in the current validation snapshot.`:""}`;
    $("trustStatus").textContent=`Authorised as ${current.role}. Manifest ${manifest.schema_version} · generated ${new Date(manifest.generated_at).toLocaleString()}.`;
  }catch(error){
    $("trustStatus").textContent=error.message;
    $("trustWarning").textContent="The trust manifest is unavailable. Student publication must remain fail-closed.";
  }
})().catch(error=>{console.error(error);document.getElementById("trustStatus").textContent=error.message});
