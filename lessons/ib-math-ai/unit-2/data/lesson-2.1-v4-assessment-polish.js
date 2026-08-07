(function(){
  'use strict';
  const d=window.LESSON_DATA;
  if(!d||String(d.lesson?.number)!=='2.1'||!Array.isArray(d.quiz))return;
  const item=d.quiz.find(question=>question.id==='IBAI-2.1-V4-Q01');
  if(item){
    item.prompt='A relation contains the ordered pairs \\((-3,6),(0,6),(4,11)\\). Which statement best justifies that it is a function?';
    item.choices=[
      'Every output is different.',
      'Each input is paired with exactly one output.',
      'The output 6 occurs twice.',
      'All coordinates are integers.'
    ];
    item.correct=1;
    item.answer=item.choices[1];
    item.solution='Each input appears once and is paired with exactly one output. Different inputs may share the output 6.';
    item.check={mode:'choice',value:1};
  }
  d.audit=Object.assign({},d.audit,{quizPracticePromptIndependence:true});
})();
