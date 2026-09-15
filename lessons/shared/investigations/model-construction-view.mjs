import {openBoxModel} from './ap-model-construction-model.mjs';
import {svgNode,scrollableGraph} from './visuals.mjs';
import {mountControls,element,text,numeric,dataTable,plot} from './modeling-view-helpers.mjs';
const fields=Object.freeze({t:[.25,4.75,.25]});
function diagram(doc,state,kind) {
  const title=kind==='net'?'Sheet net with four equal corner cuts':'Open-box isometric dimension diagram';
  const svg=svgNode(doc,'svg',{viewBox:'0 0 600 340',class:'ei-graph',role:'img','aria-label':title,'data-modeling-diagram':kind});svg.append(svgNode(doc,'title',{},title));
  const {t}=state.input,{length:L,width:W,height:H}=state.dimensions;
  if(kind==='net') {
    const scale=20,x=n=>100+n*scale,y=n=>50+n*scale;
    const cross=[[t,0],[18-t,0],[18-t,t],[18,t],[18,10-t],[18-t,10-t],[18-t,10],[t,10],[t,10-t],[0,10-t],[0,t],[t,t]];
    svg.append(svgNode(doc,'polygon',{points:cross.map(([a,b])=>`${x(a)},${y(b)}`).join(' '),fill:'#e3eeeb',stroke:'#173f45','stroke-width':2,'data-box-net':''}));
    for(const [a,b]of [[0,0],[18-t,0],[18-t,10-t],[0,10-t]])svg.append(svgNode(doc,'rect',{x:x(a),y:y(b),width:scale*t,height:scale*t,fill:'#f8e8de',stroke:'#8a1738','stroke-dasharray':'4 3','data-box-cut':'','data-x':a,'data-y':b,'data-side':t}));
    svg.append(svgNode(doc,'rect',{x:x(t),y:y(t),width:scale*L,height:scale*W,fill:'none',stroke:'#087d7b','stroke-width':2,'stroke-dasharray':'7 4','data-box-base':'','data-length':L,'data-width':W}));
    svg.append(svgNode(doc,'text',{x:280,y:30,'text-anchor':'middle',class:'ei-axis-label'},'Original sheet length: 18 cm'),svgNode(doc,'text',{x:480,y:140,class:'ei-axis-label'},'10 cm'),svgNode(doc,'text',{x:300,y:290,'text-anchor':'middle',class:'ei-axis-label'},`Cut four squares of side t = ${numeric(t)} cm`));
  } else {
    const project=([x,z,h])=>({x:300+10*(x-z)*Math.sqrt(3)/2,y:100+5*(x+z)-10*h});
    const faces=[[[0,0,0],[L,0,0],[L,W,0],[0,W,0]],[[0,0,0],[L,0,0],[L,0,H],[0,0,H]],[[0,0,0],[0,W,0],[0,W,H],[0,0,H]],[[L,0,0],[L,W,0],[L,W,H],[L,0,H]],[[0,W,0],[L,W,0],[L,W,H],[0,W,H]]];
    faces.forEach((face,i)=>svg.append(svgNode(doc,'polygon',{points:face.map(p=>{const q=project(p);return `${q.x},${q.y}`;}).join(' '),fill:i===0?'#e3eeeb':'#b9dcd7','fill-opacity':i===0?1:.35,stroke:'#173f45','stroke-width':1.5,'data-box-face':i,'data-world':JSON.stringify(face)})));
    svg.append(svgNode(doc,'text',{x:300,y:285,'text-anchor':'middle',class:'ei-axis-label'},`Length ${numeric(L)} cm × width ${numeric(W)} cm × height ${numeric(H)} cm`));
  }
  const fig=scrollableGraph(doc,svg,title);fig.append(text(doc,kind==='net'?'Dashed corner squares are removed. The dashed inner rectangle is the base; its edges are the fold lines.': 'The five faces leave an open top. Length, width and height use the same scale; changing the cut size changes these dimensions together.'));return fig;
}
export function mountModelConstruction(options) {
  return mountControls({...options,family:'construction',fields,title:'Construct an open-box volume model',
    render(doc,input) {
      const s=openBoxModel(input),node=element(doc,'div'),d=s.dimensions;
      node.append(text(doc,'Original synthetic idealized sheet: 18 cm × 10 cm, negligible thickness, equal square corner cuts and exact right-angle folds.','data-box-assumptions'));
      node.append(text(doc,`V(t) = t(18 − 2t)(10 − 2t) = 4t³ − 56t² + 180t. At t = ${numeric(input.t)} cm, V = ${numeric(s.volume)} cm³.`,'data-box-formula','ei-formula'));
      node.append(text(doc,`Base length = ${numeric(d.length)} cm; base width = ${numeric(d.width)} cm; height = ${numeric(d.height)} cm. Physical domain: 0 < t < 5 cm. The cubic formula has algebraic domain all real numbers.`,'data-box-dimensions'));
      const grid=element(doc,'div',undefined,'ei-grid');grid.append(diagram(doc,s,'net'),diagram(doc,s,'isometric'));node.append(grid);
      node.append(plot(doc,{key:'box-volume',title:'Open-box volume within the physical cut-size interval',xLabel:'Cut size t (cm)',yLabel:'Volume V(t) (cm³)',
        series:[{key:'volume',label:'Cubic volume curve on 0 < t < 5; endpoint limits shown',points:[{x:0,y:0},...s.points,{x:5,y:0}]}],
        features:[...s.boundaryPoints.map(p=>({x:p.t,y:p.volume,open:true,key:'excluded-boundary',label:`t = ${p.t} cm: limiting zero volume, not a usable box`})),{x:input.t,y:s.volume,diamond:true,key:'selected-box',label:`Selected box (${numeric(input.t)} cm, ${numeric(s.volume)} cm³)`}]}));
      node.append(text(doc,`The largest volume among the 19 displayed quarter-step samples is ${numeric(s.sampleMaximum.volume)} cm³ at t = ${numeric(s.sampleMaximum.t)} cm. This is a sample comparison, not a proof of the global maximum; the curve can peak between listed samples.`,'data-box-sample-maximum'));
      node.append(dataTable(doc,['t (cm)','Length (cm)','Width (cm)','Height (cm)','V (cm³)'],s.table.map(r=>[r.t,r.length,r.width,r.height,r.volume]),'Usable boxes at quarter-centimetre cut sizes','box-dimensions'));
      node.append(dataTable(doc,['From t (cm)','To t (cm)','Volume change (cm³)','Average change (cm³ per cm)'],s.adjacentRates.map(r=>[r.from,r.to,r.change,r.rate]),'Average rates between adjacent displayed samples','box-rates'));
      node.append(text(doc,'Negative average change means that volume decreases as the cut size increases. It does not mean the box has negative volume. The hollow endpoint limits do not represent admissible boxes.','data-box-interpretation'));
      return {node,summary:`Cut ${numeric(input.t)} cm: box ${numeric(d.length)} by ${numeric(d.width)} by ${numeric(d.height)} cm; volume ${numeric(s.volume)} cubic centimetres.`};
    }});
}
