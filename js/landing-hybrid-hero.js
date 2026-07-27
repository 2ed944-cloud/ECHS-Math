/* Hybrid landing hero: animated calculus board + compact ECHS identity card */
(function(){
  "use strict";
  const target=document.querySelector(".premiumIdentityVisual");
  if(!target||target.dataset.hybridHeroReady==="true")return;
  target.classList.add("hybridHeroVisual");
  target.dataset.hybridHeroReady="true";
  target.innerHTML=`
    <figure class="calculusMotionBoard" data-calculus-motion data-extremum-phase="moving">
      <div class="calculusBoardHeader">
        <span class="calculusBoardKicker">Calculus in motion</span>
        <span class="calculusBoardFormula" id="calculusBoardFormula">Instantaneous slope</span>
      </div>
      <svg viewBox="0 0 620 340" role="img" aria-labelledby="heroCalculusTitle heroCalculusDesc">
        <title id="heroCalculusTitle">Animated tangent line moving through a local maximum and local minimum</title>
        <desc id="heroCalculusDesc">The tangent follows the curve, becomes horizontal at a local maximum where f prime of zero equals zero, then becomes horizontal again at a local minimum where f prime of a equals zero.</desc>
        <defs>
          <pattern id="heroCalculusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" class="calculusGrid" fill="none"/>
          </pattern>
          <linearGradient id="heroCurveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#e9c87c"/>
            <stop offset=".45" stop-color="#fff1c6"/>
            <stop offset=".72" stop-color="#d9f3ee"/>
            <stop offset="1" stop-color="#63c6b7"/>
          </linearGradient>
          <linearGradient id="heroAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e9c87c" stop-opacity=".24"/>
            <stop offset=".7" stop-color="#63c6b7" stop-opacity=".08"/>
            <stop offset="1" stop-color="#63c6b7" stop-opacity=".015"/>
          </linearGradient>
          <filter id="heroCurveGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="heroPointGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width="620" height="340" rx="22" fill="url(#heroCalculusGrid)"/>
        <line class="calculusAxis" x1="32" y1="286" x2="592" y2="286"/>
        <line class="calculusAxis" x1="300" y1="24" x2="300" y2="310"/>
        <text class="calculusAxisLabel" x="582" y="305">x</text>
        <text class="calculusAxisLabel" x="310" y="38">y</text>
        <text class="calculusAxisLabel" x="288" y="306">0</text>
        <path class="calculusArea" d="M40 270 C110 270 145 175 215 112 C250 80 275 72 300 72 C330 72 352 105 378 148 C415 210 438 250 475 250 C520 250 548 176 590 112 L590 286 L40 286 Z"/>
        <path id="heroCalculusCurve" class="calculusHeroCurve" pathLength="1" d="M40 270 C110 270 145 175 215 112 C250 80 275 72 300 72 C330 72 352 105 378 148 C415 210 438 250 475 250 C520 250 548 176 590 112"/>
        <text class="calculusFunctionLabel" x="522" y="150">y = f(x)</text>

        <g class="extremumMarker maximumMarker" data-extremum-marker="maximum">
          <line class="extremumTangentGuide maximumTangentGuide" x1="220" y1="72" x2="380" y2="72"/>
          <circle class="extremumHalo maximumHalo" cx="300" cy="72" r="15"/>
          <circle class="extremumPoint maximumPoint" cx="300" cy="72" r="6"/>
          <path class="extremumConnector maximumConnector" d="M307 67 L344 48"/>
          <g class="extremumCallout maximumCallout" data-extremum-callout="maximum" transform="translate(344 15)" aria-hidden="true">
            <rect x="0" y="0" width="220" height="72" rx="16"/>
            <text class="extremumCalloutTitle" x="17" y="27">f′(0) = 0</text>
            <text class="extremumCalloutSub" x="17" y="48">HORIZONTAL TANGENT</text>
            <text class="extremumCalloutLabel" x="17" y="64">LOCAL MAXIMUM</text>
          </g>
        </g>

        <g class="extremumMarker minimumMarker" data-extremum-marker="minimum">
          <line class="extremumTangentGuide minimumTangentGuide" x1="405" y1="250" x2="548" y2="250"/>
          <circle class="extremumHalo minimumHalo" cx="475" cy="250" r="15"/>
          <circle class="extremumPoint minimumPoint" cx="475" cy="250" r="6"/>
          <path class="extremumConnector minimumConnector" d="M469 256 L450 272"/>
          <g class="extremumCallout minimumCallout" data-extremum-callout="minimum" transform="translate(258 250)" aria-hidden="true">
            <rect x="0" y="0" width="194" height="70" rx="16"/>
            <text class="extremumCalloutTitle" x="17" y="26">f′(a) = 0</text>
            <text class="extremumCalloutSub" x="17" y="47">HORIZONTAL TANGENT</text>
            <text class="extremumCalloutLabel" x="17" y="62">LOCAL MINIMUM</text>
          </g>
        </g>

        <g class="tangentTraveller" id="heroTangentTraveller" aria-hidden="true">
          <circle class="tangentTravellerGlow" cx="0" cy="0" r="12"/>
          <line x1="-62" y1="0" x2="62" y2="0"/>
          <circle class="tangentTravellerPoint" cx="0" cy="0" r="5"/>
        </g>
      </svg>
      <div class="calculusConceptRow" aria-hidden="true">
        <span data-calculus-concept="moving"><i></i> Moving tangent</span>
        <span data-calculus-concept="slope"><i></i> Instantaneous slope</span>
        <span data-calculus-concept="maximum"><i></i> Local maximum</span>
        <span data-calculus-concept="minimum"><i></i> Local minimum</span>
      </div>
    </figure>

    <article class="schoolIdentityCard compactSchoolIdentityCard">
      <div class="identityGlow" aria-hidden="true"></div>
      <div class="identityLogoPlate"><img src="assets/echs_logo.png" alt="Education City High School"></div>
      <div class="compactIdentityCopy">
        <span class="identityKicker">Education City High School</span>
        <h2>ECHS Mathematics</h2>
        <p>One connected journey from understanding to independent mastery.</p>
      </div>
      <div class="identityPath compactIdentityPath" aria-label="Learning pathway preview">
        <div><i>1</i><span><strong>Learn</strong><small>Build the concept</small></span></div>
        <b aria-hidden="true">›</b>
        <div><i>2</i><span><strong>Practise</strong><small>Strengthen the skill</small></span></div>
        <b aria-hidden="true">›</b>
        <div><i>3</i><span><strong>Master</strong><small>Show durable evidence</small></span></div>
      </div>
      <div class="identitySeal"><span>ECHS</span><small>2026–2027</small></div>
    </article>
    <div class="floatingEvidence evidenceA"><span>✓</span><strong>Lesson complete</strong><small>Practice unlocked</small></div>
    <div class="floatingEvidence evidenceB"><span>★</span><strong>Mastery growing</strong><small>Evidence-based progress</small></div>
  `;

  const board=target.querySelector(".calculusMotionBoard");
  const curve=target.querySelector("#heroCalculusCurve");
  const traveller=target.querySelector("#heroTangentTraveller");
  const formula=target.querySelector("#calculusBoardFormula");
  const callouts=[...target.querySelectorAll("[data-extremum-callout]")];
  const prefersReducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!board||!curve||!traveller||!formula)return;

  const totalLength=curve.getTotalLength();
  const nearestFraction=(x,y)=>{
    let best={fraction:0,distance:Number.POSITIVE_INFINITY};
    for(let step=0;step<=900;step++){
      const fraction=step/900;
      const point=curve.getPointAtLength(totalLength*fraction);
      const distance=(point.x-x)**2+(point.y-y)**2;
      if(distance<best.distance)best={fraction,distance};
    }
    return best.fraction;
  };
  const extrema={
    maximum:{fraction:nearestFraction(300,72),formula:"f′(0) = 0"},
    minimum:{fraction:nearestFraction(475,250),formula:"f′(a) = 0"}
  };
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const ease=value=>value*value*(3-2*value);
  const lerp=(start,end,amount)=>start+(end-start)*amount;
  const pointAt=fraction=>curve.getPointAtLength(totalLength*clamp(fraction,0,1));
  const renderTangent=fraction=>{
    const location=clamp(fraction,0,1);
    const point=pointAt(location);
    const delta=Math.max(1,totalLength*.004);
    const before=curve.getPointAtLength(clamp(totalLength*location-delta,0,totalLength));
    const after=curve.getPointAtLength(clamp(totalLength*location+delta,0,totalLength));
    const angle=Math.atan2(after.y-before.y,after.x-before.x)*180/Math.PI;
    traveller.setAttribute("transform",`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${angle.toFixed(2)})`);
  };

  let activePhase="";
  const setVisualPhase=phase=>{
    if(activePhase===phase)return;
    activePhase=phase;
    board.dataset.extremumPhase=phase;
    formula.textContent=phase==="maximum"?extrema.maximum.formula:phase==="minimum"?extrema.minimum.formula:phase==="overview"?"Stationary points · f′(x) = 0":"Instantaneous slope";
    callouts.forEach(callout=>callout.setAttribute("aria-hidden",String(callout.dataset.extremumCallout!==phase&&phase!=="overview")));
  };

  const schedule={moveToMaximum:3200,holdMaximum:2300,moveToMinimum:3600,holdMinimum:2300,moveToEnd:2700,reset:650};
  const totalCycle=Object.values(schedule).reduce((sum,value)=>sum+value,0);
  let cycleStart=performance.now();
  let frameId=0;
  let forcedPhase=null;

  const renderPhase=(phase)=>{
    forcedPhase=phase;
    cancelAnimationFrame(frameId);
    if(phase==="maximum")renderTangent(extrema.maximum.fraction);
    else if(phase==="minimum")renderTangent(extrema.minimum.fraction);
    else if(phase==="overview")renderTangent(extrema.maximum.fraction);
    else renderTangent(.12);
    setVisualPhase(phase);
  };

  const animate=now=>{
    if(forcedPhase)return;
    const elapsed=(now-cycleStart)%totalCycle;
    let cursor=0;
    let fraction=.03;
    let phase="moving";
    if(elapsed<(cursor+=schedule.moveToMaximum)){
      fraction=lerp(.03,extrema.maximum.fraction,ease(elapsed/schedule.moveToMaximum));
    }else if(elapsed<(cursor+=schedule.holdMaximum)){
      fraction=extrema.maximum.fraction;phase="maximum";
    }else if(elapsed<(cursor+=schedule.moveToMinimum)){
      const local=(elapsed-(cursor-schedule.moveToMinimum))/schedule.moveToMinimum;
      fraction=lerp(extrema.maximum.fraction,extrema.minimum.fraction,ease(local));
    }else if(elapsed<(cursor+=schedule.holdMinimum)){
      fraction=extrema.minimum.fraction;phase="minimum";
    }else if(elapsed<(cursor+=schedule.moveToEnd)){
      const local=(elapsed-(cursor-schedule.moveToEnd))/schedule.moveToEnd;
      fraction=lerp(extrema.minimum.fraction,.97,ease(local));
    }else{
      fraction=.03;
    }
    renderTangent(fraction);
    setVisualPhase(phase);
    frameId=requestAnimationFrame(animate);
  };

  const resume=()=>{
    forcedPhase=null;
    cycleStart=performance.now();
    cancelAnimationFrame(frameId);
    frameId=requestAnimationFrame(animate);
  };

  window.ECHSLandingCalculus={
    setPhase:renderPhase,
    resume,
    getPhase:()=>board.dataset.extremumPhase,
    extrema
  };

  if(prefersReducedMotion)renderPhase("overview");
  else resume();
})();