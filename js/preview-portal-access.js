/* Read-only access adapter for preview.html */
(function(){
  "use strict";
  const normaliseCourseKey=value=>String(value||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  window.ECHSPortalAccess={
    normaliseCourseKey,
    courseAllowed:()=>true,
    roleHome:()=>new URL("preview.html",location.href).href,
    ready:Promise.resolve({
      authenticated:true,
      role:"teacher",
      courseKeys:[],
      allCourses:true,
      error:"",
      current:{display_name:"Preview Teacher",username:"preview.teacher",role:"teacher"}
    })
  };
})();
