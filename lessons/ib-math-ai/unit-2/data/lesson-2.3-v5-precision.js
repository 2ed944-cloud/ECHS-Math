(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='2.3')return;const R=String.raw;
const setPractice=(id,patch)=>{const item=data.practice.find(q=>q.id===id);if(item)Object.assign(item,patch);};
setPractice('IBAI-2.3-V5-P025',{answer:R`\(P(x)=x^3+x^2+x+2\)`,solution:R`Third difference is 6, so \(a=1\). With \(P(0)=2\), substitution gives \(b=1,c=1\).`,check:{mode:'text',accepted:['x^3+x^2+x+2','P(x)=x^3+x^2+x+2']}});
setPractice('IBAI-2.3-V5-P075',{answer:R`\(P(x)=x^3+x^2+x+3\)`,solution:R`Third differences are 6, so \(a=1\). Substitution gives \(b=1,c=1,d=3\).`,check:{mode:'text',accepted:['x^3+x^2+x+3','P(x)=x^3+x^2+x+3']}});
setPractice('IBAI-2.3-V5-P079',{prompt:R`For \(P(x)=-0.05(x-10)(x-60)(x+20)\), \(0\le x\le80\), determine the whole-number input giving maximum profit.`,answer:R`\(x=40\)`,solution:R`TI‑84 Maximum gives the exact contextual maximum \((40,1800)\).`,check:{mode:'text',accepted:['40','x=40']}});
const task=data.exam.find(t=>t.id==='U2-2.3-V5-T6');if(task){
 task.parts[1].answer=R`Since third difference is 6, \(a=1\). The data are fitted by \(P(x)=x^3+x^2+x+3\).`;
 task.parts[2].answer=R`\(P(5)=125+25+5+3=158\).`;
 task.parts[3].answer=R`The formula gives \(P(20)=8423\), but this is far outside the observed interval 0–4. The prediction is high-risk extrapolation and may be unrealistic.`;
}
const profit=data.slides.find(s=>s.title==='Paper 2 synthesis · cubic revenue');if(profit){profit.html=R`<div class="p23-worked"><article class="p23-question"><span>QUESTION</span><h2>Profit is \(P(x)=-0.05(x-10)(x-60)(x+20)\) QAR for \(0\le x\le80\). Determine the break-even quantities and maximum profit.</h2></article><article class="p23-solution"><span>REASONING</span><ol><li>The algebraic zeros are \(-20,10,60\); the contextual domain retains 10 and 60.</li><li>On TI‑84, enter the model and use Zero near \(x=10\) and \(x=60\).</li><li>Use Maximum between the two zeros to obtain \((40,1800)\).</li><li>Verify \(P(40)=1800\) and state the model domain.</li></ol><div class="p23-answer"><b>Answer:</b> break-even at 10 and 60 units; maximum profit 1800 QAR at 40 units.</div></article></div>`;}
data.audit.precisionPatch='5.0.1';
})();
