/* Prevent the one-time setup wizard from rendering inside another site. */
(function(){
  "use strict";
  if(window.top===window.self)return;
  document.documentElement.style.display="none";
  try{window.top.location=window.self.location.href}catch(_error){}
  window.stop();
})();
