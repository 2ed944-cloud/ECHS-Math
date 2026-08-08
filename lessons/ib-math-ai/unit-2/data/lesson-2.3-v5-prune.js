(function(){
'use strict';
const slides=window.P23V5?.state?.slides;if(!Array.isArray(slides))return;
const remove=new Set(['Domain exclusions come first']);
for(let i=slides.length-1;i>=0;i--)if(remove.has(slides[i]?.title))slides.splice(i,1);
})();
