(function(){
  'use strict';
  const B=window.__ECHS_TCI5_BUILD;if(!B)throw new Error('Lesson 2.5 v5 builder is missing.');
  const {R,S,V,Section,Concept,Worked,Student,Checkpoint,Misconception}=B;

  Section('Block B · Combined transformations','Transform the entire coordinate system','For \\(g(x)=a f(b(x-h))+k\\), every graph feature follows the same coordinate map.','block-b');

  S('Block B · Combined transformations','Parameter audit','content','Read the formula before graphing',R`<div class="tci5-parameter-table"><div class="head"><span>Parameter</span><span>Coordinate action</span><span>Graph effect</span><span>Feature audit</span></div><div><b>\\(a\\)</b><span>\\(v\\mapsto av\\)</span><span>Vertical scale \\(|a|\\); x-axis reflection if \\(a<0\\)</span><span>Multiply y-values and horizontal asymptote heights by \\(a\\)</span></div><div><b>\\(b\\)</b><span>\\(u\\mapsto u/b\\)</span><span>Horizontal scale \\(1/|b|\\); y-axis reflection if \\(b<0\\)</span><span>Divide x-locations and vertical asymptote locations by \\(b\\)</span></div><div><b>\\(h\\)</b><span>\\(u/b\\mapsto h+u/b\\)</span><span>Horizontal translation by \\(h\\)</span><span>Add \\(h\\) to transformed x-locations</span></div><div><b>\\(k\\)</b><span>\\(av\\mapsto k+av\\)</span><span>Vertical translation by \\(k\\)</span><span>Add \\(k\\) to transformed y-values</span></div></div>`);

  Concept('Block B · Combined transformations','The coordinate map is the safest method','Use one exact statement','If \\((u,v)\\) lies on \\(y=f(x)\\), then the corresponding point on \\(g(x)=a f(b(x-h))+k\\) is obtained by solving the transformed input and transforming the output.',[
    {title:'Forward map',math:R`\\[(u,v)\\mapsto\\left(h+\\frac{u}{b},\,k+av\\right)\\]`,text:'Use this to move known base points and features.'},
    {title:'Reverse map',math:R`\\[(x,y)\\mapsto\\left(b(x-h),\,\\frac{y-k}{a}\\right)\\]`,text:'Use this to recover the corresponding base point when \\(a,b\\ne0\\).'}
  ],'combined-map',R`Do not apply the written operations left-to-right to point coordinates. Solve the input equation.`);

  Concept('Block B · Combined transformations','Grouping and order','Parentheses define the horizontal map','Compare \\(f(3(x-1))\\) with \\(f(3x-1)\\). They are not the same function.',[
    {title:'First expression',math:R`\\(3(x-1)=u\\Rightarrow x=1+u/3\\)`,text:'Compress by \\(1/3\\), then place the image around \\(x=1\\).'},
    {title:'Second expression',math:R`\\(3x-1=u\\Rightarrow x=(u+1)/3\\)`,text:'Equivalent to \\(f(3(x-1/3))\\); the horizontal shift is \\(1/3\\), not 1.'},
    {title:'Audit rule',text:'Rewrite the inside expression as \\(b(x-h)\\) before naming transformations.'}
  ],'grouping-order');

  S('Block B · Combined transformations','An exact combined transformation','content','Point mapping controls the graph',R`<div class="tci5-graph-study"><div>${V('combined-graph','Graph of square root base and a combined transformation')}</div><div><h2>Base and image</h2><p>Let \\(f(x)=\\sqrt{x}\\) and \\(g(x)=-2f(3(x-1))+4\\).</p><ul><li>\\((0,0)\\mapsto(1,4)\\).</li><li>\\((1,1)\\mapsto(4/3,2)\\).</li><li>\\((4,2)\\mapsto(7/3,0)\\).</li><li>\\((9,3)\\mapsto(4,-2)\\).</li></ul><p>The image domain is \\(x\\ge1\\), and the image range is \\(y\\le4\\).</p></div></div>`);

  Worked('Block B · Combined transformations','Map a point through five effects',R`The point \\((6,-2)\\) lies on \\(y=f(x)\\). Define \\(g(x)=-3f(2(x-4))+5\\). Determine the corresponding point.`,[
    R`Match the transformed input to the base input: \\(2(x-4)=6\\).`,
    R`Solve: \\(x-4=3\\), hence \\(x=7\\).`,
    R`Transform the output: \\(y=-3(-2)+5=11\\).`,
    R`The image point is \\((7,11)\\).`
  ],R`\\[(6,-2)\\mapsto(7,11)\\]`,'Verification: substitute \\(x=7\\) into \\(g\\); its inner input is 6, so \\(g(7)=-3f(6)+5=11\\).','combined-point-example');

  Student('Block B · Combined transformations','Point-map challenge',R`A point \\((-9,4)\\) lies on \\(y=f(x)\\). Let \\(g(x)=2f(-3(x+1))-7\\).`,[
    'Rewrite the inside expression in the form \\(b(x-h)\\).',
    'Determine the new x-coordinate.',
    'Determine the new y-coordinate.',
    'Describe every transformation.'
  ],'turn-combined-point',R`Here \\(b=-3\\) and \\(h=-1\\). Solve \\(-3(x+1)=-9\\), giving \\(x=2\\). The output is \\(2(4)-7=1\\), so the image is \\((2,1)\\). Reflect in the y-axis, compress horizontally by \\(1/3\\), translate 1 left, stretch vertically by 2, then translate 7 down.`,'combined-point-turn');

  S('Block B · Combined transformations','Transform graph features, not only points','content','One coordinate map for every feature',R`<div class="tci5-feature-grid"><article><span>VERTICAL ASYMPTOTE</span><h2>\\(x=u\\)</h2><p>Maps to \\(x=h+u/b\\).</p></article><article><span>HORIZONTAL ASYMPTOTE</span><h2>\\(y=v\\)</h2><p>Maps to \\(y=k+av\\).</p></article><article><span>TURNING POINT</span><h2>\\((u,v)\\)</h2><p>Maps to \\(\\left(h+u/b,k+av\\right)\\).</p></article><article><span>DOMAIN ENDPOINT</span><h2>\\(u\\)</h2><p>Maps through the horizontal coordinate rule; inequality direction must be audited if \\(b<0\\).</p></article><article><span>RANGE ENDPOINT</span><h2>\\(v\\)</h2><p>Maps through the vertical rule; inequality direction reverses if \\(a<0\\).</p></article><article><span>INTERCEPT</span><h2>Do not assume it stays fixed</h2><p>Map a known point or solve the transformed equation directly.</p></article></div>`);

  Worked('Block B · Combined transformations','Transform both asymptotes',R`The base function has vertical asymptote \\(x=1\\) and horizontal asymptote \\(y=2\\). For \\(g(x)=-2f(\\tfrac12(x+2))+5\\), determine the image asymptotes.`,[
    R`Write the inside as \\(b(x-h)\\): here \\(b=1/2\\) and \\(h=-2\\).`,
    R`Vertical asymptote: \\(x=h+u/b=-2+1/(1/2)=0\\).`,
    R`Horizontal asymptote: \\(y=k+av=5-2(2)=1\\).`,
    R`Hence the transformed graph has asymptotes \\(x=0\\) and \\(y=1\\).`
  ],R`\\[x=0,\qquad y=1\\]`,'The vertical asymptote follows the input map; the horizontal asymptote follows the output map.','asymptote-transform');

  Student('Block B · Combined transformations','Feature-map challenge',R`A base graph has turning point \\((-2,5)\\), vertical asymptote \\(x=4\\), and horizontal asymptote \\(y=-1\\). Let \\(g(x)=3f(-2(x-1))+4\\).`,[
    'Map the turning point.',
    'Map the vertical asymptote.',
    'Map the horizontal asymptote.',
    'State the horizontal reflection and scale.'
  ],'turn-features',R`The map is \\((u,v)\\mapsto(1-u/2,3v+4)\\). The turning point becomes \\((2,19)\\). The vertical asymptote becomes \\(x=1-4/2=-1\\). The horizontal asymptote becomes \\(y=3(-1)+4=1\\). The graph is reflected in the y-axis and compressed horizontally by factor \\(1/2\\).`,'feature-map-turn');

  Concept('Block B · Combined transformations','Domain and range under transformations','Map endpoint structure carefully','Intervals transform through affine coordinate maps. Negative factors reverse order.',[
    {title:'Domain map',math:R`\\(x=h+u/b\\)`,text:'Map the original domain values \\(u\\). If \\(b<0\\), interval orientation reverses before writing endpoints in increasing order.'},
    {title:'Range map',math:R`\\(y=k+av\\)`,text:'Map the original range values \\(v\\). If \\(a<0\\), upper and lower roles reverse.'},
    {title:'Example',math:R`\\(u\\ge0,\ b=-2,\ h=3\\Rightarrow x\\le3\\)`,text:'A right-hand base ray becomes a left-hand image ray.'}
  ],'domain-range-transform');

  Worked('Block B · Combined transformations','Recover the base point',R`A point \\((7,11)\\) lies on \\(g(x)=-3f(2(x-4))+5\\). Determine the corresponding point on \\(y=f(x)\\).`,[
    R`Recover the base input: \\(u=b(x-h)=2(7-4)=6\\).`,
    R`Recover the base output: \\(v=(y-k)/a=(11-5)/(-3)=-2\\).`,
    R`Therefore the base point is \\((6,-2)\\).`,
    R`Forward mapping returns \\((7,11)\\), confirming the result.`
  ],R`\\[(7,11)\\mapsto(6,-2)\\]`,'The reverse coordinate map is not yet the inverse function; it reverses a graph transformation.','reverse-transform-map');

  S('Technology laboratory','Predict before changing parameters','content','Interactive transformation laboratory',R`<div class="tci5-lab-intro"><div><span>PREDICT</span><h2>Use \\(f(x)=0.5x^2-2\\) as the base graph.</h2><p>Before moving a control, predict the image vertex, orientation, horizontal width and the image of the selected base point.</p><ul><li>\\(a\\) changes outputs.</li><li>\\(b\\) changes inputs reciprocally.</li><li>\\(h\\) and \\(k\\) move the transformed coordinate system.</li></ul></div>${V('lab-preview','Preview of transformation parameter laboratory')}</div>`);

  S('Technology laboratory','Transformation parameter laboratory','lab','Change one parameter at a time',R`<div id="tci5-transform-lab" class="tci5-transform-lab"><div class="tci5-lab-loading">Preparing the exact coordinate laboratory…</div></div>`);

  S('Technology laboratory','Laboratory evidence record','student','Do not stop at the animation',R`<div class="tci5-evidence-task"><h2>Choose one non-trivial preset and record:</h2><ol><li>The exact equation of \\(g\\).</li><li>The coordinate map from \\((u,v)\\) to the image point.</li><li>The image of the selected point.</li><li>The vertex, domain and range of the transformed quadratic.</li><li>One independent verification.</li></ol><textarea class="student-note tall" data-note="lab-evidence" placeholder="Record a complete mathematical audit of one parameter set."></textarea></div>`);

  Misconception('Written order is not coordinate order',R`“For \\(g(x)=2f(3(x-1))+4\\), move a point right 1, then multiply its x-coordinate by 3.”`,R`The transformed input must equal the original input: \\(3(x-1)=u\\). Solving gives \\(x=1+u/3\\). The horizontal coordinate is divided by 3, then shifted by 1. The outside output map is \\(y=2v+4\\).`,'order-error');

  Checkpoint('Checkpoint B · Combined transformations',[
    R`For \\(g(x)=-4f(2(x+3))+1\\), write the forward coordinate map.`,
    R`Map the base point \\((10,-2)\\).`,
    R`Map a base vertical asymptote \\(x=6\\) and a base horizontal asymptote \\(y=3\\).`,
    R`If the image range is \\(y\\le1\\), deduce one possible base range when \\(a=-4\\) and \\(k=1\\).`
  ],'checkpoint-b',R`The map is \\((u,v)\\mapsto(u/2-3,1-4v)\\). The point maps to \\((2,9)\\). The asymptotes map to \\(x=0\\) and \\(y=-11\\). Since \\(1-4v\\le1\\), we obtain \\(v\\ge0\\), so one possible base range is \\(y\\ge0\\).`);

  Section('Block C · Inverse functions','Reverse a function only when reversal is unique','An inverse swaps the roles of input and output. The domain and range—and their units—must swap as well.','block-c');

  Concept('Block C · Inverse functions','Inverse as a reversible process','Undo in the opposite order','Suppose a process multiplies by 3 and then adds 8.',[
    {title:'Forward',math:R`\\(f(x)=3x+8\\)`,text:'Input \\(x\\) becomes \\(3x\\), then \\(3x+8\\).'},
    {title:'Reverse',math:R`\\(f^{-1}(y)=\\dfrac{y-8}{3}\\)`,text:'Subtract 8 first, then divide by 3.'},
    {title:'Check',math:R`\\(f^{-1}(f(x))=x\\)`,text:'The reverse process should return every allowed input.'}
  ],'inverse-process',R`Inverse operations are applied in reverse order.`);

  Concept('Block C · Inverse functions','Inverse relation versus inverse function','Swapping coordinates always forms a relation','Reflecting a graph in \\(y=x\\) swaps every ordered pair. The reflected relation is a function only if each new input has one output.',[
    {title:'Inverse relation',text:'Always obtained by swapping coordinates \\((x,y)\\mapsto(y,x)\\).'},
    {title:'Inverse function',text:'Requires the original function to be one-to-one on its selected domain.'},
    {title:'Graph test',text:'The original graph must pass the horizontal line test.'},
    {title:'Algebra test',math:R`\\(f(x_1)=f(x_2)\\Rightarrow x_1=x_2\\)`,text:'Equal outputs must come from equal allowed inputs.'}
  ],'inverse-relation-function');

  Concept('Block C · Inverse functions','The horizontal line test','Test uniqueness of reversal','A horizontal line represents one proposed output. If it meets the graph more than once, that output came from more than one input.',[
    {title:'Passes',text:'Every horizontal line intersects at most once; an inverse function exists on that domain.'},
    {title:'Fails',text:'Some output has multiple preimages; the reflected relation fails the vertical line test.'},
    {title:'Repair',text:'Restrict the original domain to a one-to-one branch, then state the restriction explicitly.'}
  ],'horizontal-line-principle');

  S('Block C · Inverse functions','Why an unrestricted quadratic fails','content','One output, two preimages',R`<div class="tci5-graph-study"><div>${V('horizontal-line-test','Horizontal line test on a quadratic')}</div><div><h2>At output 4</h2><p>For \\(f(x)=x^2\\), both \\(x=-2\\) and \\(x=2\\) produce 4. The inverse relation would map 4 to two outputs.</p><p>Restricting to \\(x\\ge0\\) keeps the right branch and produces \\(f^{-1}(x)=\\sqrt{x}\\). Restricting to \\(x\\le0\\) keeps the left branch and produces \\(f^{-1}(x)=-\\sqrt{x}\\).</p></div></div>`);

  Concept('Block C · Inverse functions','Graph reflection principle','Domain and range swap','If \\(f(a)=b\\), then the point \\((a,b)\\) lies on \\(f\\), and \\((b,a)\\) lies on \\(f^{-1}\\).',[
    {title:'Reflection line',math:R`\\(y=x\\)`,text:'Every point and its inverse image are equidistant from this line.'},
    {title:'Fixed points',math:R`\\(f(x)=x\\)`,text:'Points already on \\(y=x\\) remain fixed under reflection.'},
    {title:'Feature swap',text:'x-intercepts become y-intercepts; domain endpoints become range endpoints.'}
  ],'inverse-reflection-principle');

  S('Block C · Inverse functions','A precise linear inverse pair','content','Three mapped point pairs',R`<div class="tci5-graph-study"><div>${V('inverse-linear','Graph of a linear function, its inverse, and y equals x')}</div><div><h2>Function pair</h2><p>\\(f(x)=2x-3\\) and \\(f^{-1}(x)=\\dfrac{x+3}{2}\\).</p><ul><li>\\((0,-3)\\leftrightarrow(-3,0)\\).</li><li>\\((2,1)\\leftrightarrow(1,2)\\).</li><li>\\((4,5)\\leftrightarrow(5,4)\\).</li></ul><p>The graphs meet on \\(y=x\\) at \\((3,3)\\), because \\(f(3)=3\\).</p></div></div>`);
})();
