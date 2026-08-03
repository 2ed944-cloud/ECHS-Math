(function () {
  'use strict';

  const data = window.LESSON_DATA;
  if (!data || String(data.lesson?.number || '') !== '1.1') return;

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function patchRouteText(root = document) {
    if (!root?.querySelectorAll) return;

    root.querySelectorAll('[data-filter]').forEach(button => {
      const level = button.dataset.filter;
      const count = level === 'All'
        ? data.practice.length
        : data.practice.filter(question => question.level === level).length;
      setText(button, `${level} · ${count}`);
    });

    root.querySelectorAll('.route-header h1').forEach(node => {
      if (/question checkpoint/i.test(node.textContent)) {
        setText(node, `${data.quiz.length}-question checkpoint`);
      }
    });

    root.querySelectorAll('.route-header p').forEach(node => {
      if (/original questions/i.test(node.textContent)) {
        setText(node, `${data.practice.length} original questions are balanced across four levels. Work is saved locally on this device.`);
      } else if (/original tasks per lesson/i.test(node.textContent)) {
        setText(node, `${data.exam.length} original extended-response tasks. Use command terms, show technology transparently and interpret every contextual result.`);
      } else if (/questions are distinct from practice studio/i.test(node.textContent)) {
        setText(node, `Suggested time: 25 minutes. All ${data.quiz.length} questions are distinct from Practice Studio.`);
      }
    });
  }

  document.documentElement.classList.add('echs-unit1-v4', 'unit1-lesson-1-1');
  const observer = new MutationObserver(() => patchRouteText(document));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => patchRouteText(document), { once: true });
})();
