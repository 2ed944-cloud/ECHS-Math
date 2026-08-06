(function(){
'use strict';
const {d,P}=window.__ECHS_FN4_PRACTICE;
d.practice=P;
d.counts={...(d.counts||{}),practice:P.length};
d.audit={...(d.audit||{}),practiceCount:P.length,practiceLevels:Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,P.filter(q=>q.level===level).length]))};
delete window.__ECHS_FN4_PRACTICE;
})();
