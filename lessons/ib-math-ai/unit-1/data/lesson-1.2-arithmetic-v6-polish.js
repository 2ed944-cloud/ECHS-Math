(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.2')return;

  const byId=id=>data.practice.find(item=>item.id===id);
  const promptUpdates={
    'ASV6-1.2-A02':'A stadium section has \\(34\\) seats in row \\(1\\), with \\(4\\) additional seats in each later row. Calculate the total number of seats in the first \\(28\\) rows.',
    'ASV6-1.2-A04':'A student deposits QAR \\(45\\) in week \\(1\\) and increases the weekly deposit by QAR \\(8\\). Find the total deposited during the first \\(20\\) weeks.',
    'ASV6-1.2-A06':'Arturo swims \\(200\\) m in week \\(1\\) and \\(30\\) m more each week for \\(52\\) weeks. Calculate his total distance over the programme.',
    'ASV6-1.2-A16':'An arithmetic sequence has \\(u_1=-23\\) and \\(d=11\\). Given that \\(u_n=516\\), find \\(n\\) and \\(S_n\\).',
    'ASV6-1.2-A18':'Find the sum of all positive terms of the arithmetic sequence \\(85,78,71,\\ldots\\).'
  };
  for(const [id,prompt] of Object.entries(promptUpdates)){
    const item=byId(id);
    if(item)item.prompt=prompt;
  }

  data.v6Audit=Object.assign({},data.v6Audit,{
    selfContainedPracticePrompts:true,
    mathematicalReaudit:'term, sum, sigma, inverse, threshold and parameter values independently recomputed',
    presentationContract:'AP-style full-screen teaching; stable HTML/CSS graphics; KaTeX-safe mathematics'
  });
})();
