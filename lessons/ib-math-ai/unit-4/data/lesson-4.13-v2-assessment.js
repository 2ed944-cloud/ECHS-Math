(function(){
  'use strict';
  const data=window.LESSON_DATA,U=window.U413_STATS,D=window.U413_DATASETS;
  if(!data||String(data.lesson?.number)!=='4.13'||!U||!D)return;
  const f=(n,d=4)=>U.fmt(n,d);
  const evidence=(r,d=4)=>`\\(t=${f(r.t,d)},\\ p=${f(r.p,d)},\\ df=${r.df}\\)`;
  const shuttle=U.pooledArrays(D.shuttle.a,D.shuttle.b,'lt');
  const solar=U.pooledSummary(418,35,15,391,32,13,'neq');
  const weightsGt=U.pooledArrays(D.weights.a,D.weights.b,'gt');
  const weightsTwo=U.pooledArrays(D.weights.a,D.weights.b,'neq');
  const withOutlier=U.pooledArrays(D.outlier.a,D.outlier.b,'neq');
  const withoutOutlier=U.pooledArrays(D.outlier.a,D.outlier.b.slice(0,-1),'neq');

  data.exam=[
    {
      id:'U4-13-IB1',title:'Route waiting times',context:'Independent random samples',calculator:'GDC required',total_marks:10,
      instructions:'Show hypotheses, calculator evidence, decision, and a contextual population conclusion. Route A is population 1 and Route B is population 2.',
      parts:[
        {label:'a',marks:2,prompt:`The waiting-time samples are<br><b>Route A:</b> ${D.shuttle.a.join(', ')}<br><b>Route B:</b> ${D.shuttle.b.join(', ')}<br>Define the two population parameters and state hypotheses to test whether Route A has the lower population mean waiting time.`,answer:'\\(H_0:\\mu_A=\\mu_B\\); \\(H_1:\\mu_A<\\mu_B\\).',solution:'Let \\(\\mu_A\\) and \\(\\mu_B\\) be the population mean waiting times, in minutes, for Routes A and B. The directional claim is represented by \\(H_1:\\mu_A<\\mu_B\\).'},
        {label:'b',marks:2,prompt:'State the statistical procedure and the model conditions required for the pooled course test.',answer:'Pooled one-tailed two-sample t-test; independent samples, quantitative response, approximately normal populations/no severe outliers, equal population variances.',solution:'The observations come from different routes and are treated as independent. Waiting time is quantitative. The problem must support approximate normality and equal population variances for Pooled: Yes.'},
        {label:'c',marks:3,prompt:'Carry out the test. Record the TI-84 settings and the values of \\(t\\), \\(p\\), and \\(df\\).',answer:evidence(shuttle,6),solution:`Use Data mode, List1=L1 (Route A), List2=L2 (Route B), Freq1=Freq2=1, \\(\\mu_1<\\mu_2\\), Pooled: Yes. The output is ${evidence(shuttle,6)}.`},
        {label:'d',marks:2,prompt:'State the decision and conclusion at the 1% significance level.',answer:'Reject H₀; sufficient evidence that Route A has the lower population mean wait.',solution:`Because \\(p=${f(shuttle.p,6)}<0.01\\), reject \\(H_0\\). There is sufficient evidence at the 1% level that Route A has the lower population mean waiting time.`},
        {label:'e',marks:1,prompt:'Explain why the test result alone does not show that changing every passenger to Route A would cause a shorter wait.',answer:'The comparison is not necessarily a randomized experiment; confounding and route conditions may explain the association.',solution:'A small p-value addresses random variation under the test model. Causal interpretation requires a design such as random assignment and control of implementation conditions.'}
      ]
    },
    {
      id:'U4-13-IB2',title:'Solar panel output',context:'Summary-statistics workflow',calculator:'GDC required',total_marks:10,
      instructions:'Two independent random samples are assumed to come from approximately normal populations with equal variances. Output is measured in watts.',
      parts:[
        {label:'a',marks:3,prompt:'Panel type 1 has \\(\\bar x_1=418,s_1=35,n_1=15\\); type 2 has \\(\\bar x_2=391,s_2=32,n_2=13\\). Calculate \\(df\\) and the pooled standard deviation \\(s_p\\).',answer:`\\(df=26\\), \\(s_p=${f(solar.sp,3)}\\).`,solution:`\\(df=15+13-2=26\\). Also \\(s_p=\\sqrt{[14(35^2)+12(32^2)]/26}=${f(solar.sp,4)}\\).`},
        {label:'b',marks:2,prompt:'Use a pooled two-tailed test to determine whether the population mean outputs differ. Record \\(t\\) and \\(p\\).',answer:evidence(solar,5),solution:`In Stats mode enter the two triples \\(418,35,15\\) and \\(391,32,13\\), select \\(\\mu_1\\ne\\mu_2\\), and Pooled: Yes. The output is ${evidence(solar,5)}.`},
        {label:'c',marks:2,prompt:'State the decision and contextual conclusion at the 5% significance level.',answer:'Reject H₀; sufficient evidence that the two population mean outputs differ.',solution:`Since \\(p=${f(solar.p,5)}<0.05\\), reject \\(H_0\\). There is sufficient evidence at the 5% level that the two population mean solar-panel outputs differ.`},
        {label:'d',marks:1,prompt:'State the decision at the 1% significance level.',answer:'Do not reject H₀.',solution:`Because \\(p=${f(solar.p,5)}>0.01\\), do not reject \\(H_0\\) at 1%.`},
        {label:'e',marks:2,prompt:'Explain why the TI-84 Stats screen requires \\(Sx\\) rather than \\(\\sigma x\\), and why \\(\\alpha\\) is not entered on the test screen.',answer:'Sx is the sample SD used to estimate unknown population spread; α is compared with the returned p-value after calculation.',solution:'The t-model is used because population standard deviations are unknown and estimated by sample standard deviations. The calculator returns a p-value for the selected alternative; the user then applies the chosen significance threshold.'}
      ]
    },
    {
      id:'U4-13-IB3',title:'One tail or two?',context:'Same data, different pre-specified claims',calculator:'GDC required',total_marks:12,
      instructions:'Sample 1 and sample 2 are independent; the population distributions are assumed approximately normal with equal variances.',
      parts:[
        {label:'a',marks:2,prompt:`The samples are<br><b>Sample 1:</b> ${D.weights.a.join(', ')}<br><b>Sample 2:</b> ${D.weights.b.join(', ')}<br>Find \\(\\bar x_1\\) and \\(\\bar x_2\\).`,answer:'\\(\\bar x_1=70.1\\), \\(\\bar x_2=63.125\\).',solution:'Use 1-Var Stats or the output summary from 2-SampTTest. The observed difference is 6.975.'},
        {label:'b',marks:2,prompt:'State hypotheses for (i) the pre-specified claim that population 1 has the higher mean and (ii) the pre-specified claim that the population means differ.',answer:'(i) H₀: μ₁=μ₂, H₁: μ₁>μ₂. (ii) H₀: μ₁=μ₂, H₁: μ₁≠μ₂.',solution:'The first claim is right-tailed; the second is two-tailed. Both use the same ordered parameter difference.'},
        {label:'c',marks:3,prompt:'Carry out the right-tailed test and state the 5% conclusion.',answer:evidence(weightsGt,5),solution:`The pooled right-tailed output is ${evidence(weightsGt,5)}. Since \\(p<0.05\\), reject \\(H_0\\); there is sufficient evidence that population 1 has the higher mean.`},
        {label:'d',marks:3,prompt:'Carry out the two-tailed test and state the 5% conclusion.',answer:evidence(weightsTwo,5),solution:`The pooled two-tailed output is ${evidence(weightsTwo,5)}. Since \\(p>0.05\\), do not reject \\(H_0\\); there is insufficient evidence that the population means differ.`},
        {label:'e',marks:2,prompt:'Explain why the conclusions differ although the data and t-statistic are unchanged.',answer:'The pre-specified alternatives define different extreme regions; the two-tailed p-value includes both tails.',solution:'The right-tailed test uses the area to the right of the observed positive t. The two-tailed test also counts equally extreme negative values, doubling the tail probability in this symmetric case.'}
      ]
    },
    {
      id:'U4-13-IB4',title:'Outlier sensitivity audit',context:'Model validity and influence',calculator:'GDC required',total_marks:12,
      instructions:'Treat the two displayed lists as independent samples. The task is to evaluate whether a pooled t-test is responsible, not merely to obtain a p-value.',
      parts:[
        {label:'a',marks:2,prompt:`Sample A: ${D.outlier.a.join(', ')}<br>Sample B: ${D.outlier.b.join(', ')}<br>Describe the most important distributional feature that should be checked before testing.`,answer:'Sample B contains an extreme value, 41, creating a severe outlier/spread concern.',solution:'Most Sample B values lie between 16 and 20, while 41 is isolated. With n=10, this observation can strongly affect both the mean and variance.'},
        {label:'b',marks:3,prompt:'Ignoring the concern temporarily, carry out a pooled two-tailed test using all observations. Record the output.',answer:evidence(withOutlier,5),solution:`The output is ${evidence(withOutlier,5)}. The large pooled spread produces a small standardized statistic.`},
        {label:'c',marks:3,prompt:'For a sensitivity analysis only, remove 41 from Sample B and repeat the pooled two-tailed test. Compare the result.',answer:evidence(withoutOutlier,5),solution:`Without 41, the output is ${evidence(withoutOutlier,5)}. Both the mean difference and pooled standard error change, so the p-value changes substantially.`},
        {label:'d',marks:2,prompt:'Explain why removing an outlier solely to obtain a smaller p-value would be invalid.',answer:'Data handling must be justified by measurement or design evidence, not by whether the inferential result becomes favourable.',solution:'Deleting observations after inspecting their impact introduces researcher discretion into the error rate. Investigate data entry, measurement, and pre-specified rules instead.'},
        {label:'e',marks:2,prompt:'Give a defensible final recommendation about the pooled analysis.',answer:'Investigate the extreme value and model assumptions; report sensitivity and avoid a definitive pooled-test conclusion until the data issue is resolved.',solution:'The clean-data model is not credible automatically. A responsible report states the outlier, equal-variance/normality concern, sensitivity, and limits of any conclusion.'}
      ]
    }
  ];

  const q=(id,level,command,type,prompt,answer,extra={})=>({id,level,command,type,prompt,marks:1,calculator:'No GDC',tags:[],...extra,...(type==='mcq'?{choices:answer.choices,correct_index:answer.correct_index,answer:answer.choices[answer.correct_index]}:{numeric_answer:Number(answer.value),tolerance:Number(answer.tolerance),answer:f(answer.value,6)})});
  const quizStats=U.pooledSummary(91.2,4.1,20,89.5,3.9,18,'neq');
  const quizCost=U.pooledSummary(24.8,2.7,16,26.1,2.5,14,'lt');
  data.quiz=[
    q('U4-13-Q01','Foundation','Select','mcq','Which study requires an independent two-sample t-test?',{choices:['The same students before and after tutoring','Different students independently sampled from two programmes','One sample compared with a claimed mean','Counts classified by two categories'],correct_index:1},{solution:'Different students in the two groups create independent samples of a quantitative response.'}),
    q('U4-13-Q02','Foundation','Translate','mcq','L1 is Programme A and L2 is Programme B. The claim is that B has the lower mean. Which calculator alternative is correct?',{choices:['\\(\\mu_1<\\mu_2\\)','\\(\\mu_1>\\mu_2\\)','\\(\\mu_1\\ne\\mu_2\\)','Pooled: No'],correct_index:1},{solution:'B lower means \\(\\mu_B<\\mu_A\\), so in list order \\(\\mu_1>\\mu_2\\).'}),
    q('U4-13-Q03','Application','Calculate','numeric','A pooled test uses \\(n_1=13\\) and \\(n_2=17\\). Enter \\(df\\).',{value:28,tolerance:0},{solution:'\\(df=13+17-2=28\\).'}),
    q('U4-13-Q04','Application','Calculate','numeric','For \\(\\bar x_1=91.2,s_1=4.1,n_1=20\\) and \\(\\bar x_2=89.5,s_2=3.9,n_2=18\\), enter the pooled two-tailed t-statistic.',{value:quizStats.t,tolerance:0.003},{calculator:'GDC required',solution:`The pooled output gives \\(t=${f(quizStats.t,5)}\\).`}),
    q('U4-13-Q05','Challenge','Find','numeric','For \\(\\bar x_1=24.8,s_1=2.7,n_1=16\\) and \\(\\bar x_2=26.1,s_2=2.5,n_2=14\\), enter the p-value for \\(H_1:\\mu_1<\\mu_2\\).',{value:quizCost.p,tolerance:0.0006},{calculator:'GDC required',solution:`The pooled left-tailed output is \\(p=${f(quizCost.p,5)}\\).`}),
    q('U4-13-Q06','Reasoning','Determine','mcq','A two-tailed test gives \\(p=0.073\\). Which decision pair is correct?',{choices:['Reject at 5% and 10%','Reject at 10% but not 5%','Reject at 5% but not 10%','Do not reject at either level'],correct_index:1},{solution:'0.073 is below 0.10 but above 0.05.'}),
    q('U4-13-Q07','Application','Configure','mcq','Raw data are in L3 and L4. Which setup is correct for the pooled course test?',{choices:['Stats; x̄1=L3, x̄2=L4','Data; List1=L3, List2=L4, Freq1=Freq2=1, Pooled: Yes','Data; List1=L1 and List2=L2 only','2-Var Stats; Pooled: Yes'],correct_index:1},{calculator:'GDC workflow',solution:'Data mode can point to the actual list names. The pooled setting is Yes for the stated equal-variance model.'}),
    q('U4-13-Q08','Reasoning','Communicate','mcq','Which conclusion is valid when \\(p=0.44\\)?',{choices:['Accept H₀ and prove equal means','There is insufficient evidence for the stated alternative','H₁ has probability 0.44','The samples are from the same population'],correct_index:1},{solution:'A large p-value supports only a do-not-reject decision, not proof of equality.'}),
    q('U4-13-Q09','Challenge','Predict','numeric',`For the ordered weight samples, the pooled test statistic is \\(t=${f(weightsTwo.t,5)}\\). Enter t after reversing the two sample labels.`,{value:-weightsTwo.t,tolerance:0.002},{solution:'The numerator changes sign; the positive standard error does not.'}),
    q('U4-13-Q10','HOT','Audit','mcq','A small-sample pooled test has a severe outlier and sample SDs 2.0 and 8.5. What is the strongest response?',{choices:['Run Pooled: Yes and ignore the plots','Declare the population variances unequal with certainty','Investigate the outlier and common-variance/normality assumptions before relying on the pooled result','Switch to a one-tailed test'],correct_index:2},{solution:'The pooled model is questionable; the correct response is an assumption and data-quality audit, not a tail change.'})
  ];

  data.lesson.exam_task_count=data.exam.length;
  data.lesson.quiz_count=data.quiz.length;
  if(data.exam.length!==4||data.quiz.length!==10)console.warn('Lesson 4.13 assessment counts differ from the intended release.');
})();
