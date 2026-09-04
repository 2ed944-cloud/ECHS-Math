/* Original ECHS Topic 1.2 models. Graphs, tables and checks share these exact definitions. */
(function(root){
'use strict';
const models={
  hole:{label:'A changed value at x = 2',c:2,left:4,right:4,at:7,near:x=>x+2,domain:[0,4],range:[-1,8],tex:'f(x)=\\begin{cases}x+2&x\\ne2\\\\7&x=2\\end{cases}'},
  missing:{label:'No function value at x = 2',c:2,left:4,right:4,at:null,near:x=>x+2,domain:[0,4],range:[-1,8],tex:'f(x)=x+2,\\quad x\\ne2'},
  smooth:{label:'The limit equals the point value',c:2,left:4,right:4,at:4,near:x=>x+2,domain:[0,4],range:[-1,8],tex:'f(x)=x+2'},
  zero:{label:'A zero limit at a negative input',c:-2,left:0,right:0,at:3,near:x=>x+2,domain:[-4,0],range:[-3,4],tex:'f(x)=\\begin{cases}x+2&x\\ne-2\\\\3&x=-2\\end{cases}'},
  constant:{label:'Nearby outputs already equal the limit',c:1,left:-2,right:-2,at:3,near:()=>-2,domain:[-1,3],range:[-4,4],tex:'f(x)=\\begin{cases}-2&x\\ne1\\\\3&x=1\\end{cases}'},
  jump:{label:'The two sides approach different outputs',c:2,left:1,right:4,at:2,near:x=>x<2?1+.5*(x-2):4+.5*(x-2),domain:[0,4],range:[-1,6],tex:'f(x)=\\begin{cases}1+\\frac{x-2}{2}&x<2\\\\2&x=2\\\\4+\\frac{x-2}{2}&x>2\\end{cases}'}
};
function value(model,x){return x===model.c?model.at:model.near(x);}
function limit(model,side='both'){return side==='left'?model.left:side==='right'?model.right:model.left===model.right?model.left:'DNE';}
function sample(model,h,side){if(!Number.isFinite(h)||h<=0||!['left','right'].includes(side))return null;const x=model.c+(side==='left'?-h:h);if(x===model.c||x<model.domain[0]||x>model.domain[1])return null;return{x,y:value(model,x),h,side};}
function branches(left,right,at){return{label:'Independently adjustable left, right and point values',c:2,left,right,at,near:x=>(x<2?left:right)+.5*(x-2),domain:[0,4],range:[-5,8]};}
function localModel(far,at){return{label:'Only nearby behavior determines the limit at x = 2',c:2,left:4,right:4,at,near:x=>Math.abs(x-2)>=1?far:x+2,domain:[-1,5],range:[-3,10],breaks:[1,3]};}
const notationTasks=[
  {name:'Temperature',variable:'t',fn:'T',target:3,output:18,side:'both',prompt:'As time t approaches 3 minutes from either side, T(t), the temperature in degrees Celsius, approaches 18.'},
  {name:'Negative target',variable:'x',fn:'g',target:-2,output:5,side:'right',prompt:'As x approaches −2 through values greater than −2, the output g(x) approaches 5.'},
  {name:'Zero output',variable:'u',fn:'p',target:4,output:0,side:'both',prompt:'As u approaches 4 from either side, p(u) approaches 0.'},
  {name:'Left approach',variable:'x',fn:'q',target:1,output:-3,side:'left',prompt:'As x approaches 1 through values less than 1, q(x) approaches −3.'},
  {name:'Time from the right',variable:'t',fn:'V',target:0,output:12,side:'right',prompt:'As positive times t approach 0 hours, V(t), a volume in litres, approaches 12.'},
  {name:'Renamed input',variable:'u',fn:'f',target:-4,output:7,side:'both',prompt:'Using u as the input variable, express that f(u) approaches 7 as u approaches −4 from both sides.'}
];
function checkNotation(task,entry){return{variable:entry.variable===task.variable,target:parseNumber(entry.target)===task.target,output:parseNumber(entry.output)===task.output,side:entry.side===task.side};}
function parseAnswer(value){const s=String(value).trim();if(/^dne$/i.test(s))return'DNE';if(/^undefined$/i.test(s))return'undefined';return parseNumber(s);}
function correctAnswer(value,answer,tolerance=1e-6){const parsed=parseAnswer(value);return parsed!==null&&(typeof answer==='number'?typeof parsed==='number'&&Math.abs(parsed-answer)<=tolerance:parsed===answer);}
  function parseNumber(value){const s=String(value).trim().replace(/−/g,'-');if(!s)return null;if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)){const [a,b]=s.split('/').map(Number);const result=b!==0?a/b:NaN;return Number.isFinite(result)?result:null;}if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
  function correctNumber(value,answer,tolerance=.001){const n=parseNumber(value);return n!==null&&Math.abs(n-answer)<=tolerance+1e-10;}
  function format(n,d=3){if(n===null||!Number.isFinite(n))return'undefined';return(Math.abs(n)<.5*Math.pow(10,-d)?0:n).toFixed(d);}
  function navKey(event){return!event.defaultPrevented&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.target?.closest?.('input,textarea,select,button,a,summary,[contenteditable="true"],[role="dialog"]')&&['ArrowRight','ArrowLeft','PageDown','PageUp','Home','End'].includes(event.key);}

const api={models,value,limit,sample,branches,localModel,notationTasks,checkNotation,parseNumber,parseAnswer,correctAnswer,format,navKey};root.Calculus12=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
