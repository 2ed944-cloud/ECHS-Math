(() => {
  'use strict';

  // Keep implementation/release language out of learner and educator UI chrome.
  // Mathematical prompts and lesson/question content are intentionally excluded.
  const replacements = [
    [/\bproduction environment\b/gi, 'school system'],
    [/\bproduction build\b/gi, 'current version'],
    [/\brelease candidate\b/gi, 'preview'],
    [/\bstaging environment\b/gi, 'preview area'],
    [/\bstaging\b/gi, 'preview'],
    [/\bdeployment\b/gi, 'update'],
    [/\bdeploy\b/gi, 'update'],
    [/\bdebug(?:ging)?\b/gi, 'support'],
    [/\binternal build\b/gi, 'version'],
    [/\bbuild id\b/gi, 'version'],
    [/\bci\/cd\b/gi, 'update process'],
    [/\bpipeline\b/gi, 'process'],
    [/\bbackend\b/gi, 'school service'],
    [/\bfrontend\b/gi, 'page'],
    [/\bserver-side\b/gi, 'secure'],
    [/\bsupabase\b/gi, 'school service'],
    [/\bgithub\b/gi, 'school platform'],
    [/\blocalhost\b/gi, 'school platform'],
    [/\bapi endpoint\b/gi, 'school service'],
    [/\bapi\b/gi, 'service']
  ];

  const excludedSelector = [
    '.questionCard', '.questionShell', '.questionArea', '.questionStage',
    '[data-question]', '[data-question-id]', '.prompt', '.stem', '.problem',
    '.katex', '.katex-display', 'math', 'code', 'pre', 'script', 'style',
    'textarea', '[contenteditable="true"]'
  ].join(',');

  function shouldSkip(node) {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !el || !!el.closest(excludedSelector);
  }

  function clean(value) {
    let next = value;
    for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
    return next;
  }

  function cleanTextNode(node) {
    if (shouldSkip(node) || !node.nodeValue) return;
    const next = clean(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function cleanElement(el) {
    if (!(el instanceof Element) || shouldSkip(el)) return;
    for (const attr of ['title', 'aria-label', 'placeholder']) {
      if (!el.hasAttribute(attr)) continue;
      const current = el.getAttribute(attr) || '';
      const next = clean(current);
      if (next !== current) el.setAttribute(attr, next);
    }
    for (const node of el.childNodes) if (node.nodeType === Node.TEXT_NODE) cleanTextNode(node);
  }

  function cleanTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) return cleanTextNode(root);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) cleanElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) cleanTextNode(node);
      else cleanElement(node);
    }
  }

  function friendlyTechnicalErrors(root = document) {
    const candidates = root.querySelectorAll?.('[role="alert"], .error, .errorMessage, .statusMessage, .iNotice') || [];
    for (const el of candidates) {
      if (shouldSkip(el)) continue;
      const text = (el.textContent || '').trim();
      if (/\b(500|502|503|stack trace|uncaught|typeerror|referenceerror|networkerror)\b/i.test(text)) {
        el.textContent = 'Something went wrong. Please refresh the page. If it continues, ask your teacher or school support team.';
      }
    }
  }

  function run(root = document) {
    cleanTree(root);
    friendlyTechnicalErrors(root.nodeType === Node.DOCUMENT_NODE ? root : root.ownerDocument || document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => run(), { once: true });
  else run();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') cleanTextNode(mutation.target);
      for (const node of mutation.addedNodes) run(node);
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
})();
