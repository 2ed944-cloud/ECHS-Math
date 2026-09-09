import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,resolve,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {IB13_SOURCE_MANIFEST as manifest,verifyIB13SourceBytes} from './build-ib13-reference.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
test('all 18 original pins, 16 script order and complete stage counts match before composition',async()=>{
  const sources=await verifyIB13SourceBytes(root);
  assert.equal(sources.size,18);assert.equal(manifest.script_order.length,16);
  assert.deepEqual(manifest.expected_stages.at(-1),{script:manifest.script_order.at(-1),slides:78,practice:103,exam:6,quiz:14});
});

test('missing, changed and reordered source files fail before any browser or source execution',async()=>{
  const temporaryRoot=await mkdtemp(join(tmpdir(),'echs-ib13-source-test-'));
  try {
    for(const entry of manifest.files){const destination=resolve(temporaryRoot,entry.path);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,await readFile(resolve(root,entry.path)));}
    await verifyIB13SourceBytes(temporaryRoot);
    const path=resolve(temporaryRoot,manifest.script_order.at(-1)),bytes=await readFile(path);
    await writeFile(path,Buffer.concat([bytes,Buffer.from('\n// changed')]));
    await assert.rejects(()=>verifyIB13SourceBytes(temporaryRoot),/Pinned source changed/);
    await writeFile(path,bytes);await rm(path);
    await assert.rejects(()=>verifyIB13SourceBytes(temporaryRoot),/ENOENT/);await writeFile(path,bytes);
    const htmlPath=resolve(temporaryRoot,manifest.source),html=await readFile(htmlPath,'utf8');
    const scripts=[...html.matchAll(/<script\b[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/g)];assert.equal(scripts.length,16);
    const reordered=html.replace(scripts[0][0],'TEMPORARY_ORDER_MARKER').replace(scripts[1][0],scripts[0][0]).replace('TEMPORARY_ORDER_MARKER',scripts[1][0]);
    await writeFile(htmlPath,reordered);await assert.rejects(()=>verifyIB13SourceBytes(temporaryRoot),/Pinned source changed/);
    await verifyIB13SourceBytes(root);
  }finally{
    // Only remove this freshly created, verified temporary test directory.
    const rel=relative(resolve(tmpdir()),resolve(temporaryRoot));
    if(rel==='..'||rel.startsWith('..'+sep)||!rel.startsWith('echs-ib13-source-test-')||rel.includes(sep))throw new Error('Unsafe test cleanup path.');
    await rm(temporaryRoot,{recursive:true,force:true});
  }
});
