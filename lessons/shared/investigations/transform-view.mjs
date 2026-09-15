import {transformationModel} from './ap-transform-model.mjs';
import {mountControls,element,text,numeric,dataTable,plot} from './modeling-view-helpers.mjs';
const fields=Object.freeze({a:[-3,3,.5],horizontalMagnitude:[.5,2,.5],reverseInput:[0,1,1],h:[-4,4,.5],k:[-4,4,.5],u:[-2,3,.5]});
const interval=values=>'['+values.map(value=>numeric(value)).join(', ')+']';
export function mountTransform(options) {
  return mountControls({...options,family:'transform',fields,title:'Restricted parent and transformed image',
    selects:{reverseInput:[[0,'Preserve input order (positive b)'],[1,'Reverse input order (negative b)']]},
    render(doc,input) {
      const s=transformationModel(input),node=element(doc,'div');
      node.append(text(doc,`Parent f(u) = u² + u, with −2 ≤ u ≤ 3. Image g(x) = (${input.a})f((${s.b})(x − (${input.h}))) + (${input.k}).`,'data-transform-formula','ei-formula'));
      const ledger=`Parent domain ${interval(s.parent.domain)}; parent range ${interval(s.parent.range)}. Image domain ${interval(s.image.domain)}; image range ${interval(s.image.range)}. All displayed intervals are closed.`;
      node.append(text(doc,ledger,'data-transform-ledger'),text(doc,`Input equation u = (${s.b})(x − (${input.h})); solve x = ${input.h} + u/(${s.b}). Output equation y = (${input.a})(u² + u) + (${input.k}).`,'data-transform-map'));
      const p=s.selected.preimage,q=s.selected.image;
      node.append(text(doc,`Selected preimage (${numeric(p.x)}, ${numeric(p.y)}) maps to image (${numeric(q.x)}, ${numeric(q.y)}).`,'data-transform-selected'));
      node.append(plot(doc,{key:'transform',title:'Restricted parent and image with paired selected points',xLabel:'Parent input u / image input x',yLabel:'Parent f(u) / image g(x)',
        series:[{key:'parent',label:'Restricted parent f',points:s.parent.points},{key:'image',label:'Transformed image g',points:s.image.points}],
        features:[{...p,key:'preimage',label:`Selected preimage (${numeric(p.x)}, ${numeric(p.y)})`},
          {...q,key:'image',diamond:true,label:`Selected image (${numeric(q.x)}, ${numeric(q.y)})`}]}));
      node.append(text(doc,s.collapsed?`a = 0 collapses all output values to ${numeric(input.k)}. The mapped input domain ${interval(s.image.domain)} remains; this is not an invertible dilation.`:
        `a is nonzero. ${s.inputOrderReversed?'Negative b reverses the order of endpoint images.':'Positive b preserves the order of endpoint images.'} The selected image still comes from solving the input equation.`,'data-transform-interpretation'));
      node.append(dataTable(doc,['Preimage u','Parent f(u)','Image x = h + u/b','Image y = af(u) + k'],s.table.map(r=>[r.u,r.parentY,r.x,r.imageY]),'Paired parent and image points (decimal values rounded where needed)','transform-pairs'));
      node.append(dataTable(doc,['Parent endpoint u','Image x','Image y'],s.endpointImages.map(r=>[r.u,r.x,r.y]),'Endpoint correspondence retains original parent order','transform-endpoints'));
      node.append(text(doc,'The restricted sets are calculated from the parent interval and its vertex, not inferred from the sampled graph. Decimal labels are rounded approximations where division repeats.'));
      return {node,summary:`Updated mapped domain ${interval(s.image.domain)} and range ${interval(s.image.range)}; selected image (${numeric(q.x)}, ${numeric(q.y)}).`};
    }});
}
