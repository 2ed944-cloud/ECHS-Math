(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  const storageKey = 'echs:ib-ai:u1:1.1:exam-task-index';
  let scheduled = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const text = value => String(value ?? '').trim();
  const savedIndex = () => {
    try { return Number(localStorage.getItem(storageKey) || 0); }
    catch { return 0; }
  };
  const saveIndex = value => {
    try { localStorage.setItem(storageKey, String(value)); }
    catch { /* local persistence is optional */ }
  };

  function taskMarks(task) {
    const chips = [...task.querySelectorAll('.task-meta>span')];
    const marksChip = chips.find(node => /\bmarks?\b/i.test(node.textContent));
    const match = marksChip?.textContent.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function taskTitle(task, index) {
    return text(task.querySelector('h2')?.textContent) || `Task ${index + 1}`;
  }

  function scrollAssessmentTop(page) {
    const shell = page.closest('.app-shell');
    if (shell) shell.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function enhanceExam() {
    const page = app.querySelector('.route-page');
    const tasks = [...app.querySelectorAll('.exam-task')];
    if (!page || !tasks.length || page.dataset.examPagerEnhanced === '1') return;

    page.dataset.examPagerEnhanced = '1';
    page.classList.add('exam-route', 'exam-route-paged');
    if (window.LESSON_DATA) window.LESSON_DATA.version = '5.2.1';

    const header = page.querySelector('.route-header');
    if (header) {
      header.classList.add('exam-route-header');
      const originalChildren = [...header.children];
      const copy = document.createElement('div');
      copy.className = 'exam-route-copy';
      originalChildren.forEach(node => copy.append(node));
      const description = copy.querySelector('p');
      if (description) {
        description.textContent = `${tasks.length} original extended-response tasks. Work on one task at a time, show complete reasoning, and interpret every contextual result.`;
      }
      const totalMarks = tasks.reduce((sum, task) => sum + taskMarks(task), 0);
      const partCount = tasks.reduce((sum, task) => sum + task.querySelectorAll('.exam-part').length, 0);
      const overview = document.createElement('div');
      overview.className = 'exam-overview';
      overview.innerHTML = `<span>${tasks.length} focused tasks</span><span>${partCount} response parts</span><span>${totalMarks} marks total</span>`;
      header.append(copy, overview);
    }

    const tabs = document.createElement('nav');
    tabs.className = 'exam-task-tabs';
    tabs.setAttribute('aria-label', 'IB assessment tasks');
    tabs.innerHTML = tasks.map((task, index) => {
      const marks = taskMarks(task);
      return `<button class="exam-task-tab" type="button" role="tab" data-exam-task-tab="${index}" aria-selected="false"><small>Task ${index + 1}</small><b>${taskTitle(task, index)}</b><span>${marks} marks</span></button>`;
    }).join('');
    header?.insertAdjacentElement('afterend', tabs);

    tasks.forEach((task, index) => {
      task.classList.add('exam-task-panel');
      task.dataset.examTaskIndex = String(index);
      task.setAttribute('role', 'tabpanel');

      const progress = document.createElement('div');
      progress.className = 'exam-task-progress';
      progress.innerHTML = `<b>Task ${index + 1} of ${tasks.length}</b><div class="exam-completion-track" aria-hidden="true"><span></span></div><span data-exam-completion>0 of ${task.querySelectorAll('.exam-part').length} parts started</span>`;
      task.prepend(progress);

      const context = [...task.children].find(node => node.tagName === 'P');
      context?.classList.add('exam-context');

      const parts = [...task.querySelectorAll(':scope > .exam-part')];
      if (parts.length) {
        const grid = document.createElement('div');
        grid.className = 'exam-parts-grid';
        task.insertBefore(grid, parts[0]);
        parts.forEach(part => {
          part.classList.add('exam-part-card');
          grid.append(part);
        });
      }

      const footer = document.createElement('div');
      footer.className = 'exam-task-footer-nav';
      footer.innerHTML = `<button class="secondary-btn" type="button" data-exam-previous ${index === 0 ? 'disabled' : ''}>Previous task</button><div><b>${taskTitle(task, index)}</b><span data-exam-footer-status>Responses are saved automatically on this device.</span></div><button class="primary-btn" type="button" data-exam-next ${index === tasks.length - 1 ? 'disabled' : ''}>Next task</button>`;
      task.append(footer);
    });

    const tabButtons = [...tabs.querySelectorAll('[data-exam-task-tab]')];
    let activeIndex = clamp(savedIndex(), 0, tasks.length - 1);

    function updateCompletion(task) {
      const fields = [...task.querySelectorAll('[data-exam-note]')];
      const started = fields.filter(field => text(field.value).length > 0).length;
      const total = fields.length;
      const percent = total ? (started / total) * 100 : 0;
      const track = task.querySelector('.exam-completion-track>span');
      if (track) track.style.width = `${percent}%`;
      const label = task.querySelector('[data-exam-completion]');
      if (label) label.textContent = `${started} of ${total} parts started`;
      const footerStatus = task.querySelector('[data-exam-footer-status]');
      if (footerStatus) footerStatus.textContent = started === total && total ? 'All response parts have been started.' : 'Responses are saved automatically on this device.';
    }

    function showTask(index, shouldScroll = true) {
      activeIndex = clamp(index, 0, tasks.length - 1);
      saveIndex(activeIndex);
      tasks.forEach((task, taskIndex) => {
        const active = taskIndex === activeIndex;
        task.hidden = !active;
        task.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      tabButtons.forEach((button, buttonIndex) => {
        const active = buttonIndex === activeIndex;
        button.setAttribute('aria-selected', active ? 'true' : 'false');
        button.tabIndex = active ? 0 : -1;
      });
      updateCompletion(tasks[activeIndex]);
      if (shouldScroll) scrollAssessmentTop(page);
    }

    tabButtons.forEach(button => button.addEventListener('click', () => showTask(Number(button.dataset.examTaskTab))));
    tasks.forEach((task, index) => {
      task.querySelector('[data-exam-previous]')?.addEventListener('click', () => showTask(index - 1));
      task.querySelector('[data-exam-next]')?.addEventListener('click', () => showTask(index + 1));
      task.querySelectorAll('[data-exam-note]').forEach(field => field.addEventListener('input', () => updateCompletion(task)));
      updateCompletion(task);
    });

    tabs.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = activeIndex;
      if (event.key === 'ArrowLeft') next -= 1;
      if (event.key === 'ArrowRight') next += 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tasks.length - 1;
      showTask(next);
      tabButtons[activeIndex]?.focus();
    });

    showTask(activeIndex, false);
  }

  function scheduleEnhancement() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhanceExam();
    });
  }

  new MutationObserver(scheduleEnhancement).observe(app, { childList: true, subtree: true });
  addEventListener('hashchange', scheduleEnhancement);
  scheduleEnhancement();
})();
