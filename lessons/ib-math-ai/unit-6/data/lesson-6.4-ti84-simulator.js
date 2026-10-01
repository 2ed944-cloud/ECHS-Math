/* Embedded TI-84 Plus CE simulator drawer · Lesson 6.4 */
(()=>{
  const provider="https://ti84calc.com/ti84calc";
  const style=document.createElement("style");
  style.textContent=`
  .u64-ti84-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(8,20,31,.68);backdrop-filter:blur(6px);display:none;align-items:stretch;justify-content:flex-end}
  .u64-ti84-backdrop.open{display:flex}
  .u64-ti84-drawer{width:min(780px,100%);height:100%;background:#f8f4ee;box-shadow:-20px 0 60px rgba(0,0,0,.28);display:grid;grid-template-rows:auto auto 1fr;animation:u64TiIn .22s ease-out}
  @keyframes u64TiIn{from{transform:translateX(35px);opacity:.6}to{transform:translateX(0);opacity:1}}
  .u64-ti84-head{display:flex;gap:1rem;justify-content:space-between;align-items:center;padding:1rem 1.1rem;background:#17324d;color:#fff}
  .u64-ti84-head h2{margin:0;font-size:1.12rem}.u64-ti84-head p{margin:.2rem 0 0;color:#cfe4e8;font-size:.85rem}
  .u64-ti84-close{border:1px solid rgba(255,255,255,.45);border-radius:12px;background:transparent;color:#fff;padding:.65rem .85rem;font-weight:900;cursor:pointer}
  .u64-ti84-guide{display:flex;flex-wrap:wrap;gap:.45rem;padding:.75rem 1rem;background:#fff;border-bottom:1px solid #ded5ca}
  .u64-ti84-guide span{padding:.38rem .58rem;border-radius:999px;background:#f4efe8;color:#17324d;font-size:.76rem;font-weight:850}
  .u64-ti84-frame-wrap{position:relative;min-height:0;background:#e8edf0}
  .u64-ti84-frame{width:100%;height:100%;border:0;background:#fff}
  .u64-ti84-loading{position:absolute;inset:0;display:grid;place-items:center;padding:2rem;text-align:center;color:#17324d;background:linear-gradient(145deg,#f8f4ee,#edf8f7)}
  .u64-ti84-loading b{display:block;font-size:1.1rem;margin-bottom:.45rem}.u64-ti84-loading a{color:#7a1733;font-weight:900}
  body.u64-ti84-locked{overflow:hidden}
  @media(max-width:720px){.u64-ti84-drawer{width:100%}.u64-ti84-guide{display:none}}
  `;
  document.head.appendChild(style);

  const backdrop=document.createElement("div");
  backdrop.className="u64-ti84-backdrop";
  backdrop.setAttribute("role","presentation");
  backdrop.innerHTML=`<section class="u64-ti84-drawer" role="dialog" aria-modal="true" aria-labelledby="u64-ti84-title">
    <header class="u64-ti84-head"><div><h2 id="u64-ti84-title">TI‑84 Plus CE Simulator · Lesson 6.4</h2><p>Graphing, regression, distributions, numerical derivatives, and integrals</p></div><button type="button" class="u64-ti84-close" aria-label="Close calculator simulator">Close</button></header>
    <div class="u64-ti84-guide"><span>MODE audit</span><span>Y= / WINDOW</span><span>CALC</span><span>STAT / LinReg</span><span>binomcdf</span><span>normalcdf / invNorm</span><span>nDeriv / fnInt</span><span>round last</span></div>
    <div class="u64-ti84-frame-wrap"><div class="u64-ti84-loading"><div><b>Calculator loads only when opened.</b><span>The simulator is an external static provider; the mathematical setup and verification remain part of the lesson.</span><br><a href="${provider}" target="_blank" rel="noopener noreferrer">Open provider in a new tab</a></div></div></div>
  </section>`;
  document.body.appendChild(backdrop);

  const drawer=backdrop.querySelector(".u64-ti84-drawer");
  const closeButton=backdrop.querySelector(".u64-ti84-close");
  const wrap=backdrop.querySelector(".u64-ti84-frame-wrap");
  let frame=null;
  let previousFocus=null;

  const loadFrame=()=>{
    if(frame)return;
    frame=document.createElement("iframe");
    frame.className="u64-ti84-frame";
    frame.title="TI-84 Plus CE calculator simulator";
    frame.loading="lazy";
    frame.referrerPolicy="no-referrer";
    frame.allow="clipboard-read; clipboard-write";
    frame.src=provider;
    frame.addEventListener("load",()=>backdrop.querySelector(".u64-ti84-loading")?.remove(),{once:true});
    wrap.appendChild(frame);
  };

  const open=()=>{
    previousFocus=document.activeElement;
    backdrop.classList.add("open");
    document.body.classList.add("u64-ti84-locked");
    loadFrame();
    closeButton.focus({preventScroll:true});
  };
  const close=()=>{
    backdrop.classList.remove("open");
    document.body.classList.remove("u64-ti84-locked");
    if(previousFocus&&typeof previousFocus.focus==="function")previousFocus.focus({preventScroll:true});
  };

  document.addEventListener("click",event=>{
    const launch=event.target.closest("[data-open-ti84]");
    if(launch){event.preventDefault();open();}
  });
  closeButton.addEventListener("click",close);
  backdrop.addEventListener("mousedown",event=>{if(event.target===backdrop)close();});
  document.addEventListener("keydown",event=>{
    if(!backdrop.classList.contains("open"))return;
    if(event.key==="Escape"){event.preventDefault();close();return;}
    if(event.key!=="Tab")return;
    const focusable=[...drawer.querySelectorAll('button,a[href],iframe,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });

  window.LESSON_DATA.ti84Simulator={release:"6.4.0",provider,model:"TI-84 Plus CE",lessons:["6.4"],lazyLoaded:true,workflows:["graph intersections","linear regression and residuals","binomial and normal distributions","numerical derivative and definite integral"]};
})();
