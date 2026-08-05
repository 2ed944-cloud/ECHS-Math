(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.6'||!Array.isArray(data.slides))return;
const find=title=>data.slides.find(slide=>slide&&slide.title===title);
const replace=(title,html)=>{const slide=find(title);if(slide)slide.html=html;else console.warn(`Lesson 1.6 visual slide not found: ${title}`);};

replace('Three equations as three planes',String.raw`<div class="te63-planes-layout">
  <div class="te63-planes-copy">
    <p>Each linear equation in three variables represents a plane. A triple \((x,y,z)\) solves the system only when its point lies on <b>all three planes at once</b>.</p>
    <div class="te63-planes-equations">
      <span>\(a_1x+b_1y+c_1z=d_1\)</span>
      <span>\(a_2x+b_2y+c_2z=d_2\)</span>
      <span>\(a_3x+b_3y+c_3z=d_3\)</span>
    </div>
    <div class="te63-accuracy-note"><b>Unique solution:</b> three independent planes meet at one common point. Other systems may meet along a line, have infinitely many common points, or have no common point.</div>
  </div>
  <figure class="te63-planes-figure" role="img" aria-label="Three distinct planes intersecting at one common point P">
    <svg viewBox="0 0 760 430" aria-hidden="true">
      <defs>
        <linearGradient id="te63-plane-a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7a1733" stop-opacity=".72"/><stop offset="1" stop-color="#9f4563" stop-opacity=".38"/></linearGradient>
        <linearGradient id="te63-plane-b" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#177e89" stop-opacity=".7"/><stop offset="1" stop-color="#51a6ad" stop-opacity=".34"/></linearGradient>
        <linearGradient id="te63-plane-c" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d4a72c" stop-opacity=".68"/><stop offset="1" stop-color="#f0d77f" stop-opacity=".34"/></linearGradient>
      </defs>
      <g class="te63-axis"><line x1="105" y1="333" x2="672" y2="104"/><line x1="378" y1="52" x2="378" y2="384"/><line x1="102" y1="112" x2="676" y2="334"/></g>
      <polygon class="plane plane-a" points="112,124 654,215 575,343 176,278" fill="url(#te63-plane-a)"/>
      <polygon class="plane plane-b" points="226,58 542,113 516,375 262,324" fill="url(#te63-plane-b)"/>
      <polygon class="plane plane-c" points="96,292 379,158 676,222 379,350" fill="url(#te63-plane-c)"/>
      <g class="te63-intersection-lines"><line x1="182" y1="207" x2="574" y2="270"/><line x1="378" y1="92" x2="378" y2="353"/><line x1="186" y1="293" x2="572" y2="178"/></g>
      <circle class="te63-common-ring" cx="378" cy="232" r="18"/><circle class="te63-common-point" cx="378" cy="232" r="9"/>
      <text x="401" y="225">P = (x, y, z)</text>
      <text class="plane-label a" x="585" y="326">Plane 1</text><text class="plane-label b" x="477" y="90">Plane 2</text><text class="plane-label c" x="109" y="315">Plane 3</text>
    </svg>
    <figcaption>One point is common to all three surfaces.</figcaption>
  </figure>
</div>`);

replace('Root, zero and x-intercept are the same condition',String.raw`<div class="te63-equivalence">
  <article><span>EQUATION</span><div class="te63-equivalence-math">\(p(r)=0\)</div><p>Substitution gives an output of zero.</p></article>
  <strong aria-hidden="true">⇔</strong>
  <article><span>LANGUAGE</span><div class="te63-equivalence-math">\(r\text{ is a root}\)</div><p>The value solves the polynomial equation.</p></article>
  <strong aria-hidden="true">⇔</strong>
  <article><span>GRAPH</span><div class="te63-equivalence-math">\((r,0)\)</div><p>The graph meets the x-axis at that point.</p></article>
</div>
<div class="te63-accuracy-note"><b>Technology choice:</b> a root tool solves \(p(x)=0\); a graph locates the points where \(y=p(x)\) has y-coordinate zero.</div>`);

replace('Multiplicity changes how a graph meets the axis',String.raw`<div class="te63-multiplicity-grid">
  <article><svg viewBox="0 0 360 190" role="img" aria-label="A line crossing the x-axis at a simple root"><line class="axis" x1="28" y1="100" x2="334" y2="100"/><line class="axis faint" x1="181" y1="20" x2="181" y2="170"/><path class="curve maroon" d="M45 154 L317 45"/><circle class="root" cx="181" cy="100" r="7"/></svg><h3>Multiplicity 1</h3><p>The graph crosses the x-axis with a non-zero gradient.</p></article>
  <article><svg viewBox="0 0 360 190" role="img" aria-label="A parabola touching and turning at an even-multiplicity root"><line class="axis" x1="28" y1="100" x2="334" y2="100"/><line class="axis faint" x1="181" y1="20" x2="181" y2="170"/><path class="curve teal" d="M48 40 Q181 100 314 40"/><circle class="root" cx="181" cy="100" r="7"/></svg><h3>Multiplicity 2</h3><p>The graph touches the x-axis and turns; it does not cross.</p></article>
  <article><svg viewBox="0 0 360 190" role="img" aria-label="A cubic flattening and crossing at a triple root"><line class="axis" x1="28" y1="100" x2="334" y2="100"/><line class="axis faint" x1="181" y1="20" x2="181" y2="170"/><path class="curve gold" d="M45 151 C128 151 135 100 181 100 C227 100 234 49 317 49"/><circle class="root" cx="181" cy="100" r="7"/></svg><h3>Multiplicity 3</h3><p>The graph flattens at the root and crosses the x-axis.</p></article>
</div>
<div class="te63-accuracy-note"><b>General rule:</b> even multiplicity touches and turns; odd multiplicity crosses. Greater multiplicity makes the graph flatter near the root.</div>`);

replace('Intersections solve an equation in two equivalent ways',String.raw`<div class="te63-intersection-layout">
  <div class="te63-intersection-copy"><p>To solve \(f(x)=g(x)\), graph both functions or create one zero function.</p><div class="te63-display">\[f(x)=g(x)\quad\Longleftrightarrow\quad f(x)-g(x)=0.\]</div><div class="te63-accuracy-note"><b>Complete point:</b> when the question asks for intersections, report both coordinates—not only the x-values.</div></div>
  <figure class="te63-intersection-figure" role="img" aria-label="The line y equals 2x plus 1 intersects the parabola y equals x squared minus 3 at two accurately plotted points">
    <svg viewBox="0 0 640 360" aria-hidden="true">
      <defs><clipPath id="te63-graph-clip"><rect x="58" y="25" width="535" height="286" rx="14"/></clipPath></defs>
      <g class="grid"><line x1="58" y1="282" x2="593" y2="282"/><line x1="259" y1="25" x2="259" y2="311"/></g>
      <g clip-path="url(#te63-graph-clip)"><path class="line-graph" d="M58 266 L593 43"/><path class="parabola-graph" d="M58 116 L91 155 L125 188 L158 214 L192 235 L225 249 L259 254 L292 249 L326 235 L359 214 L393 188 L426 155 L460 116 L493 69 L527 16"/></g>
      <circle class="intersection-dot" cx="176" cy="219" r="8"/><circle class="intersection-dot" cx="476" cy="99" r="8"/>
      <text x="190" y="211">\((1-\sqrt5,\,3-2\sqrt5)\)</text><text x="332" y="84">\((1+\sqrt5,\,3+2\sqrt5)\)</text>
      <text class="graph-label line" x="478" y="60">\(y=2x+1\)</text><text class="graph-label parabola" x="75" y="104">\(y=x^2-3\)</text>
    </svg>
    <figcaption>Each common point satisfies both equations.</figcaption>
  </figure>
</div>`);

replace('Context can reject mathematically valid roots',String.raw`<div class="te63-domain-flow">
  <article><span>ALL ALGEBRAIC ROOTS</span><div class="te63-root-pair"><b>\(t\approx-0.0815\)</b><b>\(t\approx3.7550\)</b></div><small>Both satisfy \(-4.9t^2+18t+1.5=0\).</small></article>
  <div class="te63-domain-filter"><b>Apply the model domain</b><span>\(t\ge0\)</span></div>
  <article class="accepted"><span>ADMISSIBLE ELAPSED TIME</span><div class="te63-accepted-root">\(t\approx3.755\text{ s}\)</div><small>The negative root is rejected because elapsed time cannot be negative.</small></article>
</div>
<p>For \(h(t)=-4.9t^2+18t+1.5\), technology may correctly return two algebraic roots. The context decides which root answers the question.</p>
<div class="te63-accuracy-note"><b>Exam language:</b> write “reject \(t\approx-0.0815\) because \(t&lt;0\)” rather than “ignore the negative answer.”</div>`);

data.version='6.3.0';
data.visualAccuracyRelease='6.3.0';
data.visualAccuracyAudit={planes:'three distinct surfaces share one point',rootEquivalence:'horizontal unambiguous equivalence',multiplicity:'m=1, m=2 and m=3 plotted accurately',intersections:'line and parabola markers match exact points',domainRoots:'values recomputed from the stated quadratic'};
})();
