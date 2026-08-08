(function(){
'use strict';
const core=window.__ECHS_EL5_GRAPHICS_CORE;if(!core)return;
const {app,esc,renderers}=core;
window.__ECHS_EL5_VISUAL_IDS=Object.freeze(Object.keys(renderers));
function renderAll(){document.querySelectorAll('[data-el5-visual]').forEach(node=>{if(node.dataset.el5Rendered==='1')return;const id=node.dataset.el5Visual,fn=renderers[id];node.innerHTML=fn?fn():`<div class="el5-visual-placeholder"><b>Visual unavailable</b><span>${esc(id)}</span></div>`;node.dataset.el5Rendered='1';});}
new MutationObserver(renderAll).observe(app,{childList:true,subtree:true});renderAll();
})();
