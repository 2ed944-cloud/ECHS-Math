(function(){
'use strict';
const d=window.LESSON_DATA;if(!d||String(d.lesson?.number)!=='2.1')return;
const R=String.raw;let n=0;
const mathSafe=value=>String(value).replace(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g,match=>match.replace(/</g,'\\lt ').replace(/>/g,'\\gt '));
const id=()=>`IBAI-2.1-V4-P${String(++n).padStart(3,'0')}`;
const base=(level,command,prompt,answer,solution,marks,calculator,hint,tags)=>({id:id(),level,command,prompt:mathSafe(prompt),answer:mathSafe(answer),solution:mathSafe(solution),marks,calculator,hint,tags:['functions','lesson-2.1',...(tags||[])]});
const N=(level,command,prompt,value,answer,solution,marks=2,calculator='No GDC required',hint='Write the rule, substitute carefully and check the domain.',tolerance=1e-4,tags=[])=>({...base(level,command,prompt,answer,solution,marks,calculator,hint,tags),check:{mode:'number',value,tolerance}});
const X=(level,command,prompt,accepted,answer,solution,marks=2,calculator='No GDC required',hint='Use the definition and state the relevant inputs or outputs explicitly.',tags=[])=>({...base(level,command,prompt,answer,solution,marks,calculator,hint,tags),check:{mode:'text',accepted}});
const M=(level,command,prompt,choices,correct,solution,marks=2,calculator='No GDC required',hint='Test the defining condition rather than relying on appearance.',tags=[])=>({...base(level,command,prompt,choices[correct],solution,marks,calculator,hint,tags),choices,correct,check:{mode:'choice',value:correct}});
const P=[];
window.__ECHS_FN4_PRACTICE={d,R,N,X,M,P};
})();
