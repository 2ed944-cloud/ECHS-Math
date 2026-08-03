(function () {
  "use strict";

  const lessonNumber = document.body?.dataset?.lessonNumber;
  const root = document.querySelector('.empty-state') || document.body;
  const packageBase = new URL('../../../../packages/ib-unit5-v2/', document.baseURI);
  const chunkNames = [
    ...Array.from({ length: 9 }, (_, index) => `part-${String(index).padStart(2, '0')}.b64`),
    'part-09.b64',
    ...Array.from({ length: 10 }, (_, index) => `part-10-${String(index).padStart(2, '0')}.b64`),
    'part-11-00.b64'
  ];

  function setStatus(title, detail) {
    root.innerHTML = `<div style="max-width:760px;margin:15vh auto;padding:28px;border-radius:22px;background:#0e2338;color:#f7f1eb;font:16px/1.6 Inter,system-ui,sans-serif;border:1px solid rgba(255,255,255,.12)"><strong style="display:block;font-size:1.35rem;margin-bottom:8px">${title}</strong><span style="color:#b8c7d6">${detail}</span></div>`;
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${url}`));
      document.head.appendChild(script);
    });
  }

  function evaluate(source, name) {
    const script = document.createElement('script');
    script.textContent = `${source}\n//# sourceURL=${name}`;
    document.head.appendChild(script);
    script.remove();
  }

  async function fetchChunks() {
    const responses = await Promise.all(chunkNames.map(async name => {
      const response = await fetch(new URL(`${name}?v=20260803-zipfix1`, packageBase), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Missing package chunk: ${name}`);
      return (await response.text()).replace(/\s+/g, '');
    }));
    return responses.join('');
  }

  async function boot() {
    if (!lessonNumber) throw new Error('Lesson number is missing from the page.');
    setStatus('Loading Unit 5 learning studio…', 'Preparing the complete lesson, practice, IB tasks, timed quiz and mastery route.');
    if (typeof window.JSZip === 'undefined') {
      await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    }
    const encoded = await fetchChunks();
    if (!encoded.startsWith('UEsD')) throw new Error('The Unit 5 package header is invalid.');
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const zip = await window.JSZip.loadAsync(bytes, { checkCRC32: true });
    const prefix = 'lessons/ib-math-ai/unit-5/';
    const cssEntry = zip.file(`${prefix}assets/css/theme.css`);
    const dataEntry = zip.file(`${prefix}data/lesson-${lessonNumber}.js`);
    const engineEntry = zip.file(`${prefix}assets/js/engine.js`);
    if (!cssEntry || !dataEntry || !engineEntry) throw new Error(`The Unit 5 package is missing runtime files for Lesson ${lessonNumber}.`);

    const [css, data, engine] = await Promise.all([
      cssEntry.async('string'),
      dataEntry.async('string'),
      engineEntry.async('string')
    ]);
    const style = document.createElement('style');
    style.dataset.unit5Runtime = 'full-theme';
    style.textContent = css;
    document.head.appendChild(style);
    evaluate(data, `unit5/lesson-${lessonNumber}.js`);
    evaluate(engine, 'unit5/engine.js');
  }

  boot().catch(error => {
    console.error('[ECHS Unit 5]', error);
    setStatus('Unit 5 could not finish loading.', `${error.message} Refresh the page once; if the problem continues, return to the Unit 5 page.`);
  });
})();
