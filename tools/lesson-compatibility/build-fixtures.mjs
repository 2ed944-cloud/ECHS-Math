import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname, relative, sep} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createContext, Script} from 'node:vm';
import {parse} from 'parse5';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(resolve(here,'fixtures/source-manifest.json'),'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const children = node => node.childNodes || [];
const attrs = node => Object.fromEntries((node.attrs || []).map(attr=>[attr.name,attr.value]));
function all(node, predicate) { const found=[]; if(predicate(node))found.push(node); for(const child of children(node)) found.push(...all(child,predicate)); return found; }
function classes(node) { return (attrs(node).class || '').split(/\s+/); }
function layout(node) {
  const grids = all(node,item=>classes(item).includes('grid'));
  if(grids.some(item=>classes(item).includes('three')))return 'three-panel';
  return grids.length ? 'two-column' : 'single';
}
const counts = data => ({slides:data.slides.length,practice:data.practice.length,exam:data.exam.length,quiz:data.quiz.length});
const equal = (a,b) => JSON.stringify(a)===JSON.stringify(b);

/** Development only. Exact allowlisted repository bytes are checked before any trusted source is composed. */
export async function buildCompatibilityFixtures(sourceRoot) {
  const root = resolve(sourceRoot);
  const sources = new Map();
  for(const entry of manifest.files) {
    const path = resolve(root,entry.path);
    const rel = relative(root,path);
    if(rel==='..'||rel.startsWith('..'+sep)||resolve(path)!==path)throw new Error('Fixture source escaped its repository root.');
    const bytes=await readFile(path);
    if(hash(bytes)!==entry.sha256)throw new Error(`Pinned fixture source changed: ${entry.path}`);
    sources.set(entry.path,bytes.toString('utf8'));
  }
  const sourceHash=path=>manifest.files.find(item=>item.path===path).sha256;
  const apHtml=parse(sources.get(manifest.ap_source));
  const apSlides=all(apHtml,node=>node.tagName==='section'&&classes(node).includes('slide'));
  if(apSlides.length!==33)throw new Error('Pinned AP slide count changed.');
  const ap={
    snapshot_version:'echs.legacy.metadata.v1',kind:'ap11',source_commit:manifest.source_commit,
    source:manifest.ap_source,sha256:sourceHash(manifest.ap_source),aliases:manifest.ap_aliases,
    assets:all(apHtml,node=>(node.tagName==='script'&&attrs(node).src)||(node.tagName==='link'&&attrs(node).rel==='stylesheet')).map(node=>({kind:node.tagName==='script'?'script':'stylesheet',url:attrs(node).src||attrs(node).href})),
    counts:{slides:apSlides.length,questions:new Set(all(apHtml,node=>attrs(node)['data-question']).map(node=>attrs(node)['data-question'])).size,frqs:new Set(all(apHtml,node=>attrs(node)['data-frq']).map(node=>attrs(node)['data-frq'])).size},
    slides:apSlides.map((node,index)=>({id:attrs(node).id,source_index:index+1,title:attrs(node)['data-title'],layout:layout(node),anchor:attrs(node).id})),
    finish:{trigger:'#continuePractice',delegate:'[data-finish-lesson]',guard:'js/lesson-access-guard.js'}
  };
  if(ap.counts.questions!==20||ap.counts.frqs!==3)throw new Error('Pinned AP assessment counts changed.');

  const ibHtml=parse(sources.get(manifest.ib_source));
  const declared=all(ibHtml,node=>node.tagName==='script'&&attrs(node).src).map(node=>attrs(node).src.split('?')[0]).filter(src=>manifest.ib_layers.some(path=>path.endsWith(src.replace('../data/','/'))));
  const ordered=manifest.ib_layers.map(path=>'../data/'+path.split('/').at(-1));
  if(!equal(declared,ordered))throw new Error('Pinned IB HTML composition order changed.');
  const context=createContext({window:{}},{codeGeneration:{strings:false,wasm:false}});
  const stages=[];
  for(const path of manifest.ib_layers) {
    // This is not a sandbox for untrusted code: only the exact hash-pinned repository layers above are allowed.
    new Script(sources.get(path),{filename:path}).runInContext(context,{timeout:2000});
    if(path.endsWith('/lesson-1.3.js'))stages.push({stage:'base',...counts(context.window.LESSON_DATA)});
    if(path.endsWith('/unit-1-v5-apply.js'))stages.push({stage:'v5',...counts(context.window.LESSON_DATA)});
  }
  const data=context.window.LESSON_DATA;
  stages.push({stage:'final',...counts(data)});
  if(!equal(stages,manifest.expected_stages))throw new Error('IB composition must match base, v5 and final counts.');
  const ib={
    snapshot_version:'echs.legacy.metadata.v1',kind:'ib13',source_commit:manifest.source_commit,
    source:manifest.ib_source,sha256:sourceHash(manifest.ib_source),aliases:[],
    layers:manifest.ib_layers.map(path=>({source:path,sha256:sourceHash(path)})),stages,
    counts:counts(data),
    slides:data.slides.map((slide,index)=>({
      id:slide.id || `ib13-${manifest.source_commit.slice(0,12)}-s${String(index+1).padStart(3,'0')}`,
      source_index:index+1,title:slide.title,layout:'single',anchor:'learn',kind:slide.kind || 'content',
      html_sha256:hash(slide.html || ''),pacing:slide.ibPacing ? {teaching_block:slide.ibPacing.teachingBlock,classification:slide.ibPacing.classification,source_index:slide.ibPacing.originalSlideIndex}:null
    })),
    finish:{delegate:'[data-finish-lesson]',guard:'js/lesson-access-guard.js'},
    preservation:'All legacy slide HTML and assessment payloads remain in their existing runtime. Metadata only.'
  };
  return JSON.parse(JSON.stringify({ap,ib}));
}

export function contractModule(fixtures) {
  const contracts=fixtures;
  return '// Generated from hash-pinned legacy metadata; no question payloads.\nconst contracts = '+JSON.stringify(contracts,null,2)+';\nfunction freeze(value) { if(value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }\nexport const PINNED_LEGACY_CONTRACTS = freeze(contracts);\n';
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const position=process.argv.indexOf('--source-root');
  if(position<0||!process.argv[position+1])throw new Error('Supply --source-root with the audited exact-commit repository snapshot.');
  const output=await buildCompatibilityFixtures(process.argv[position+1]);
  for(const [key,fixture] of Object.entries(output)) {
    const path=resolve(here,`fixtures/${key==='ap'?'ap11':'ib13'}.metadata.json`);
    const text=JSON.stringify(fixture,null,2)+'\n';
    if(process.argv.includes('--check')) {
      if(await readFile(path,'utf8')!==text)throw new Error(`Fixture output changed: ${path}`);
    }else await writeFile(path,text);
  }
  const modulePath=resolve(here,'../../js/lesson-runtime/pinned-legacy-contracts.mjs');
  const moduleText=contractModule(output);
  if(process.argv.includes('--check')) {
    if(await readFile(modulePath,'utf8')!==moduleText)throw new Error('Pinned runtime metadata contract changed.');
  }else {
    await mkdir(dirname(modulePath),{recursive:true});
    await writeFile(modulePath,moduleText);
  }
  process.stdout.write('Verified AP 33/20/3 and IB staged 49/40/2/10 → 36/52/3/14 → 73/96/5/14. Metadata only.\n');
}
