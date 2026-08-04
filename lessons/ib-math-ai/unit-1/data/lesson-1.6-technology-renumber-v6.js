(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.8')return;
  Object.assign(data.lesson,{
    number:'1.6',slug:'technology-equations',title:'Technology for Equations and Systems',
    subtitle:'Use technology transparently to solve, classify and verify equations, systems, roots, intersections and model parameters.',
    transition:'This is the final lesson in the revised six-lesson Number and Algebra route.'
  });
  for(const item of data.slides||[]){
    if(typeof item.title==='string')item.title=item.title.replace(/^1\.8\b/,'1.6');
    if(typeof item.html==='string')item.html=item.html.replace(/<span class="cover-number">1\.8<\/span>/g,'<span class="cover-number">1.6</span>');
  }
  const route=(data.slides||[]).find(item=>item.title==='Your place in Unit 1');
  if(route){
    route.title='A six-lesson Number and Algebra route';
    route.html='<div class="unit-map"><div class="map-node"><b>1.1</b><span>Number Foundations, Scientific Notation and Approximation</span></div><div class="map-node"><b>1.2</b><span>Arithmetic Sequences and Series</span></div><div class="map-node"><b>1.3</b><span>Geometric Sequences and Series</span></div><div class="map-node"><b>1.4</b><span>Financial Applications</span></div><div class="map-node"><b>1.5</b><span>Exponent Laws and Logarithms</span></div><div class="map-node active"><b>1.6</b><span>Technology for Equations and Systems</span></div></div><p class="callout">Approximation is consolidated in Lesson 1.1, while loans and annuities are consolidated in Lesson 1.4.</p>';
  }
  data.version='5.3.3-renumbered';
})();
