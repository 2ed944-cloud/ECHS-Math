/* Hybrid landing hero: animated calculus board + compact ECHS identity card */
(function(){
  "use strict";
  const target=document.querySelector(".premiumIdentityVisual");
  if(!target||target.dataset.hybridHeroReady==="true")return;
  target.classList.add("hybridHeroVisual");
  target.dataset.hybridHeroReady="true";
  target.innerHTML=`
    <figure class="calculusMotionBoard" data-calculus-motion>
      <div class="calculusBoardHeader">
        <span class="calculusBoardKicker">Calculus in motion</span>
        <span class="calculusBoardFormula">f′(0) = 0</span>
      </div>
      <svg viewBox="0 0 620 340" role="img" aria-labelledby="heroCalculusTitle heroCalculusDesc">
        <title id="heroCalculusTitle">Animated tangent line moving along a calculus curve</title>
        <desc id="heroCalculusDesc">The tangent follows the curve and becomes horizontal at x equals zero, showing a local maximum where f prime of zero equals zero.</desc>
        <defs>
          <pattern id="heroCalculusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" class="calculusGrid" fill="none"/>
          </pattern>
          <linearGradient id="heroCurveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#e9c87c"/>
            <stop offset=".52" stop-color="#fff1c6"/>
            <stop offset="1" stop-color="#d1a653"/>
          </linearGradient>
          <linearGradient id="heroAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e9c87c" stop-opacity=".26"/>
            <stop offset="1" stop-color="#e9c87c" stop-opacity=".015"/>
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
        <path class="calculusArea" d="M40 270 C120 270 150 130 230 104 C262 94 282 88 300 88 C318 88 340 94 360 112 C410 160 425 245 485 245 C535 245 560 175 590 115 L590 286 L40 286 Z"/>
        <path id="heroCalculusCurve" class="calculusHeroCurve" pathLength="1" d="M40 270 C120 270 150 130 230 104 C262 94 282 88 300 88 C318 88 340 94 360 112 C410 160 425 245 485 245 C535 245 560 175 590 115"/>
        <text class="calculusFunctionLabel" x="514" y="152">y = f(x)</text>
        <line class="maximumTangentGuide" x1="222" y1="88" x2="378" y2="88"/>
        <circle class="maximumHalo" cx="300" cy="88" r="15"/>
        <circle class="maximumPoint" cx="300" cy="88" r="6"/>
        <path class="maximumConnector" d="M307 82 L346 57"/>
        <g class="maximumCallout" transform="translate(346 24)">
          <rect x="0" y="0" width="218" height="72" rx="16"/>
          <text class="maximumCalloutTitle" x="17" y="27">f′(0) = 0</text>
          <text class="maximumCalloutSub" x="17" y="47">HORIZONTAL TANGENT</text>
          <text class="maximumCalloutSub" x="17" y="62">LOCAL MAXIMUM</text>
        </g>
        <g class="tangentTraveller">
          <line x1="-62" y1="0" x2="62" y2="0"/>
          <circle cx="0" cy="0" r="5"/>
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" keyPoints=".05;.46;.46;.95" keyTimes="0;.38;.6;1" calcMode="linear">
            <mpath href="#heroCalculusCurve"/>
          </animateMotion>
        </g>
      </svg>
      <div class="calculusConceptRow" aria-hidden="true">
        <span><i></i> Moving tangent</span>
        <span><i></i> Instantaneous slope</span>
        <span><i></i> Local maximum</span>
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
})();
