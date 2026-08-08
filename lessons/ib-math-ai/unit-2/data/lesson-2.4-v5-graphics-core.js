(function(){
'use strict';
const app=document.getElementById('app');
if(!app||String(window.LESSON_DATA?.lesson?.number)!=='2.4')return;
const C={navy:'#17324d',maroon:'#7a1733',teal:'#177e89',gold:'#d4a72c',paper:'#fffdf9',grid:'#e6ded5',muted:'#5d6a75',green:'#1f7a4d',red:'#a83246',blue:'#2f72b8',purple:'#6c4aa1'};
const esc=v=>String(v).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const fmt=v=>Number.isInteger(v)?String(v):Number(v.toFixed(3)).toString();
function graph(o={}){
 const w=o.width||720,h=o.height||420,m={l:62,r:28,t:28,b:52};
 const xmin=o.xmin??-5,xmax=o.xmax??10,ymin=o.ymin??-5,ymax=o.ymax??15;
 const X=x=>m.l+(x-xmin)/(xmax-xmin)*(w-m.l-m.r),Y=y=>h-m.b-(y-ymin)/(ymax-ymin)*(h-m.t-m.b);
 const xstep=o.xstep||Math.max(1,Math.ceil((xmax-xmin)/10)),ystep=o.ystep||Math.max(1,Math.ceil((ymax-ymin)/8));
 let grid='';
 for(let x=Math.ceil(xmin/xstep)*xstep;x<=xmax+1e-9;x+=xstep)grid+=`<line x1="${X(x)}" y1="${m.t}" x2="${X(x)}" y2="${h-m.b}" stroke="${C.grid}"/>`;
 for(let y=Math.ceil(ymin/ystep)*ystep;y<=ymax+1e-9;y+=ystep)grid+=`<line x1="${m.l}" y1="${Y(y)}" x2="${w-m.r}" y2="${Y(y)}" stroke="${C.grid}"/>`;
 let axes='';
 if(xmin<=0&&xmax>=0)axes+=`<line x1="${X(0)}" y1="${m.t}" x2="${X(0)}" y2="${h-m.b}" stroke="${C.navy}" stroke-width="2.5"/>`;
 if(ymin<=0&&ymax>=0)axes+=`<line x1="${m.l}" y1="${Y(0)}" x2="${w-m.r}" y2="${Y(0)}" stroke="${C.navy}" stroke-width="2.5"/>`;
 let curves='';
 (o.curves||[]).forEach((c,i)=>{let d='',drawing=false;const steps=c.steps||360;for(let j=0;j<=steps;j++){const x=xmin+(xmax-xmin)*j/steps;let y;try{y=c.fn(x)}catch{y=NaN}const ok=Number.isFinite(y)&&y>=ymin-(ymax-ymin)*.35&&y<=ymax+(ymax-ymin)*.35;if(!ok){drawing=false;continue}d+=`${drawing?'L':'M'}${X(x).toFixed(2)} ${Y(y).toFixed(2)} `;drawing=true}curves+=`<path d="${d}" fill="none" stroke="${c.color||[C.maroon,C.teal,C.gold,C.blue][i%4]}" stroke-width="${c.width||6}" stroke-linecap="round" stroke-linejoin="round"${c.dash?` stroke-dasharray="${c.dash}"`:''}/>`});
 let extra='';
 (o.hlines||[]).forEach(l=>extra+=`<line x1="${m.l}" y1="${Y(l.y)}" x2="${w-m.r}" y2="${Y(l.y)}" stroke="${l.color||C.gold}" stroke-width="${l.width||3}" stroke-dasharray="${l.dash||'9 7'}"/>`);
 (o.vlines||[]).forEach(l=>extra+=`<line x1="${X(l.x)}" y1="${m.t}" x2="${X(l.x)}" y2="${h-m.b}" stroke="${l.color||C.gold}" stroke-width="${l.width||3}" stroke-dasharray="${l.dash||'9 7'}"/>`);
 (o.segments||[]).forEach(s=>extra+=`<line x1="${X(s.x1)}" y1="${Y(s.y1)}" x2="${X(s.x2)}" y2="${Y(s.y2)}" stroke="${s.color||C.gold}" stroke-width="${s.width||4}"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`);
 (o.points||[]).forEach(p=>{extra+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r||8}" fill="${p.color||C.gold}" stroke="#fff" stroke-width="4"/>`;if(p.label)extra+=`<text x="${X(p.x)+(p.dx||10)}" y="${Y(p.y)+(p.dy||-12)}" fill="${p.textColor||C.navy}" font-size="${p.size||14}" font-weight="850">${esc(p.label)}</text>`});
 (o.labels||[]).forEach(l=>extra+=`<text x="${X(l.x)}" y="${Y(l.y)}" fill="${l.color||C.navy}" font-size="${l.size||15}" font-weight="${l.weight||850}" text-anchor="${l.anchor||'start'}">${esc(l.text)}</text>`);
 let ticks='';
 (o.xticks||[]).forEach(x=>ticks+=`<text x="${X(x)}" y="${h-20}" text-anchor="middle" fill="${C.muted}" font-size="12">${fmt(x)}</text>`);
 (o.yticks||[]).forEach(y=>ticks+=`<text x="${m.l-10}" y="${Y(y)+4}" text-anchor="end" fill="${C.muted}" font-size="12">${fmt(y)}</text>`);
 return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label||'Mathematical graph')}"><rect x="1" y="1" width="${w-2}" height="${h-2}" rx="25" fill="${o.bg||'#fff'}" stroke="#d8d0c7"/>${grid}${axes}${curves}${extra}${ticks}${o.caption?`<text x="${w/2}" y="${h-10}" text-anchor="middle" fill="${C.muted}" font-size="13" font-weight="800">${esc(o.caption)}</text>`:''}</svg>`;
}
function panel(title,body,sub=''){return `<div style="padding:22px;border:1px solid ${C.grid};border-radius:23px;background:#fff;box-shadow:0 12px 30px rgba(23,50,77,.06)"><b style="display:block;color:${C.maroon};font-size:13px;letter-spacing:.09em">${esc(title)}</b>${body}${sub?`<p style="color:${C.muted};line-height:1.45">${sub}</p>`:''}</div>`}
function boxes(items,title=''){
 const w=720,h=390,cx=w/2,cy=h/2;
 let body=title?`<text x="${cx}" y="35" text-anchor="middle" fill="${C.navy}" font-size="20" font-weight="900">${esc(title)}</text>`:'';
 const n=items.length,boxW=Math.min(190,(w-60-(n-1)*18)/n),start=(w-(n*boxW+(n-1)*18))/2;
 items.forEach((it,i)=>{const x=start+i*(boxW+18),y=135;body+=`<rect x="${x}" y="${y}" width="${boxW}" height="120" rx="20" fill="${it.fill||'#f6f1ea'}" stroke="${it.color||C.grid}" stroke-width="2"/><text x="${x+boxW/2}" y="${y+37}" text-anchor="middle" fill="${it.color||C.maroon}" font-size="15" font-weight="900">${esc(it.head)}</text><text x="${x+boxW/2}" y="${y+72}" text-anchor="middle" fill="${C.navy}" font-size="20" font-weight="900">${esc(it.main)}</text><text x="${x+boxW/2}" y="${y+99}" text-anchor="middle" fill="${C.muted}" font-size="12">${esc(it.sub||'')}</text>`;if(i<n-1)body+=`<path d="M${x+boxW+4} ${y+60} H${x+boxW+14}" stroke="${C.gold}" stroke-width="5" stroke-linecap="round"/><path d="M${x+boxW+10} ${y+52} l10 8 -10 8" fill="none" stroke="${C.gold}" stroke-width="4"/>`});
 return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title||'Mathematical process diagram')}"><rect x="1" y="1" width="${w-2}" height="${h-2}" rx="25" fill="#fff" stroke="#d8d0c7"/>${body}</svg>`;
}
function tablePreview(rows,caption){
 return `<div style="padding:20px;border:1px solid ${C.grid};border-radius:22px;background:#fff"><table class="el5-table" style="min-width:0"><thead><tr><th>n</th><th>Y₁</th><th>target</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table><p style="margin:12px 0 0;color:${C.muted};font-weight:800">${esc(caption)}</p></div>`;
}
const renderers={};
window.__ECHS_EL5_GRAPHICS_CORE={app,C,esc,fmt,graph,panel,boxes,tablePreview,renderers};
})();
