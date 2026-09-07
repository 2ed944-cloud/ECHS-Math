/* Shared presentation for original Unit 1 continuation lessons. No account or network access. */
(function(root){'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function plot(v){
  const {xMin=-4,xMax=4,yMin=-4,yMax=6}=v,W=680,H=360,p=42,X=x=>p+(x-xMin)/(xMax-xMin)*(W-2*p),Y=y=>H-p-(y-yMin)/(yMax-yMin)*(H-2*p);
  let s=`<svg class="unit1-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(v.caption)}"><title>${esc(v.caption)}</title>`;
  for(let x=Math.ceil(xMin);x<=xMax;x+=Math.max(1,Math.ceil((xMax-xMin)/10)))s+=`<line x1="${X(x)}" y1="${p}" x2="${X(x)}" y2="${H-p}" stroke="#e3e9ef"/><text x="${X(x)}" y="${H-15}" text-anchor="middle">${x}</text>`;
  for(let y=Math.ceil(yMin);y<=yMax;y+=Math.max(1,Math.ceil((yMax-yMin)/8)))s+=`<line x1="${p}" y1="${Y(y)}" x2="${W-p}" y2="${Y(y)}" stroke="#e3e9ef"/><text x="${p-10}" y="${Y(y)+5}" text-anchor="end">${y}</text>`;
  if(yMin<=0&&yMax>=0)s+=`<line x1="${p}" y1="${Y(0)}" x2="${W-p}" y2="${Y(0)}" stroke="#526777"/>`;
  if(xMin<=0&&xMax>=0)s+=`<line x1="${X(0)}" y1="${p}" x2="${X(0)}" y2="${H-p}" stroke="#526777"/>`;
  for(const [i,pts] of (v.paths||[]).entries()){let pen=false,d='';for(const [x,y] of pts){if(!Number.isFinite(x)||!Number.isFinite(y)||y<yMin||y>yMax||x<xMin||x>xMax){pen=false;continue;}d+=(pen?' L':' M')+X(x).toFixed(2)+','+Y(y).toFixed(2);pen=true;}s+=`<path d="${d}" fill="none" stroke="${v.colors?.[i]||['#861e42','#006e65','#b0780b'][i%3]}" stroke-width="3" stroke-dasharray="${v.dashes?.[i]||''}"/>`;}
  for(const key of ['open','closed'])for(const [x,y] of v[key]||[])s+=`<circle cx="${X(x)}" cy="${Y(y)}" r="5.5" stroke="#162d48" stroke-width="2" fill="${key==='open'?'white':'#162d48'}"/>`;
  return s+`<text x="${W-22}" y="${H-15}">x</text><text x="20" y="22">y</text></svg><p class="graph-caption">${esc(v.caption)}</p>`;
 }
 function graphEvidence(v){const pts=[...(v.open||[]).map(p=>['Open',...p]),...(v.closed||[]).map(p=>['Filled',...p])];return plot(v)+(pts.length?`<details class="graph-data"><summary>Graph point coordinates</summary><table><caption>Marked points; branches are described above.</caption><thead><tr><th scope="col">Marker</th><th scope="col">x</th><th scope="col">y</th></tr></thead><tbody>${pts.map(p=>'<tr>'+p.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')}</tbody></table></details>`:'');}
 const d=root.Unit1Lesson;
 if(d){d.revision='20260907-ab1';for(const q of d.questions){if(q.visual)q.prompt+=graphEvidence(q.visual);}root.LimitLessonQuestions=d;}
 root.Unit1UI={plot,graphEvidence,esc};
 if(typeof module!=='undefined'&&module.exports)module.exports={plot,graphEvidence};
})(typeof window!=='undefined'?window:globalThis);
