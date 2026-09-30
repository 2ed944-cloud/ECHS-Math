import {CATALOG,CURRICULUM,REVISION} from './catalog.mjs';
export const choice=(options,index)=>({kind:'choice',options,index});
export const number=(value,unit='',tolerance=1e-9)=>({kind:'number',value,unit,tolerance});
export const graph=(coefficients,domain,range)=>({coefficients,domain,range});
export const table=(headers,rows,caption='Given values')=>({headers,rows,caption});
export function task(id,title,prompt,steps,extra={}) {
  return {id,title,kind:'activity',prompt,steps,answer:{kind:'reflection'},calculator:'No calculator',...extra};
}
export function notes(id,title,prompt,steps,extra={}) {
  return task(id,title,prompt,steps,{kind:'notes',...extra});
}
export function sim(id,title,prompt,model,observations,extra={}) {
  return task(id,title,prompt,observations,{kind:'simulation',model,...extra});
}
export function make(topic,goals,slides,sources=[]) {
  const item=CATALOG.find(x=>x.topic===topic);
  return Object.freeze({...item,revision:REVISION,curriculum:CURRICULUM,original:true,
    sources:sources.map(x=>({file:x[0],slides:x[1],use:'Teaching sequence and concepts. Restricted prompts and images are not republished.'})),
    goals,slides:[
      {id:'welcome',kind:'cover',title:item.title,prompt:'AP Precalculus '+topic,goals,steps:[]},
      ...slides,
      {id:'reflect',kind:'reflection',title:'Explain your next step',
       prompt:'Choose one idea you can now explain and one idea you still need to practise. Give a specific example or calculation.',
       answer:{kind:'reflection'},steps:['Compare your explanation with the lesson goals. Revisit the example that addresses your remaining question.',
       'Use More practice & original lesson for the complete existing question sets and simulations. Your reflections and revealed steps are not platform mastery scores.']}
    ]});
}
