/** Server-side bounded container inspection, not a decoder or malware scanner.
 * Images are static PNG, 8-bit baseline/progressive JPEG, or static WebP.
 * PDFs are download-only resources; structural checks do not prove PDF safety.
 * No filename, supplied URL, SVG or HTML influences the detected MIME type.
 * Format references: w3.org/TR/png-3, w3.org/Graphics/JPEG/itu-t81.pdf,
 * developers.google.com/speed/webp/docs/riff_container.
 */
export const LESSON_ASSET_LIMITS = Object.freeze({ imageBytes: 4 * 1024 * 1024,
  pdfBytes: 8 * 1024 * 1024, width: 4096, height: 4096, pixels: 16 * 1024 * 1024 });
export const LESSON_ASSET_MIMES = Object.freeze(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const MESSAGES = Object.freeze({ asset_invalid_bytes: 'A nonempty binary file is required.',
  asset_mime_not_allowed: 'Use a supported raster image or PDF resource.',
  asset_too_large: 'The file exceeds the lesson asset size limit.',
  asset_invalid_format: 'The file does not match a supported complete container.',
  asset_dimensions_exceeded: 'The image exceeds the lesson dimension limit.' });
export class LessonAssetError extends Error {
  constructor(code) { super(MESSAGES[code] || 'The lesson asset operation could not complete.'); this.name = 'LessonAssetError'; this.code = code; }
}
const fail = (code = 'asset_invalid_format') => { throw new LessonAssetError(code); };
const typedArray = Object.getPrototypeOf(Uint8Array.prototype);
const byteLength = Object.getOwnPropertyDescriptor(typedArray, 'byteLength').get;
const buffer = Object.getOwnPropertyDescriptor(typedArray, 'buffer').get;
export function lessonAssetByteLimit(mime) {
  if (!LESSON_ASSET_MIMES.includes(mime)) fail('asset_mime_not_allowed');
  return mime === 'application/pdf' ? LESSON_ASSET_LIMITS.pdfBytes : LESSON_ASSET_LIMITS.imageBytes;
}
/** Snapshot before hashing or network awaits; callers cannot mutate inspected bytes. */
export function copyLessonAssetBytes(value, mime) {
  const limit = lessonAssetByteLimit(mime);
  let length;
  try {
    if (!(value instanceof Uint8Array)) fail('asset_invalid_bytes');
    length = byteLength.call(value);
    if (typeof SharedArrayBuffer !== 'undefined' && buffer.call(value) instanceof SharedArrayBuffer) fail('asset_invalid_bytes');
  } catch { fail('asset_invalid_bytes'); }
  if (!length) fail('asset_invalid_bytes');
  if (length > limit) fail('asset_too_large');
  const copy = new Uint8Array(length); copy.set(value); return copy;
}
const ascii = (bytes, start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
const be16 = (b, p) => b[p] * 256 + b[p + 1];
const be32 = (b, p) => b[p] * 16777216 + b[p + 1] * 65536 + b[p + 2] * 256 + b[p + 3];
const le16 = (b, p) => b[p] + b[p + 1] * 256;
const le24 = (b, p) => b[p] + b[p + 1] * 256 + b[p + 2] * 65536;
const le32 = (b, p) => le24(b, p) + b[p + 3] * 16777216;
function dimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) fail();
  if (width > LESSON_ASSET_LIMITS.width || height > LESSON_ASSET_LIMITS.height || width * height > LESSON_ASSET_LIMITS.pixels) fail('asset_dimensions_exceeded');
  return { width, height };
}
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) { let n = i; for (let bit = 0; bit < 8; bit++) n = (n >>> 1) ^ ((n & 1) ? 0xedb88320 : 0); CRC_TABLE[i] = n >>> 0; }
function crc32(bytes, start, end) {
  let n = 0xffffffff; for (let i = start; i < end; i++) n = (n >>> 8) ^ CRC_TABLE[(n ^ bytes[i]) & 255]; return (n ^ 0xffffffff) >>> 0;
}
function png(bytes) {
  if (bytes.length < 57 || ![137,80,78,71,13,10,26,10].every((n, i) => bytes[i] === n)) fail();
  let p = 8, shape, color, depth, palette = false, data = false, dataEnded = false;
  while (p < bytes.length) {
    if (p + 12 > bytes.length) fail();
    const length = be32(bytes, p), type = ascii(bytes, p + 4, 4), start = p + 8, end = start + length;
    if (end + 4 > bytes.length || !/^[A-Za-z]{4}$/.test(type) || type[2] !== type[2].toUpperCase() || crc32(bytes, p + 4, end) !== be32(bytes, end)) fail();
    if (!shape && type !== 'IHDR') fail();
    if (type === 'IHDR') {
      if (shape || p !== 8 || length !== 13) fail();
      shape = dimensions(be32(bytes, start), be32(bytes, start + 4)); depth = bytes[start + 8]; color = bytes[start + 9];
      const depths = { 0: [1,2,4,8,16], 2: [8,16], 3: [1,2,4,8], 4: [8,16], 6: [8,16] };
      if (!depths[color]?.includes(depth) || bytes[start + 10] !== 0 || bytes[start + 11] !== 0 || bytes[start + 12] > 1) fail();
    } else if (type === 'PLTE') {
      if (palette || data || color === 0 || color === 4 || !length || length % 3 || length > 768 || (color === 3 && length / 3 > 2 ** depth)) fail();
      palette = true;
    } else if (type === 'IDAT') {
      if (dataEnded || (color === 3 && !palette)) fail();
      // Zero-sized IDATs are allowed by PNG, but some compressed data is required.
      data ||= length > 0;
    } else if (type === 'IEND') {
      if (length !== 0 || !data || end + 4 !== bytes.length) fail(); return shape;
    } else {
      if (['acTL','fcTL','fdAT'].includes(type) || type[0] === type[0].toUpperCase()) fail();
      if (data) dataEnded = true;
    }
    p = end + 4;
  }
  fail();
}
function jpeg(bytes) {
  if (bytes.length < 20 || bytes[0] !== 0xff || bytes[1] !== 0xd8) fail();
  let p = 2, shape, scanCount = 0, entropyBytes = 0, components;
  while (p < bytes.length) {
    if (bytes[p++] !== 0xff) fail();
    while (p < bytes.length && bytes[p] === 0xff) p++;
    const marker = bytes[p++];
    if (marker === 0xd9) { if (!shape || !scanCount || !entropyBytes || p !== bytes.length) fail(); return shape; }
    if (![0xc0,0xc2,0xc4,0xdb,0xdd,0xda,0xfe].includes(marker) && !(marker >= 0xe0 && marker <= 0xef)) fail();
    if (p + 2 > bytes.length) fail();
    const length = be16(bytes, p), start = p + 2, end = p + length;
    if (length < 2 || end > bytes.length) fail();
    if (marker === 0xc0 || marker === 0xc2) {
      if (shape || length < 11 || bytes[start] !== 8) fail();
      shape = dimensions(be16(bytes, start + 3), be16(bytes, start + 1));
      const count = bytes[start + 5]; if (![1,3,4].includes(count) || length !== 8 + 3 * count) fail();
      components = new Set();
      for (let i = 0; i < count; i++) {
        const id = bytes[start + 6 + i * 3], sample = bytes[start + 7 + i * 3];
        if (components.has(id) || !(sample >> 4) || (sample >> 4) > 4 || !(sample & 15) || (sample & 15) > 4 || bytes[start + 8 + i * 3] > 3) fail();
        components.add(id);
      }
    } else if (marker === 0xda) {
      if (!shape || length < 8) fail();
      const count = bytes[start]; if (count < 1 || count > components.size || length !== 6 + 2 * count) fail();
      const selected = new Set();
      for (let i = 0; i < count; i++) { const id = bytes[start + 1 + i * 2]; if (!components.has(id) || selected.has(id)) fail(); selected.add(id); }
      scanCount++; p = end;
      while (p < bytes.length) {
        if (bytes[p] !== 0xff) { entropyBytes++; p++; continue; }
        let next = p + 1; while (next < bytes.length && bytes[next] === 0xff) next++;
        if (next >= bytes.length) fail();
        if (bytes[next] === 0 || (bytes[next] >= 0xd0 && bytes[next] <= 0xd7)) { entropyBytes++; p = next + 1; continue; }
        break;
      }
      continue;
    } else if (marker === 0xdd && length !== 4) fail();
    p = end;
  }
  fail();
}
function webp(bytes) {
  if (bytes.length < 26 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP' || le32(bytes, 4) + 8 !== bytes.length) fail();
  let p = 12, canvas, shape, extended = false, flags = 0, losslessAlpha = false;
  const seen = new Set();
  while (p < bytes.length) {
    if (p + 8 > bytes.length) fail();
    const type = ascii(bytes, p, 4), length = le32(bytes, p + 4), start = p + 8, end = start + length;
    if (end + (length & 1) > bytes.length || (length & 1 && bytes[end] !== 0) || seen.has(type)) fail(); seen.add(type);
    if (type === 'VP8X') {
      if (p !== 12 || length !== 10) fail(); extended = true; flags = bytes[start];
      if ((flags & 0xc3) || bytes[start + 1] || bytes[start + 2] || bytes[start + 3]) fail();
      canvas = dimensions(le24(bytes, start + 4) + 1, le24(bytes, start + 7) + 1);
    } else if (type === 'VP8 ') {
      if (shape || length < 11 || bytes[start] & 1 || ((bytes[start] >> 1) & 7) > 3 || !(bytes[start] & 0x10) || ascii(bytes, start + 3, 3) !== '\x9d\x01\x2a' || (le16(bytes, start + 6) & 0xc000) || (le16(bytes, start + 8) & 0xc000)) fail();
      shape = dimensions(le16(bytes, start + 6) & 0x3fff, le16(bytes, start + 8) & 0x3fff);
    } else if (type === 'VP8L') {
      if (shape || length < 6 || bytes[start] !== 0x2f || bytes[start + 4] & 0xe0 || seen.has('ALPH')) fail();
      const bits = le32(bytes, start + 1); losslessAlpha = Boolean(bits & 0x10000000); shape = dimensions((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
    } else if (['ICCP','EXIF','XMP ','ALPH'].includes(type)) {
      if (!extended || !length || (['ICCP','ALPH'].includes(type) && shape)) fail();
      if (type === 'ALPH' && ((bytes[start] & 0xc3) > 1 || ((bytes[start] >> 4) & 3) > 1)) fail();
    } else fail(); // Animated and unknown containers are outside the static subset.
    if (!extended && p !== 12) fail();
    p = end + (length & 1);
  }
  if (!shape || (canvas && (canvas.width !== shape.width || canvas.height !== shape.height))) fail();
  if (extended && ((Boolean(flags & 0x20) !== seen.has('ICCP')) || (Boolean(flags & 0x08) !== seen.has('EXIF')) || (Boolean(flags & 0x04) !== seen.has('XMP ')))) fail();
  if (extended && Boolean(flags & 0x10) !== (seen.has('ALPH') || losslessAlpha)) fail();
  return shape;
}
function pdf(bytes) {
  if (bytes.length < 50 || !/^%PDF-(?:1\.[0-7]|2\.0)[\r\n]/.test(ascii(bytes, 0, 10))) fail();
  // Read a bounded tail, not an unbounded regular expression over binary data.
  const tail = ascii(bytes, Math.max(0, bytes.length - 1024), Math.min(bytes.length, 1024));
  const end = /startxref[\x09\x0a\x0c\x0d\x20]+([0-9]{1,10})[\x09\x0a\x0c\x0d\x20]+%%EOF[\x09\x0a\x0c\x0d\x20]*$/.exec(tail);
  if (!end) fail();
  const offset = Number(end[1]); if (offset < 8 || offset >= bytes.length - 20) fail();
  const xref = ascii(bytes, offset, Math.min(512, bytes.length - offset));
  // Accept conventional xref tables and PDF 1.5+ cross-reference stream objects.
  if (!/^xref[\r\n\x20]/.test(xref) && !/^[0-9]+[\x20]+[0-9]+[\x20]+obj\b[\s\S]*\/Type[\x20\r\n]*\/XRef\b/.test(xref)) fail();
  return { width: null, height: null };
}
export async function inspectLessonAsset(value, declaredMIME) {
  const bytes = copyLessonAssetBytes(value, declaredMIME);
  const shape = ({ 'image/png': png, 'image/jpeg': jpeg, 'image/webp': webp, 'application/pdf': pdf })[declaredMIME](bytes);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
  return Object.freeze({ mime: declaredMIME, bytes: bytes.length, ...shape, sha256 });
}
