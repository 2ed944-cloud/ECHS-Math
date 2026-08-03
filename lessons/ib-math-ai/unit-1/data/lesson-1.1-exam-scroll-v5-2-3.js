(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  function isFormControl(target) {
    return target instanceof Element && Boolean(target.closest('textarea,input,select,button,a,[contenteditable="true"]'));
  }

  function syncAssessmentScrollSurface() {
    const active = document.body.classList.contains('exam-assessment-active');
    app.classList.toggle('exam-scroll-surface', active);
    if (active) {
      app.tabIndex = 0;
      app.setAttribute('aria-label', 'Scrollable IB-style assessment');
      app.setAttribute('role', 'region');
    } else if (app.classList.contains('exam-scroll-surface') === false) {
      app.removeAttribute('tabindex');
      app.removeAttribute('aria-label');
      app.removeAttribute('role');
    }
  }

  app.addEventListener('keydown', event => {
    if (!document.body.classList.contains('exam-assessment-active') || isFormControl(event.target)) return;
    const page = Math.max(220, Math.round(app.clientHeight * 0.78));
    if (event.key === 'PageDown') {
      event.preventDefault();
      app.scrollBy({ top: page, behavior: 'smooth' });
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      app.scrollBy({ top: -page, behavior: 'smooth' });
    } else if (event.key === 'Home') {
      event.preventDefault();
      app.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (event.key === 'End') {
      event.preventDefault();
      app.scrollTo({ top: app.scrollHeight, behavior: 'smooth' });
    }
  });

  new MutationObserver(syncAssessmentScrollSurface).observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
  new MutationObserver(syncAssessmentScrollSurface).observe(app, {
    childList: true,
    subtree: false
  });
  addEventListener('hashchange', syncAssessmentScrollSurface);
  syncAssessmentScrollSurface();
})();
