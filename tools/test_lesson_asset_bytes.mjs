import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { inspectLessonAsset, LESSON_ASSET_LIMITS, LessonAssetError } from '../supabase/functions/lesson-api/asset-bytes.mjs';

// Original 2x3 solid-color fixtures encoded by Pillow. No network or private files.
const unbase64 = value => new Uint8Array(Buffer.from(value, 'base64'));
const PNG = unbase64('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII=');
const JPEG = unbase64('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAADAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDh6KKK+nPCP//Z');
// Separate genuine progressive scan fixture exercises repeated SOS/DHT markers.
const PROGRESSIVE = unbase64('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAVAQEBAAAAAAAAAAAAAAAAAAAEBf/aAAwDAQACEAMQAAABhimD/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAP/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=');
const WEBP = unbase64('UklGRjgAAABXRUJQVlA4ICwAAADQAQCdASoCAAMAAUAmJaACdLoB+AADsAD+9L7v/maMJSR5Af/FnIxHZeAAAA==');
const LOSSLESS = unbase64('UklGRh4AAABXRUJQVlA4TBEAAAAvAYAAAAdQqGbUsv+BiOh/AAA=');
const ALPHA_WEBP = unbase64('UklGRloAAABXRUJQVlA4WAoAAAAQAAAAAQAAAgAAQUxQSAcAAAAAeHh4eHh4AFZQOCAsAAAA0AEAnQEqAgADAAFAJiWgAnS6AfgAA7AA/vS+7/5mjCUkeQH/xZyMR2XgAAA=');
const ALPHA_LOSSLESS = unbase64('UklGRh4AAABXRUJQVlA4TBEAAAAvAYAAEAdQqGbUsniBiOh/AAA=');
const bytes = value => new TextEncoder().encode(value);
const join = (...parts) => new Uint8Array(Buffer.concat(parts.map(part => Buffer.from(part))));
const hash = value => createHash('sha256').update(value).digest('hex');
const reject = (value, mime, code) => assert.rejects(inspectLessonAsset(value, mime), error => error instanceof LessonAssetError && (!code || error.code === code));
function pdf(padding = 0) {
  let source = '%PDF-1.7\n%' + ' '.repeat(padding) + '\n';
  const root = source.length; source += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const pages = source.length; source += '2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n';
  const xref = source.length;
  source += `xref\n0 3\n0000000000 65535 f \n${String(root).padStart(10,'0')} 00000 n \n${String(pages).padStart(10,'0')} 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return bytes(source);
}
function pngChunk(name, body) {
  const chunk = Buffer.alloc(body.length + 12); chunk.writeUInt32BE(body.length); chunk.write(name, 4, 'ascii'); Buffer.from(body).copy(chunk, 8);
  let crc = 0xffffffff;
  for (const n of chunk.subarray(4, -4)) { crc ^= n; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4); return new Uint8Array(chunk);
}
function pngHeader(width, height, patch = {}) {
  const body = Buffer.from(PNG.subarray(16, 29)); body.writeUInt32BE(width); body.writeUInt32BE(height,4);
  for (const [index, value] of Object.entries(patch)) body[Number(index)] = value;
  return join(PNG.subarray(0, 8), pngChunk('IHDR',body), PNG.subarray(33));
}
function extendedWebp(width = 2, height = 3, flags = 0, rest = WEBP.subarray(12)) {
  const chunk = Buffer.alloc(18); chunk.write('VP8X'); chunk.writeUInt32LE(10,4); chunk[8]=flags;
  chunk.writeUIntLE(width - 1,12,3); chunk.writeUIntLE(height - 1,15,3);
  const result = Buffer.from(join(WEBP.subarray(0,12),chunk,rest)); result.writeUInt32LE(result.length - 8,4); return new Uint8Array(result);
}

test('real static PNG/JPEG/progressive/WebP/lossless fixtures return exact dimensions and independent SHA-256', async () => {
  for (const [value,mime] of [[PNG,'image/png'],[JPEG,'image/jpeg'],[PROGRESSIVE,'image/jpeg'],[WEBP,'image/webp'],[LOSSLESS,'image/webp'],[ALPHA_WEBP,'image/webp'],[ALPHA_LOSSLESS,'image/webp'],[extendedWebp(),'image/webp']]) {
    assert.deepEqual(await inspectLessonAsset(value,mime),{mime,bytes:value.length,width:2,height:3,sha256:hash(value)});
  }
});
test('PDF header, EOF and actual xref offset are inspected; metadata is explicitly non-image', async () => {
  const value=pdf(); assert.deepEqual(await inspectLessonAsset(value,'application/pdf'),{mime:'application/pdf',bytes:value.length,width:null,height:null,sha256:hash(value)});
  for (const content of ['<html>resource</html>', '%PDF-1.7\n<html>fake PDF</html>\nstartxref\n10\n%%EOF\n',new TextDecoder().decode(value).replace(/startxref\n\d+/, 'startxref\n8')]) await reject(bytes(content),'application/pdf','asset_invalid_format');
});
test('declared MIME is closed and cannot disguise SVG/HTML or another valid image type', async () => {
  for (const mime of ['image/svg+xml','text/html','image/gif','image/jpg','IMAGE/PNG','image/png; charset=utf-8','image/png\r\nX: y',null]) await reject(PNG,mime,'asset_mime_not_allowed');
  for (const [value,mime] of [[PNG,'image/jpeg'],[JPEG,'image/png'],[WEBP,'application/pdf'],[bytes('<svg xmlns="http://www.w3.org/2000/svg"/>'),'image/png'],[bytes('<html>malicious</html>'),'image/webp']]) await reject(value,mime,'asset_invalid_format');
});
test('binary input is bounded, nonempty and privately copied before asynchronous hashing', async () => {
  for (const value of [null, [], {}, new ArrayBuffer(10),new DataView(new ArrayBuffer(10)),new Uint8Array()]) await reject(value,'image/png','asset_invalid_bytes');
  if (typeof SharedArrayBuffer!=='undefined') await reject(new Uint8Array(new SharedArrayBuffer(100)),'image/png','asset_invalid_bytes');
  const input=PNG.slice(), expected=hash(input), promise=inspectLessonAsset(input,'image/png'); input.fill(0);
  const inspected=await promise; assert.equal(inspected.sha256,expected); assert.ok(Object.isFrozen(inspected));
});
test('every truncated prefix of valid raster fixtures and PDF is rejected', async () => {
  for (const [value,mime] of [[PNG,'image/png'],[JPEG,'image/jpeg'],[PROGRESSIVE,'image/jpeg'],[WEBP,'image/webp'],[LOSSLESS,'image/webp'],[ALPHA_WEBP,'image/webp'],[ALPHA_LOSSLESS,'image/webp'],[pdf(),'application/pdf']]) {
    // An optional final PDF newline can be absent; every prefix before EOF is invalid.
    const end=mime==='application/pdf'?value.length-1:value.length;
    for (let n=0;n<end;n++) await reject(value.subarray(0,n),mime);
  }
});
test('PNG verifies CRC, chunk lengths/order, known critical chunks and a complete static image', async () => {
  const crc=PNG.slice();crc[45]^=1;await reject(crc,'image/png');
  const length=PNG.slice();length.set([255,255,255,255],33);await reject(length,'image/png');
  for (const chunk of [pngChunk('ABCD',bytes('x')),pngChunk('acTL',new Uint8Array(8)),pngChunk('IHDR',PNG.subarray(16,29))]) await reject(join(PNG.subarray(0,33),chunk,PNG.subarray(33)),'image/png');
  await reject(pngHeader(2,3,{8:3}),'image/png');
  await reject(pngHeader(2,3,{9:3}),'image/png');
  await reject(join(PNG,bytes('<html>trailing</html>')),'image/png');
});
test('PNG rejects dimension bombs, zero dimensions and pixel-product overflow at bounded edges', async () => {
  for (const [width,height] of [[4097,1],[1,4097],[0xffffffff,1]]) await reject(pngHeader(width,height),'image/png','asset_dimensions_exceeded');
  await reject(pngHeader(0,3),'image/png','asset_invalid_format');
  assert.deepEqual(LESSON_ASSET_LIMITS,{imageBytes:4194304,pdfBytes:8388608,width:4096,height:4096,pixels:16777216});
  assert.equal((await inspectLessonAsset(pngHeader(4096,4096),'image/png')).width,4096);
});
test('JPEG rejects unsupported precision, malformed segments, dimension bombs and bytes after EOI', async () => {
  const sof=Buffer.from(JPEG).indexOf(Buffer.from([255,192]));assert.ok(sof>0);
  const precision=JPEG.slice();precision[sof+4]=12;await reject(precision,'image/jpeg');
  const bomb=JPEG.slice();bomb[sof+7]=0x10;bomb[sof+8]=0x01;await reject(bomb,'image/jpeg','asset_dimensions_exceeded');
  const segment=JPEG.slice();segment[4]=255;segment[5]=255;await reject(segment,'image/jpeg');
  await reject(join(JPEG,bytes('<html>trailing</html>')),'image/jpeg');
});
test('WebP checks RIFF size, chunk padding, static-only flags, canvas consistency and dimensions', async () => {
  const bad=WEBP.slice();bad[4]++;await reject(bad,'image/webp');
  const padding=LOSSLESS.slice();padding[padding.length-1]=1;await reject(padding,'image/webp');
  for (const flags of [2,1,0x40,0x80,0x20,8,4,0x10]) await reject(extendedWebp(2,3,flags),'image/webp');
  await reject(extendedWebp(3,3),'image/webp');
  await reject(extendedWebp(4097,1),'image/webp','asset_dimensions_exceeded');
  const vp8=WEBP.slice();vp8[26]=1;vp8[27]=0x10;await reject(vp8,'image/webp','asset_dimensions_exceeded');
  const vp8l=LOSSLESS.slice();vp8l[24]|=0x20;await reject(vp8l,'image/webp');
  const alpha=ALPHA_WEBP.slice();alpha[20]=0;await reject(alpha,'image/webp');
});
test('image and PDF exact byte limits are accepted; one byte over is refused before parsing', async () => {
  const padding=pngChunk('tEXt',new Uint8Array(LESSON_ASSET_LIMITS.imageBytes-PNG.length-12));
  const image=join(PNG.subarray(0,33),padding,PNG.subarray(33));assert.equal(image.length,LESSON_ASSET_LIMITS.imageBytes);
  assert.equal((await inspectLessonAsset(image,'image/png')).bytes,image.length);
  await reject(join(image,new Uint8Array(1)),'image/png','asset_too_large');
  // Offset digit count changes the footer length; adjust to reach exactly 8 MiB.
  let resource=pdf(LESSON_ASSET_LIMITS.pdfBytes-pdf().length-5);
  resource=pdf(LESSON_ASSET_LIMITS.pdfBytes-pdf().length-5+(LESSON_ASSET_LIMITS.pdfBytes-resource.length));
  assert.equal(resource.length,LESSON_ASSET_LIMITS.pdfBytes);
  assert.equal((await inspectLessonAsset(resource,'application/pdf')).bytes,resource.length);
  await reject(join(resource,new Uint8Array(1)),'application/pdf','asset_too_large');
});
