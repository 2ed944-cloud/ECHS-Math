import {assertDraftDocument} from './draft-model.mjs';

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

const disposedSnapshot = () => freeze({status:'disposed',slideIndex:-1,slideId:null,title:'',slideTitle:'',
  totalSlides:0,totalBlocks:0,revealedCount:0,canNext:false,canPrevious:false,canReveal:false,slides:[],resetToken:0});

/** Ephemeral staff presentation state only. No account, note, API or progress data. */
export function createPresentationSession({document:lesson,mathEngine,isCurrent=()=>true,onChange=()=>{}}={}) {
  if (typeof isCurrent !== 'function' || typeof onChange !== 'function') throw new TypeError('Presentation callbacks must be functions.');
  if (!mathEngine || mathEngine.version !== '0.16.27' || typeof mathEngine.renderToString !== 'function') throw new TypeError('Pinned KaTeX0.16.27 is required for presentation.');
  // The canonical validator inspects descriptors, plain JSON, depth and nodes
  // before reading fields. Draft validation adds the1MiB UTF-8 persistence cap.
  assertDraftDocument(lesson,{mathEngine});
  let data=freeze(JSON.parse(JSON.stringify(lesson)));
  lesson=null;mathEngine=null;
  let counts=new Array(data.slides.length).fill(0),index=0,resetToken=0,disposed=false;
  function dispose() {
    if (disposed) return;
    disposed=true;data=null;counts=null;index=-1;resetToken=0;
    isCurrent=()=>false;onChange=()=>{};
  }
  function current() {
    if (disposed) return false;
    try { if (isCurrent()===true) return true; } catch {}
    dispose();return false;
  }
  function view() {
    if (disposed) return disposedSnapshot();
    const slide=data.slides[index];
    return freeze({status:'ready',slideIndex:index,slideId:slide.id,title:data.title,slideTitle:slide.title,
      totalSlides:data.slides.length,totalBlocks:slide.blocks.length,revealedCount:counts[index],
      canNext:index<data.slides.length-1,canPrevious:index>0,canReveal:counts[index]<slide.blocks.length,
      slides:data.slides.map(({id,title})=>({id,title})),resetToken});
  }
  function snapshot() {current();return view();}
  function document() {return current()?data:null;}
  function notify() {
    if (!current()) return view();
    try {onChange(view());} catch {}
    return snapshot();
  }
  function jump(value) {
    if (!current()) return view();
    if (!Number.isInteger(value) || value<0 || value>=data.slides.length) throw new RangeError('Choose a slide index within this presentation.');
    if (value===index) return view();
    index=value;return notify();
  }
  function next() {return current()?jump(Math.min(index+1,data.slides.length-1)):view();}
  function previous() {return current()?jump(Math.max(index-1,0)):view();}
  function reveal() {
    if (!current() || counts[index]>=data.slides[index].blocks.length) return view();
    counts[index]++;return notify();
  }
  function reset() {
    if (!current()) return view();
    counts[index]=0;resetToken++;return notify();
  }
  current();
  return Object.freeze({snapshot,document,next,previous,jump,reveal,reset,dispose});
}
