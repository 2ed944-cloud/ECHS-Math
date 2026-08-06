(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.6'||!Array.isArray(data.slides))return;
const slide=data.slides.find(item=>item&&item.title==='Multiplicity changes how a graph meets the axis');
if(!slide)return;
slide.html=String(slide.html).replace('M48 40 Q181 100 314 40','M48 40 Q181 160 314 40');
data.visualAccuracyRelease='6.3.3';
data.visualAccuracyAudit=Object.assign({},data.visualAccuracyAudit,{
  multiplicity2:'quadratic Bézier vertex lies exactly on the x-axis at the marked double root'
});
})();