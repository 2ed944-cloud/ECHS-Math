/* Bridge classic-script lexical globals to window for optional practice adapters. */
(function(){
  "use strict";
  if(typeof ECHSBank!=="undefined")window.ECHSBank=ECHSBank;
  if(typeof ECHSLearning!=="undefined")window.ECHSLearning=ECHSLearning;
  document.documentElement.dataset.practiceGlobalBridge=
    window.ECHSBank&&window.ECHSLearning?"ready":"incomplete";
})();
