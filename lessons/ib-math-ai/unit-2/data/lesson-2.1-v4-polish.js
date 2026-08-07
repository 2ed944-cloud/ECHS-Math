(function(){
  'use strict';
  const d=window.LESSON_DATA;
  if(!d||String(d.lesson?.number)!=='2.1')return;
  const byId=id=>d.practice.find(question=>question.id===id);

  const zeroCommand=byId('IBAI-2.1-V4-P039');
  if(zeroCommand)zeroCommand.marks=2;

  const absoluteRange=byId('IBAI-2.1-V4-P063');
  if(absoluteRange){
    absoluteRange.answer='\\([2,7)\\)';
    absoluteRange.solution='The minimum 2 occurs at \\(x=3\\). As \\(x\\to8^-\\), the output approaches 7 but does not attain it, so the range is \\([2,7)\\).';
    absoluteRange.check={mode:'text',accepted:['[2,7)','2<=y<7','2 ≤ y < 7']};
  }

  d.audit={...(d.audit||{}),mathematicalPolish:true,correctedAbsoluteValueRange:true,integerMarkRecords:true};
})();
