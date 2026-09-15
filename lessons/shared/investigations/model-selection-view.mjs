import {modelSelection} from './ap-model-selection-model.mjs';
import {mountControls,element,text,numeric,dataTable,plot} from './modeling-view-helpers.mjs';
const fields=Object.freeze({delta:[-4,4,.5],candidate:[0,1,1]});
export function mountModelSelection(options) {
  return mountControls({...options,family:'selection',fields,title:'Fixed candidates and signed residuals',
    selects:{candidate:[[0,'Linear candidate L(x) = 4x − 1'],[1,'Quadratic candidate Q(x) = x² + 1']]},
    render(doc,input) {
      const s=modelSelection(input),node=element(doc,'div'),selected=s.selected;
      node.append(text(doc,'Original synthetic readings: time x = 0, 1, 2, 3, 4 seconds. Position relative to an origin starts at 1, 2, 5, 10, 17 cm; δ (cm) changes only the reading at x = 2 seconds.','data-selection-provenance'));
      node.append(text(doc,`Selected fixed candidate: ${selected.formula}. Neither candidate is fitted or refitted when δ changes. Residual = observed − predicted.`,'data-selection-candidate','ei-formula'));
      node.append(plot(doc,{key:'selection-data',title:'Synthetic observations and two fixed candidate functions',xLabel:'Time x (seconds)',yLabel:'Position y relative to origin (cm)',
        series:[{key:'observations',label:'Synthetic observations',points:s.observations,connect:false,dots:true},
          ...s.candidates.map(c=>({key:c.id,label:`Fixed ${c.formula}${c.id===selected.id?' — selected':''}`,points:c.points,emphasis:c.id===selected.id}))]}));
      node.append(plot(doc,{key:'selection-residuals',title:`Signed residuals for the fixed ${selected.id} candidate`,xLabel:'Time x (seconds)',yLabel:'Observed − predicted position (cm)',
        series:[{key:'residuals',label:`Residuals for ${selected.formula}; vertical stems start at zero`,points:selected.rows.map(r=>({x:r.x,y:r.residual})),connect:false,dots:true,stems:true}]}));
      node.append(text(doc,`Selected SSE = ${numeric(selected.sse)} cm²; RMSE ≈ ${numeric(selected.rmse)} cm. ${s.ranking.best==='tie'?'Both candidates tie in SSE.':`${s.ranking.best==='linear'?'L':'Q'} has the smaller SSE for these five readings.`} This comparison does not establish a true global generating mechanism.`,'data-selection-error-summary'));
      node.append(dataTable(doc,['Time x (s)','Observed (cm)','Predicted (cm)','Residual (cm)','Residual² (cm²)'],selected.rows.map(r=>[r.x,r.observed,r.predicted,r.residual,r.squaredResidual]),`Selected fixed ${selected.id} candidate: observations and residuals`,'selection-residuals'));
      node.append(dataTable(doc,['Fixed candidate','SSE (cm²)','RMSE (cm)','Fitted?'],s.candidates.map(c=>[c.formula,c.sse,c.rmse,'No']), 'Compare both fixed candidates on the same five readings','selection-statistics'));
      node.append(dataTable(doc,['Time interval (s)','First difference (cm)'],s.firstDifferences.map((y,i)=>[`${i} to ${i+1}`,y]),'First differences across equal input steps','selection-first-differences'));
      node.append(dataTable(doc,['Adjacent differences','Second difference (cm)'],s.secondDifferences.map((y,i)=>[`${i+1} minus ${i}`,y]),'Second differences','selection-second-differences'));
      node.append(text(doc,'The observed time interval is [0, 4] seconds. A negative position is permitted because position is measured relative to an origin. Both candidate polynomials have algebraic domain all real numbers; that does not justify predictions outside the observed interval. The plotted residual points, their signs and the zero baseline are separate from the data values.','data-selection-domain'));
      return {node,summary:`Fixed ${selected.id} candidate: SSE ${numeric(selected.sse)}, RMSE approximately ${numeric(selected.rmse)}. Data perturbation ${input.delta}; no refitting.`};
    }});
}
