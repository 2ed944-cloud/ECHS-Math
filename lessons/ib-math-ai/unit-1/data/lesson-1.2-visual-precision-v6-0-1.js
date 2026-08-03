(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.2')return;

  const slideByTitle=title=>data.slides.find(slide=>slide.title===title);

  const tracks=slideByTitle('One sequence, two tracks');
  if(tracks){
    tracks.html=`<div class="as-two as-track-comparison">
  <div class="as-track-card">
    <span>TERM TRACK</span>
    <div class="as-track-columns" aria-hidden="true"><small>value</small><small>term symbol</small></div>
    <div class="as-term-track as-track-precise" aria-label="Sequence terms: u1 equals 4, u2 equals 7, u3 equals 10, u4 equals 13, u5 equals 16">
      <div><strong>4</strong><small>\\(u_1\\)</small></div>
      <div><strong>7</strong><small>\\(u_2\\)</small></div>
      <div><strong>10</strong><small>\\(u_3\\)</small></div>
      <div><strong>13</strong><small>\\(u_4\\)</small></div>
      <div><strong>16</strong><small>\\(u_5\\)</small></div>
    </div>
    <p>Each individual term rises by \\(3\\).</p>
  </div>
  <div class="as-track-card">
    <span>PARTIAL-SUM TRACK</span>
    <div class="as-track-columns" aria-hidden="true"><small>cumulative value</small><small>partial-sum symbol</small></div>
    <div class="as-sum-track as-track-precise" aria-label="Partial sums: S1 equals 4, S2 equals 11, S3 equals 21, S4 equals 34, S5 equals 50">
      <div><strong>4</strong><small>\\(S_1\\)</small></div>
      <div><strong>11</strong><small>\\(S_2\\)</small></div>
      <div><strong>21</strong><small>\\(S_3\\)</small></div>
      <div><strong>34</strong><small>\\(S_4\\)</small></div>
      <div><strong>50</strong><small>\\(S_5\\)</small></div>
    </div>
    <p>The increase from one partial sum to the next is the newly added term.</p>
  </div>
</div>
<div class="as-note"><b>Bridge identity:</b> \\(S_n=S_{n-1}+u_n\\), so \\(u_n=S_n-S_{n-1}\\).</div>`;
  }

  const graph=slideByTitle('Arithmetic sequences graph as discrete linear points');
  if(graph){
    graph.html=`<div class="as-two">
  <div class="as-key">
    <b>DISCRETE LINEAR MODEL</b>
    <p>For \\(u_n=4+3(n-1)=3n+1\\), the plotted points \\((n,u_n)\\) lie exactly on the line \\(y=3x+1\\).</p>
    <div class="as-formula">\\[\\text{slope}=d=3,\\qquad \\text{vertical intercept}=u_1-d=1\\]</div>
    <div class="as-warning"><b>Domain:</b> the sequence contains only the points with integer indices \\(n=1,2,3,\\ldots\\). The coloured line is a visual guide through those points, not additional sequence terms.</div>
  </div>
  <div class="as-discrete-graph as-discrete-graph-precise" aria-label="Five arithmetic-sequence points lying exactly on the guide line y equals 3x plus 1">
    <span class="as-axis as-x-axis"></span><span class="as-axis as-y-axis"></span>
    <small class="as-x-label">index \\(n\\)</small><small class="as-y-label">term \\(u_n\\)</small>
    <em class="as-exact-linear-guide" aria-hidden="true"></em>
    <i style="--x:18%;--y:78%"><b>\\((1,4)\\)</b></i>
    <i style="--x:34%;--y:64%"><b>\\((2,7)\\)</b></i>
    <i style="--x:50%;--y:50%"><b>\\((3,10)\\)</b></i>
    <i style="--x:66%;--y:36%"><b>\\((4,13)\\)</b></i>
    <i style="--x:82%;--y:22%"><b>\\((5,16)\\)</b></i>
    <div class="as-graph-rule">\\(u_n=3n+1\\)</div>
    <div class="as-discrete-domain">integer-index points only</div>
  </div>
</div>`;
  }

  data.v6Audit=Object.assign({},data.v6Audit,{
    visualPrecisionHotfix:'6.0.1',
    exactDiscreteGuide:true,
    separatedTermAndValueLabels:true
  });
})();
