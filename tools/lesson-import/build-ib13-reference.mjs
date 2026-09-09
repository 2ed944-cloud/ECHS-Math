import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,relative,sep,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {parse} from '../lesson-compatibility/node_modules/parse5/dist/index.js';
import {IB13_IMPORT_TARGET} from '../../js/lesson-studio/ib13-import-target.mjs';
import {NATIVE_IB13} from './native-ib13.mjs';

const here=dirname(fileURLToPath(import.meta.url));
export const IB13_SOURCE_MANIFEST=JSON.parse(await readFile(resolve(here,'source-manifest.json'),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const walk=node=>[node,...(node.childNodes||[]).flatMap(walk)];

/** Verify every script before trusted composition; this is not an untrusted-JavaScript sandbox. */
export async function verifyIB13SourceBytes(sourceRoot) {
  const root=resolve(sourceRoot),manifest=IB13_SOURCE_MANIFEST,sources=new Map();
  for(const entry of manifest.files) {
    const path=resolve(root,entry.path),rel=relative(root,path);
    if(rel==='..'||rel.startsWith('..'+sep))throw new Error('Source path escaped repository.');
    const bytes=await readFile(path);
    if(hash(bytes)!==entry.sha256)throw new Error(`Pinned source changed: ${entry.path}`);
    sources.set(entry.path,bytes);
  }
  const html=parse(sources.get(manifest.source).toString('utf8'));
  const scripts=walk(html).filter(node=>node.tagName==='script');
  const ordered=scripts.map(node=>{
    const src=node.attrs.find(attr=>attr.name==='src')?.value;
    if(!src||/^(?:[a-z]+:|\/)/i.test(src))throw new Error('Only the exact external repository script closure is allowed.');
    return posix.normalize(posix.join(posix.dirname(manifest.source),src.split('?')[0]));
  });
  if(!equal(ordered,manifest.script_order)||ordered.length!==16)throw new Error('The exact 16-script HTML load order changed.');
  return sources;
}

/** All requests are intercepted. No accounts, production services or question payloads leave this fixture. */
export async function composeIB13ReferenceSource(sourceRoot) {
  const root=resolve(sourceRoot),sources=await verifyIB13SourceBytes(root),manifest=IB13_SOURCE_MANIFEST;
  const require=createRequire(resolve(root,'question-bank/official/tools/package.json'));
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true,...(process.env.ECHS_CHROMIUM_PATH?{executablePath:process.env.ECHS_CHROMIUM_PATH}:{})});
  const origin='https://ib13-source.invalid',failures=[];
  try {
    const page=await browser.newPage({serviceWorkers:'block'});
    page.on('pageerror',error=>failures.push(`Source page error: ${error.message}`));
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin!==origin){failures.push('Unexpected external request.');return route.abort();}
      const pathname=decodeURIComponent(url.pathname).slice(1),absolute=resolve(root,pathname),rel=relative(root,absolute);
      if(rel==='..'||rel.startsWith('..'+sep)){failures.push('Fixture path traversal.');return route.abort();}
      const extension=posix.extname(pathname).toLowerCase();
      if(!sources.has(pathname)&&!['.css','.woff','.woff2','.ttf','.png','.jpg','.webp','.svg','.ico'].includes(extension)){
        failures.push(`Unexpected active fixture resource: ${pathname}`);return route.abort();
      }
      try {
        const body=sources.get(pathname)||await readFile(absolute);
        const contentType={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'}[extension];
        return route.fulfill({status:200,contentType,body});
      }catch{failures.push(`Missing fixture resource: ${pathname}`);return route.abort();}
    });
    await page.addInitScript(()=>{
      window.__ib13Stages=[];
      document.addEventListener('load',event=>{
        if(event.target.tagName!=='SCRIPT')return;
        const data=window.LESSON_DATA;
        window.__ib13Stages.push({script:new URL(event.target.src).pathname.slice(1),slides:data.slides.length,practice:data.practice.length,exam:data.exam.length,quiz:data.quiz.length});
      },true);
    });
    await page.goto(`${origin}/${manifest.source}`,{waitUntil:'load',timeout:30000});
    await page.waitForFunction(()=>window.__ib13Stages.length===16&&document.querySelector('#app .stage'),{},{timeout:15000}).catch(async()=>{
      const diagnostic=await page.evaluate(()=>({stages:window.__ib13Stages,slideCount:window.LESSON_DATA?.slides?.length,titleFound:Boolean(document.querySelector('.slide-title')),appFound:Boolean(document.querySelector('#app'))}));
      throw new Error(`Full source fixture not ready: ${JSON.stringify({failures,diagnostic})}`);
    });
    // Project only teaching-slide metadata and counts. Do not return assessments, solutions or notes.
    const projection=await page.evaluate(async()=>({
      stages:window.__ib13Stages,
      counts:Object.fromEntries(['slides','practice','exam','quiz'].map(key=>[key,window.LESSON_DATA[key].length])),
      slides:await Promise.all(window.LESSON_DATA.slides.map(async slide=>({id:slide.id||null,title:slide.title,kind:slide.kind||'content',
        htmlSha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(slide.html||''))),byte=>byte.toString(16).padStart(2,'0')).join(''),
        pacing:slide.ibPacing?{teachingBlock:slide.ibPacing.teachingBlock,classification:slide.ibPacing.classification,sourceIndex:slide.ibPacing.originalSlideIndex}:null}))),
      gdc: {version:window.LESSON_DATA.gdcV7?.version,workflows:window.LESSON_DATA.gdcV7?.workflows?.length},
      renderedStage:Boolean(document.querySelector('#app .stage'))
    }));
    if(failures.length)throw new Error(failures.join('\n'));
    if(!equal(projection.stages,manifest.expected_stages)||!equal(projection.counts,manifest.expected_counts))throw new Error('Full HTML composition counts or stages differ from the reviewed source.');
    const old=JSON.parse(sources.get('tools/lesson-compatibility/fixtures/ib13.metadata.json').toString('utf8'));
    for(let index=0;index<73;index++){
      if(old.slides[index].html_sha256!==projection.slides[index].htmlSha256||old.slides[index].title!==projection.slides[index].title)throw new Error(`Existing compatibility slide ${index+1} changed.`);
    }
    await verifyIB13SourceBytes(root);
    return {projection,old};
  }finally{await browser.close();}
}

export function referenceFromProjection({projection,old}) {
  const manifest=IB13_SOURCE_MANIFEST,target=IB13_IMPORT_TARGET;
  if(!equal(Object.keys(NATIVE_IB13).map(Number),manifest.native_candidates))throw new Error('Native review ledger and authored candidates differ.');
  const slides=projection.slides.map((slide,index)=>{
    const sourceIndex=index+1,id=index<73?old.slides[index].id:`ib13-${manifest.source_commit.slice(0,12)}-s${String(sourceIndex).padStart(3,'0')}`;
    const native=NATIVE_IB13[sourceIndex],exception=manifest.review_exceptions.find(item=>item.sourceIndex===sourceIndex);
    const reason=native?'Original ECHS explanation of reviewed mathematical facts; semantic reading order and formula relationships retained.':exception?.reason||
      (sourceIndex>=74?'GDC workflow and simulator interaction retained in the original lesson.':
      sourceIndex===73?'Infinite geometric series is an AHL 1.11 extension, not AI SL core; retained in the original lesson.':
      ['student','worked','inquiry','lab'].includes(slide.kind)?'Interactive, assessment or worked-response content remains in its original guarded lesson.':'Original visual or teaching content awaits a separate native review; complete original reference retained.');
    return {sourceIndex,id,title:slide.title,htmlSha256:slide.htmlSha256,disposition:native?'native':'reference',reason,
      coverage:native?native.coverage:[slide.title],pacing:slide.pacing,
      ...(native?{reviewNotes:native.reviewNotes,nativeSlide:{id,title:slide.title,layout:'single',blocks:native.blocks.map((block,i)=>({id:`${id}-b${String(i+1).padStart(2,'0')}`,...structuredClone(block)}))}}:{})};
  });
  const reference={contract:'echs.ib13.reference.v1',source:{id:'ib13-fda45056e7b1-full78',path:target.path,title:'Geometric Sequences and Series',
    sha256:manifest.files.find(file=>file.path===manifest.source).sha256,sourceCommit:manifest.source_commit,
    courseVersionId:target.courseVersionId,accessKey:target.accessKey,courseKey:target.courseKey,unitId:target.unitId,topicId:target.topicId,counts:projection.counts},
    slides,preservedFeatures:[
      {kind:'assessment',label:'Original practice, exam tasks and checkpoint',counts:{practice:103,exam:6,quiz:14}},
      {kind:'interaction',label:'Geometric explorer and sequence generator',sourceIndexes:[65,66]},
      {kind:'technology',label:'GDC workflows, local teaching controls and lazy TI-84 simulator',sourceIndexes:[74,75,76,77,78]},
      {kind:'release',label:'Original route, lesson access guard, finish delegate and question publication gates remain authoritative'}
    ],review:{kind:'Original ECHS prose and mathematical-fact review; not publisher permission or student publication approval',
      officialSections:['SL 1.3','SL 1.4','SL 1.5','SL 2.5','SL 2.6'],
      sourceUrl:'https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf',
      curriculum:'IB Mathematics: Applications and Interpretation, first assessment 2021',
      nativeCount:slides.filter(slide=>slide.disposition==='native').length,referenceCount:slides.filter(slide=>slide.disposition==='reference').length,
      exceptions:manifest.review_exceptions,objectivePolicy:'Teacher-entered objectives and skills are preserved; local lesson 1.3 is not an imported official objective identifier.',
      fidelity:'Full source order, stable IDs and hashes are preserved. Native tables and prose are accessible semantic reflows, not pixel-identical legacy HTML. Unconverted interactions and assessments remain at the original route.'},
    budget:{maxJsonBytes:manifest.max_public_json_bytes}};
  if(Buffer.byteLength(JSON.stringify(reference),'utf8')>manifest.max_public_json_bytes)throw new Error('Public reference data exceeds its 256 KiB budget.');
  return reference;
}

export function referenceModule(reference) {
  return '// Generated by tools/lesson-import/build-ib13-reference.mjs from exact pinned source composition and original ECHS prose.\n// Inert public teaching data only; no assessment, hidden answer, teacher-note or account payloads.\nconst reference = '+JSON.stringify(reference,null,2)+';\nfunction freeze(value) { if(value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }\nexport const IB13_REFERENCE = freeze(reference);\n';
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const index=process.argv.indexOf('--source-root');
  if(index<0||!process.argv[index+1])throw new Error('Supply --source-root for the exact reviewed repository.');
  const composed=await composeIB13ReferenceSource(process.argv[index+1]),reference=referenceFromProjection(composed),output=referenceModule(reference);
  const path=resolve(here,'../../js/lesson-studio/ib13-reference.mjs');
  if(process.argv.includes('--check')){if(await readFile(path,'utf8')!==output)throw new Error('Generated IB13 reference differs.');}
  else await writeFile(path,output);
  console.log(JSON.stringify({ok:true,scripts:16,counts:reference.source.counts,native:reference.review.nativeCount,references:reference.review.referenceCount,jsonBytes:Buffer.byteLength(JSON.stringify(reference)),moduleBytes:Buffer.byteLength(output),originalScriptsUnchanged:true}));
}
