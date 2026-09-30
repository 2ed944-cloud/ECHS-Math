// Formative teaching state only. No persistence, assessment evidence or platform grades.
export const freshState=()=>({draft:'',selected:null,paper:false,hint:false,checked:null,revealed:0,exploring:false});
export function revise(state,changes) {
  return Object.assign(state,changes,{checked:null,revealed:0,exploring:false});
}
export function attempted(state,slide) {
  if (slide.kind==='notes' || slide.kind==='cover') return true;
  return state.paper || (slide.answer?.kind==='choice'?state.selected!==null:state.draft.trim().length>0);
}
export function parseNumber(text) {
  const atom='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
  const match=String(text).trim().replaceAll('−','-').match(new RegExp('^('+atom+')(?:\\s*/\\s*('+atom+'))?$'));
  if(!match)return null;
  const numerator=Number(match[1]),denominator=match[2]===undefined?1:Number(match[2]);
  const result=numerator/denominator;
  return denominator!==0&&Number.isFinite(result)?result:null;
}
export function checkAnswer(slide,state) {
  if(slide.answer?.kind==='choice') return state.selected===slide.answer.index;
  if(slide.answer?.kind==='number') {
    const value=parseNumber(state.draft);
    return value===null?null:Math.abs(value-slide.answer.value)<=slide.answer.tolerance*Math.max(1,Math.abs(slide.answer.value));
  }
  return null;
}
export function classroomRequested(href) {
  const url=new URL(href);
  if(url.searchParams.get('classroom')==='1')return true;
  if(url.searchParams.get('classroom')==='0'||url.searchParams.get('forum')==='1')return false;
  if(['quiz','exam','practice','studio','teacher','mode'].some(key=>url.searchParams.has(key)))return false;
  return !url.hash || /^#classroom-[a-z0-9-]+$/.test(url.hash);
}
export function rateRows({a,b,c,start,width}) {
  if(![a,b,c,start,width].every(Number.isFinite)||width<=0)throw new Error('Invalid rate model');
  const f=x=>a*x*x+b*x+c;
  return Array.from({length:4},(_,i)=>{
    const left=start+i*width,right=left+width;
    return {left,right,output:f(left),next:f(right),change:f(right)-f(left),rate:(f(right)-f(left))/width};
  });
}
export function evaluatePolynomial(coefficients,x) {return coefficients.reduce((value,coefficient)=>value*x+coefficient,0);}
