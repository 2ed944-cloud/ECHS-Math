/* ECHS Mastery gamification layer */
(function(){
  "use strict";
  const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  function gameState(){
    const s=window.ECHSLearning?.summary?.()||{};
    const xp=(s.correct||0)*12+(s.attempts-(s.correct||0))*3+(s.completedLessons||0)*80+(s.mastered||0)*180+(s.streak||0)*20;
    const level=Math.max(1,Math.floor(Math.sqrt(xp/220))+1),base=Math.pow(level-1,2)*220,next=Math.pow(level,2)*220;
    const progress=Math.max(0,Math.min(100,Math.round((xp-base)/Math.max(1,next-base)*100)));
    const rank=level>=15?"Master Mathematician":level>=10?"Strategic Thinker":level>=6?"Problem Solver":level>=3?"Skill Builder":"Explorer";
    const coins=(s.correct||0)*2+(s.mastered||0)*30+(s.completedLessons||0)*10;
    return{...s,xp,level,base,next,progress,rank,coins};
  }
  function render(){
    const anchor=document.querySelector(".institutionMain .premiumMetrics");if(!anchor)return;
    let panel=document.getElementById("echsMasteryGame");
    if(!panel){panel=document.createElement("section");panel.id="echsMasteryGame";panel.className="masteryGamePanel";anchor.insertAdjacentElement("afterend",panel);}
    const s=gameState(),badges=(window.ECHSLearning?.earnedAchievements?.()||[]).filter(row=>row.earned).slice(-5).reverse();
    panel.innerHTML=`<div class="masteryGameHead"><div><small>ECHS MASTERY</small><h2>Level ${s.level} · ${escape(s.rank)}</h2><p>Complete lessons, practise unlocked skills and convert evidence into mastery.</p></div><div class="masteryCurrency"><span>✦ ${s.xp.toLocaleString()} XP</span><span>◆ ${s.coins.toLocaleString()} coins</span></div></div><div class="masteryLevelTrack"><i style="width:${s.progress}%"></i></div><div class="masteryLevelMeta"><span>${Math.max(0,s.xp-s.base).toLocaleString()} XP earned in this level</span><strong>${Math.max(0,s.next-s.xp).toLocaleString()} XP to Level ${s.level+1}</strong></div><div class="masteryQuestGrid"><article><b>1</b><span><strong>Learn</strong><small>${s.completedLessons||0} lessons completed</small></span></article><article><b>2</b><span><strong>Practise</strong><small>${s.attempts||0} questions answered</small></span></article><article><b>3</b><span><strong>Master</strong><small>${s.mastered||0} skills mastered</small></span></article><article><b>🔥</b><span><strong>Momentum</strong><small>${s.streak||0}-day learning streak</small></span></article></div><div class="masteryBadgeRow">${badges.length?badges.map(row=>`<span title="${escape(row.description)}"><b>${escape(row.icon)}</b>${escape(row.title)}</span>`).join(""):'<span class="lockedBadge"><b>★</b>Your first badge unlocks after the first practice question.</span>'}</div>`;
  }
  function init(){render();window.addEventListener("echs:learning-attempt",render);window.addEventListener("echs:lesson-completed",render);window.addEventListener("storage",event=>{if(String(event.key||"").startsWith("echs_"))render();});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
