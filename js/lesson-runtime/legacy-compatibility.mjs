import {assertLessonDocument, validateLessonDocument} from './schema.mjs';
import {PINNED_LEGACY_CONTRACTS} from './pinned-legacy-contracts.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
function ordered(value) {
  if(Array.isArray(value))return value.map(ordered);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,ordered(value[key])]));
  return value;
}
const equal = (a,b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const contractFor = kind => {
  const contract=kind==='ap11'?PINNED_LEGACY_CONTRACTS.ap:kind==='ib13'?PINNED_LEGACY_CONTRACTS.ib:null;
  if(!contract)throw new TypeError('Unsupported legacy lesson contract.');
  return contract;
};
function keys(value, allowed) {
  if(!value || typeof value!=='object'||Array.isArray(value))throw new TypeError('Expected inert metadata object.');
  if(Object.keys(value).some(key=>!allowed.includes(key)))throw new TypeError('Unexpected legacy metadata field.');
}

/** Snapshot input is serialized inert metadata, never a script or a complete question-bearing LESSON_DATA object. */
export function readLegacySnapshot(json, kind) {
  if(typeof json!=='string'||json.length>256000)throw new TypeError('Expected a bounded metadata JSON string.');
  const snapshot=JSON.parse(json);
  const pinned=contractFor(kind);
  const common=['snapshot_version','kind','source_commit','source','sha256','aliases','counts','slides','finish'];
  keys(snapshot,[...common,...(kind==='ap11'?['assets']:['layers','stages','preservation'])]);
  if(snapshot.snapshot_version!=='echs.legacy.metadata.v1'||snapshot.kind!==kind)throw new TypeError('Unsupported legacy metadata version.');
  for(const field of ['source_commit','source','sha256','aliases','counts']) {
    if(!equal(snapshot[field],pinned[field]))throw new TypeError(`Legacy ${field} differs from the pinned source contract.`);
  }
  if(!Array.isArray(snapshot.slides)||snapshot.slides.length!==pinned.slides.length)throw new TypeError('A complete pinned slide composition is required.');
  snapshot.slides.forEach((slide,index)=>{
    keys(slide,['id','source_index','title','layout','anchor',...(kind==='ib13'?['kind','html_sha256','pacing']:[])]);
    for(const field of ['id','source_index','anchor'])if(slide[field]!==pinned.slides[index][field])throw new TypeError('Legacy slide identity or ordering changed.');
    if(kind==='ib13'&&slide.pacing!==null)keys(slide.pacing,['teaching_block','classification','source_index']);
  });
  keys(snapshot.finish,kind==='ap11'?['trigger','delegate','guard']:['delegate','guard']);
  if(snapshot.finish.delegate!=='[data-finish-lesson]'||snapshot.finish.guard!=='js/lesson-access-guard.js')throw new TypeError('Finish must remain delegated to the existing guard.');
  if(kind==='ap11') {
    if(snapshot.finish.trigger!=='#continuePractice'||!Array.isArray(snapshot.assets))throw new TypeError('Pinned AP runtime metadata is required.');
    snapshot.assets.forEach(asset=>keys(asset,['kind','url']));
  } else {
    for(const field of ['layers','stages'])if(!equal(snapshot[field],pinned[field]))throw new TypeError('The final ordered IB source composition is required.');
  }
  if(!equal(snapshot,pinned))throw new TypeError('Metadata differs from the exact reviewed source snapshot.');
  return snapshot;
}

/** Parse for identification only. The complete original URL is always the rollback URL. */
export function preserveLegacyRoute({originalUrl,repositoryBase,kind,enabled=false}) {
  const pinned=contractFor(kind);
  if(typeof originalUrl!=='string'||typeof repositoryBase!=='string')throw new TypeError('Explicit original URL and repository base are required.');
  const current=new URL(originalUrl);
  const base=new URL(repositoryBase);
  if(base.protocol!=='https:'&&base.protocol!=='http:')throw new TypeError('A web repository base is required.');
  if(base.search||base.hash||base.username||base.password||!base.pathname.endsWith('/'))throw new TypeError('Repository base must end in a slash without credentials, a query or fragment.');
  if(current.origin!==base.origin||current.username||current.password)throw new TypeError('Legacy route must belong to the repository origin.');
  const canonical=new URL(pinned.source,base);
  const allowed=[canonical,...pinned.aliases.map(path=>new URL(path,base))];
  if(!allowed.some(url=>url.pathname===current.pathname))throw new TypeError('Legacy route is not a pinned canonical lesson or alias.');
  const raw=originalUrl.includes('#')?originalUrl.slice(originalUrl.indexOf('#')):'';
  let fragment={kind:raw?'opaque':'none',raw};
  if(kind==='ap11') {
    const match=/^#slide=([1-9]\d*)$/.exec(raw);
    const index=match?Number(match[1]):0;
    if(index>=1&&index<=pinned.slides.length)fragment={kind:'slide',raw,index,slideId:pinned.slides[index-1].id};
    else if(raw.startsWith('#')) {
      let name;
      try{name=decodeURIComponent(raw.slice(1));}catch{name=null;}
      const slide=pinned.slides.find(item=>item.id===name);
      if(slide)fragment={kind:'anchor',raw,index:slide.source_index,slideId:slide.id};
    }
  }else if(/^#(?:learn|practice|exam|quiz|review)$/.test(raw))fragment={kind:'route',raw,route:raw.slice(1)};
  const previewable=fragment.kind!=='opaque'&&(kind!=='ib13'||fragment.kind==='none'||fragment.route==='learn');
  return {mode:enabled===true&&previewable?'adapter-preview':'legacy',originalUrl,rollbackUrl:originalUrl,
    canonicalUrl:canonical.href,canonicalSource:pinned.source,query:[...current.searchParams.entries()],fragment};
}

function legacyBlock(id,reference,summary) {
  return {id,type:'legacy-embedded',version:1,content:{source:reference.source,anchor:reference.anchor,sha256:reference.sha256,summary}};
}

function envelope(identity,slides) {
  // Identities and curriculum mappings are supplied by the caller. Imported content always starts in draft.
  const document={...identity,schema_version:'echs.lesson.v1',publication:{status:'draft',audience:'institutional',revision:1},slides};
  return clone(assertLessonDocument(document));
}

function adapt(json,identity,routeOptions,kind) {
  const snapshot=readLegacySnapshot(json,kind);
  const document=envelope(identity,snapshot.slides.map(slide=>({
    id:slide.id,title:slide.title,layout:slide.layout,
    blocks:[legacyBlock(`${slide.id}-legacy`,{source:snapshot.source,anchor:slide.anchor,sha256:snapshot.sha256},'This slide, its interactions and any assessment material remain in the existing lesson.')]
  })));
  const route=preserveLegacyRoute({...routeOptions,kind});
  return {
    document,route,
    compatibility:{kind,source:snapshot.source,sha256:snapshot.sha256,sourceCommit:snapshot.source_commit,
      counts:clone(snapshot.counts),slides:snapshot.slides.map(slide=>({id:slide.id,sourceIndex:slide.source_index,sourceAnchor:slide.anchor,...(kind==='ib13'?{legacyHtmlSha256:slide.html_sha256,legacyKind:slide.kind,pacing:clone(slide.pacing)}:{})})),
      ...(kind==='ap11'?{assets:clone(snapshot.assets)}:{layers:clone(snapshot.layers),stages:clone(snapshot.stages)}),
      finish:{...snapshot.finish,behavior:'delegate-only',stateWrites:false,masteryWrites:false},
      unsupportedContent:'retained-in-original-source',automaticPublication:false}
  };
}

export function describeAP11(metadataJson,identity,routeOptions) { return adapt(metadataJson,identity,routeOptions,'ap11'); }
export function adaptIB13Snapshot(metadataJson,identity,routeOptions) { return adapt(metadataJson,identity,routeOptions,'ib13'); }

/** Conservative conversion with an injected inert parse5-compatible parser; no browser DOM parser or HTML execution. */
export function convertSupportedText(html,{id,reference,identity,parseFragment,mathEngine}={}) {
  const fallback=reason=>({status:'legacy-reference',reason,blocks:[legacyBlock(id,reference,'Unsupported legacy content remains in its original lesson.')]});
  const validateBlocks=blocks=>validateLessonDocument({...identity,schema_version:'echs.lesson.v1',publication:{status:'draft',audience:'institutional',revision:1},slides:[{id:'conversion-preview',title:'Supported text conversion',layout:'single',blocks}]},{mathEngine});
  const referenceCheck=validateBlocks(fallback('unsupported').blocks);
  if(!referenceCheck.valid)throw new TypeError('Conversion requires valid caller identity and canonical legacy reference metadata.');
  if(typeof html!=='string'||html.length>32000||typeof parseFragment!=='function')return fallback('inert-parser-or-bounded-html-required');
  let count=0;
  const fail=()=>{throw new Error('Unsupported structure.');};
  const nodeAttrs=node=>Object.fromEntries((node.attrs||[]).map(attr=>[attr.name,attr.value]));
  function inlines(nodes,marks=[]) {
    const output=[];
    for(const node of nodes) {
      if(++count>1000)fail();
      if(node.nodeName==='#text') {
        if(node.value==='')continue;
        if(!node.value.trim()) {
          if(output.at(-1)?.type==='text')output.at(-1).text+=node.value;
          else if(output.length)fail();
          else continue;
        }else output.push({type:'text',text:node.value,...(marks.length?{marks:[...new Set(marks)]}:{})});
      }else if(['strong','b','em','i'].includes(node.tagName)) {
        if((node.attrs||[]).length)fail();
        output.push(...inlines(node.childNodes||[],[...marks,['strong','b'].includes(node.tagName)?'strong':'em']));
      }else if(node.tagName==='span') {
        const attrs=nodeAttrs(node);
        if(Object.keys(attrs).sort().join(',')!=='aria-label,class,data-tex'||attrs.class!=='math'||marks.length)fail();
        if((node.childNodes||[]).some(child=>child.nodeName!=='#text'))fail();
        output.push({type:'math',tex:attrs['data-tex'],spoken:attrs['aria-label']});
      }else fail();
    }
    return output;
  }
  try {
    let parsingError=false;
    const fragment=parseFragment(html,{onParseError(){parsingError=true;}});
    if(parsingError||fragment.nodeName!=='#document-fragment')return fallback('unsupported-or-malformed-html');
    const nodes=(fragment.childNodes||[]).filter(node=>!(node.nodeName==='#text'&&!node.value.trim()));
    const blocks=[];
    let paragraphs=[];
    const flush=()=>{if(paragraphs.length){blocks.push({id:blocks.length?`${id}-${blocks.length+1}`:id,type:'rich-text',version:1,content:{paragraphs}});paragraphs=[];}};
    for(const node of nodes) {
      if(++count>1000)fail();
      if(node.tagName==='p'&&!(node.attrs||[]).length)paragraphs.push({type:'paragraph',children:inlines(node.childNodes||[])});
      else if(node.tagName==='div') {
        const attrs=nodeAttrs(node);
        if(Object.keys(attrs).sort().join(',')!=='aria-label,class,data-tex'||attrs.class!=='math')fail();
        if((node.childNodes||[]).some(child=>child.nodeName!=='#text'))fail();
        flush();blocks.push({id:blocks.length?`${id}-${blocks.length+1}`:id,type:'math',version:1,content:{tex:attrs['data-tex'],spoken:attrs['aria-label'],display:true}});
      }else if(node.tagName==='aside') {
        const attrs=nodeAttrs(node);
        if(Object.keys(attrs).sort().join(',')!=='class,data-kind,data-title'||attrs.class!=='callout')fail();
        const body=(node.childNodes||[]).filter(child=>!(child.nodeName==='#text'&&!child.value.trim()));
        if(body.some(child=>child.tagName!=='p'||(child.attrs||[]).length))fail();
        flush();blocks.push({id:blocks.length?`${id}-${blocks.length+1}`:id,type:'callout',version:1,content:{kind:attrs['data-kind'],title:attrs['data-title'],body:{paragraphs:body.map(child=>({type:'paragraph',children:inlines(child.childNodes||[])}))}}});
      }else fail();
    }
    flush();
    if(!blocks.length||!validateBlocks(blocks).valid)return fallback('unsupported-or-invalid-controlled-content');
    if(blocks.some(block=>block.type==='math'||(block.content.paragraphs||block.content.body?.paragraphs)?.some(paragraph=>paragraph.children.some(node=>node.type==='math')))&&!mathEngine)return fallback('local-math-validation-required');
    return {status:'supported',blocks};
  }catch{return fallback('unsupported-or-malformed-html');}
}
