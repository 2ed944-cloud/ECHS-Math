(function(){'use strict';const B=window.U415_ASSESS;if(!B)return;const {data,U,D,qs,mcq,num,short}=B;
// REASONING 18
mcq('Reasoning','Explain','Why is df=k−1 for the stated SL model?',['One category is ignored','The fixed total makes the last count depend on the others','p removes one category','Expected counts are rounded'],1,'Equal totals impose one constraint.');
num('Reasoning','Predict','If |O−E| doubles with E fixed, by what factor does contribution change?',4,0,'The gap is squared.');
mcq('Reasoning','Compare','A gap of 5 occurs with E=10 and E=100. Which contributes more?',['Equal','E=100 by factor 10','E=10 by factor 10','E is irrelevant'],2,'25/10=2.5 versus 25/100=0.25.');
mcq('Reasoning','Audit','O=2 and E=8. Does the SL condition fail because O<5?',['Yes','No; the condition concerns E and 8>5','Both must exceed 10','Any E>0 works'],1,'Expected, not observed, controls this condition.');
mcq('Reasoning','Interpret','A rejected test has Bus as a major contribution. What is justified?',['Bus policy caused it','Only Bus changed','The population distribution differs and Bus strongly contributes to the sample discrepancy','Population Bus share equals sample share'],2,'Contribution analysis is diagnostic, not causal.');
mcq('Reasoning','Explain','Why does non-rejection not prove H₀?',['H₀ cannot be tested','Power may be insufficient for a modest real departure','p is always >.05','E is random'],1,'Insufficient evidence is not exact equality.');
mcq('Reasoning','Determine',`Transport p=${U.fmt(D.transport.r.p,4)}. Which pair is correct?`,['Reject at 1% and 5%','Reject at 5% but not 1%','Reject at 1% but not 5%','Reject at neither'],1,'p lies between .01 and .05.');
mcq('Reasoning','Verify','p-value method rejects but critical-value method does not, with same df and α. What follows?',['Both can be correct','Different hypotheses','At least one input or comparison is wrong','Always trust critical'],2,'The boundaries are equivalent.');
mcq('Reasoning','Diagnose','Which transport category has the largest contribution?',['Bus','Car','Metro','Walk'],3,'Walk contributes 64/18≈3.5556.');
mcq('Reasoning','Interpret','A signed Pearson residual is negative. Meaning?',['O<E','Contribution is negative','E is invalid','p is negative'],0,'Residual sign tracks O−E.');
mcq('Reasoning','Audit','Why is setting pᵢ=Oᵢ/n from the same sample invalid for this external GOF task?',['E becomes non-integer','It forces E=O and χ²=0','df is negative','O becomes percentages'],1,'The model is reverse-engineered from the evidence.');
mcq('Reasoning','Evaluate','Twenty students each give 30 daily responses, treated as 600 independent. Main concern?',['Quantitative categories','Within-student correlation','Sample too large','E cannot be found'],1,'Repeated responses are clustered.');
mcq('Reasoning','Comment','Why consider practical importance after significance in a huge sample?',['χ² is impossible','Small proportional departures can become detectable','p measures cost','df becomes zero'],1,'Significance is not magnitude or consequence.');
mcq('Reasoning','Explain','Why does combining categories require new df?',['Only colours change','k and the tested population question change','E stays unchanged','Significance is guaranteed'],1,'Grouping changes the model and k.');
mcq('Reasoning','Predict','Correct O/E lists but wrong df: what changes?',['χ² only','p-value, not χ²','O','E'],1,'χ² depends on O/E; p depends on reference df.');
mcq('Reasoning','Predict','Both O and E lists are permuted identically. χ²?',['Changes sign','Unchanged','Becomes zero','df doubles'],1,'Matched category pairs are only reordered.');
mcq('Reasoning','Audit','Only E is reordered. Description?',['Equivalent test','Invalid category mismatch','Reduces df','Lower-tail test'],1,'Rows no longer describe the same categories.');
mcq('Reasoning','Predict','For fixed df, as χ² increases, upper-tail p does what?',['Increases','Decreases','Stays constant','Becomes negative'],1,'Less area remains to the right.');
// CHALLENGE 14
num('Challenge','Calculate','Library O=(40,52,18,30), P=(.25,.40,.15,.20): enter χ².',D.library.r.stat,.001,'E=(35,56,21,28); χ²≈1.5714.',{calculator:'GDC allowed'});
num('Challenge','Find','Uniform house O=(45,39,44,32): enter p.',D.house.r.p,.001,'χ²=2.65, df=3, p≈0.4488.',{calculator:'GDC required'});
num('Challenge','Calculate','Arrival O=(24,43,51,32), P=(.15,.30,.35,.20): enter χ².',D.arrivals.r.stat,.001,'χ²≈0.3651.');
num('Challenge','Diagnose','Device data: enter the largest contribution.',Math.max(...D.devices.r.contrib),.001,'Category D contributes 4/27≈0.1481.');
num('Challenge','Determine','Smallest pᵢ=.04. Smallest integer n making npᵢ>5?',126,0,'.04n>5 gives n>125.');
})();
