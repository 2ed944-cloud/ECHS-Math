(function(){
  'use strict';

  const data=window.LESSON_DATA;
  if(!data||!data.lesson||!Array.isArray(data.slides)||data.__ibAiSlPacingMarkersApplied)return;

  const lessonNumber=String(data.lesson.number);
  const plans={
    '1.1':[
      {title:'Lesson 1.1A',time:'60–70 minutes',beginTitle:null},
      {title:'Lesson 1.1B',time:'60–70 minutes',beginTitle:'Exact values, approximations and estimates'},
      {title:'Lesson 1.1C',time:'60–70 minutes',beginTitle:'A question worth investigating'}
    ],
    '1.2':[
      {title:'Lesson 1.2A',time:'60–70 minutes',beginTitle:null},
      {title:'Lesson 1.2B',time:'60–70 minutes',beginTitle:'From terms to cumulative totals'}
    ],
    '1.3':[
      {title:'Lesson 1.3A',time:'60–70 minutes',beginTitle:null},
      {title:'Lesson 1.3B',time:'60–70 minutes',beginTitle:'A geometric series accumulates repeated effects'}
    ]
  };

  const plan=plans[lessonNumber];
  if(!plan)return;

  const labels={
    core:'🟢 Core (Teach in class)',
    practice:'🔵 Practice',
    extension:'🟠 Extension',
    revision:'🟣 Revision'
  };

  const normalize=value=>String(value||'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
  const titleIndex=title=>data.slides.findIndex(slide=>normalize(slide.title)===normalize(title));

  const fallbackFractions=lessonNumber==='1.1'?[0,0.34,0.67]:[0,0.5];
  const blocks=plan.map((block,index)=>{
    const located=block.beginTitle?titleIndex(block.beginTitle):0;
    return Object.assign({},block,{
      start:located>=0?located:Math.floor(data.slides.length*fallbackFractions[index])
    });
  }).sort((a,b)=>a.start-b.start);

  blocks.forEach((block,index)=>{
    block.end=index+1<blocks.length?blocks[index+1].start-1:data.slides.length-1;
  });

  const revisionPattern=/(diagnostic|misconception|checkpoint|exit ticket|mastery|synthesis|retrieval|review|prior-knowledge|command terms|summary|recap)/;
  const extensionPattern=/(extension|technology|generative|interactive|integrated ib-style|assessment literacy|inverse|threshold|separated terms|recover|symbolic|parameters|model|modelling|validate|saturation|bouncing-ball|calculated bounds|bounds in sums|bounds in differences|bounds in products|bounds in powers|bounds in quotients|maximum percentage error|complex numbers beyond|deriving)/;

  const classify=slide=>{
    const text=normalize([slide.section,slide.title,slide.kind,slide.eyebrow].join(' '));
    if(revisionPattern.test(text))return 'revision';
    if(extensionPattern.test(text))return 'extension';
    if(slide.kind==='student'||slide.kind==='inquiry'||slide.kind==='lab'||/student turn|your turn|opening problem/.test(text))return 'practice';
    return 'core';
  };

  const assignments=data.slides.map((slide,index)=>{
    const blockIndex=Math.max(0,blocks.findLastIndex(block=>index>=block.start));
    return {blockIndex,category:classify(slide)};
  });

  blocks.forEach((block,blockIndex)=>{
    const indices=[];
    for(let index=block.start;index<=block.end;index+=1)indices.push(index);
    const present=new Set(indices.map(index=>assignments[index].category));
    const choose=(category,predicate)=>{
      if(present.has(category))return;
      const candidate=indices.find(index=>predicate(data.slides[index],assignments[index].category));
      if(candidate===undefined)return;
      assignments[candidate].category=category;
      present.add(category);
    };
    choose('core',(slide,current)=>current!=='revision'&&(slide.kind==='content'||slide.kind==='worked'||slide.kind==='cover'));
    choose('practice',(slide,current)=>current!=='revision'&&(slide.kind==='student'||slide.kind==='inquiry'||slide.kind==='lab'));
    choose('extension',(slide,current)=>current==='core'&&(slide.kind==='content'||slide.kind==='worked'||slide.kind==='lab'));
    choose('revision',(slide,current)=>current==='practice'&&slide.kind==='student');
  });

  const manifestBlocks=blocks.map((block,blockIndex)=>({
    title:block.title,
    estimatedTeachingTime:block.time,
    beginSlideOriginalIndex:block.start+1,
    beginSlideTitle:data.slides[block.start]?.title||'',
    endSlideOriginalIndex:block.end+1,
    endSlideTitle:data.slides[block.end]?.title||'',
    classifications:{core:[],practice:[],extension:[],revision:[]}
  }));

  data.slides.forEach((slide,index)=>{
    const assignment=assignments[index];
    const block=blocks[assignment.blockIndex];
    const manifestBlock=manifestBlocks[assignment.blockIndex];
    const previous=index>block.start?assignments[index-1]:null;
    const beginsBlock=index===block.start;
    const beginsCategory=beginsBlock||!previous||previous.blockIndex!==assignment.blockIndex||previous.category!==assignment.category;

    const blockHeading=beginsBlock?`<h2>${block.title}</h2><h3>Estimated teaching time: ${block.time}</h3>`:'';
    const categoryHeading=beginsCategory?`<h2>${labels[assignment.category]}</h2>`:'';

    slide.ibPacing={
      teachingBlock:block.title,
      estimatedTeachingTime:block.time,
      classification:labels[assignment.category],
      originalSlideIndex:index+1
    };
    manifestBlock.classifications[assignment.category].push({index:index+1,title:slide.title});
    slide.html=blockHeading+categoryHeading+slide.html;
  });

  data.ibPacing={
    version:'1.0.0',
    course:'IB Mathematics: Applications and Interpretation SL',
    lesson:lessonNumber,
    categories:labels,
    blocks:manifestBlocks
  };
  data.__ibAiSlPacingMarkersApplied=true;
})();
