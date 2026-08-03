(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  const taskStorageKey = 'echs:ib-ai:u1:1.1:exam-task-index';
  const partStoragePrefix = 'echs:ib-ai:u1:1.1:exam-part-index:';
  let scheduled = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const text = value => String(value ?? '').trim();
  const readNumber = (key, fallback = 0) => {
    try {
      const value = Number(localStorage.getItem(key));
      return Number.isFinite(value) ? value : fallback;
    } catch {
      return fallback;
    }
  };
  const saveNumber = (key, value) => {
    try { localStorage.setItem(key, String(value)); }
    catch { /* Local persistence is optional. */ }
  };

  function taskMarks(task) {
    const chips = [...task.querySelectorAll('.task-meta>span')];
    const marksChip = chips.find(node => /\bmarks?\b/i.test(node.textContent));
    const match = marksChip?.textContent.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function partMarks(part) {
    const match = part.querySelector('.marks')?.textContent.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function taskTitle(task, index) {
    return text(task.querySelector('h2')?.textContent) || `Task ${index + 1}`;
  }

  function partLabel(part, index) {
    const raw = text(part.querySelector(':scope>p>b')?.textContent).replace(/[()]/g, '');
    return raw || String.fromCharCode(97 + index);
  }

  function scrollToPart(task, smooth = true) {
    const target = task.querySelector('.exam-part-tabs') || task;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'start' });
  }

  function enhanceExam() {
    const page = app.querySelector('.route-page');
    const tasks = [...app.querySelectorAll('.exam-task')];
    const isExamRoute = Boolean(page && tasks.length);
    document.body.classList.toggle('exam-assessment-active', isExamRoute);
    if (!isExamRoute || page.dataset.examPagerEnhanced === '2') return;

    page.dataset.examPagerEnhanced = '2';
    page.classList.add('exam-route', 'exam-route-paged', 'exam-route-part-paged');
    if (window.LESSON_DATA) window.LESSON_DATA.version = '5.2.2';

    const header = page.querySelector('.route-header');
    if (header) {
      header.classList.add('exam-route-header');
      const originalChildren = [...header.children];
      const copy = document.createElement('div');
      copy.className = 'exam-route-copy';
      originalChildren.forEach(node => copy.append(node));
      const description = copy.querySelector('p');
      if (description) {
        description.textContent = `${tasks.length} original extended-response tasks. Select a task, then complete one response part at a time with full mathematical reasoning.`;
      }
      const totalMarks = tasks.reduce((sum, task) => sum + taskMarks(task), 0);
      const partCount = tasks.reduce((sum, task) => sum + task.querySelectorAll('.exam-part').length, 0);
      const overview = document.createElement('div');
      overview.className = 'exam-overview';
      overview.innerHTML = `<span>${tasks.length} focused tasks</span><span>${partCount} response parts</span><span>${totalMarks} marks total</span>`;
      header.append(copy, overview);
    }

    const taskTabs = document.createElement('nav');
    taskTabs.className = 'exam-task-tabs';
    taskTabs.setAttribute('aria-label', 'IB assessment tasks');
    taskTabs.innerHTML = tasks.map((task, index) => (
      `<button class="exam-task-tab" type="button" role="tab" data-exam-task-tab="${index}" aria-selected="false">` +
      `<small>Task ${index + 1}</small><b>${taskTitle(task, index)}</b><span>${taskMarks(task)} marks</span></button>`
    )).join('');
    header?.insertAdjacentElement('afterend', taskTabs);

    const taskParts = [];
    const partTabs = [];

    tasks.forEach((task, taskIndex) => {
      task.classList.add('exam-task-panel');
      task.dataset.examTaskIndex = String(taskIndex);
      task.setAttribute('role', 'tabpanel');

      const parts = [...task.querySelectorAll(':scope>.exam-part')];
      taskParts.push(parts);

      const progress = document.createElement('div');
      progress.className = 'exam-task-progress';
      progress.innerHTML = `<b>Task ${taskIndex + 1} of ${tasks.length}</b><div class="exam-completion-track" aria-hidden="true"><span></span></div><span data-exam-completion>0 of ${parts.length} parts started</span>`;
      task.prepend(progress);

      const meta = task.querySelector(':scope>.task-meta');
      const title = task.querySelector(':scope>h2');
      const context = [...task.children].find(node => node.tagName === 'P');
      const intro = document.createElement('div');
      intro.className = 'exam-task-intro';
      const identity = document.createElement('div');
      identity.className = 'exam-task-identity';
      if (meta) identity.append(meta);
      if (title) identity.append(title);
      if (context) context.classList.add('exam-context');
      intro.append(identity);
      if (context) intro.append(context);
      task.insertBefore(intro, parts[0] || null);

      const nav = document.createElement('nav');
      nav.className = 'exam-part-tabs';
      nav.setAttribute('aria-label', `${taskTitle(task, taskIndex)} response parts`);
      nav.innerHTML = parts.map((part, partIndex) => {
        const label = partLabel(part, partIndex);
        return `<button class="exam-part-tab" type="button" role="tab" data-exam-part-tab="${taskIndex}:${partIndex}" aria-selected="false"><small>Part (${label})</small><b>${partMarks(part)} ${partMarks(part) === 1 ? 'mark' : 'marks'}</b><span data-exam-part-state>Not started</span></button>`;
      }).join('');
      task.insertBefore(nav, parts[0] || null);
      partTabs.push([...nav.querySelectorAll('[data-exam-part-tab]')]);

      const stage = document.createElement('div');
      stage.className = 'exam-part-stage';
      task.insertBefore(stage, parts[0] || null);
      parts.forEach((part, partIndex) => {
        part.classList.add('exam-part-card');
        part.dataset.examPartIndex = String(partIndex);
        part.setAttribute('role', 'tabpanel');
        stage.append(part);
      });

      const footer = document.createElement('div');
      footer.className = 'exam-step-footer-nav';
      footer.innerHTML = `<button class="secondary-btn" type="button" data-exam-step-previous>Previous part</button><div><b data-exam-step-title>Part 1 of ${parts.length}</b><span data-exam-step-status>Responses are saved automatically on this device.</span></div><button class="primary-btn" type="button" data-exam-step-next>Next part</button>`;
      task.append(footer);
    });

    const taskTabButtons = [...taskTabs.querySelectorAll('[data-exam-task-tab]')];
    let activeTaskIndex = clamp(readNumber(taskStorageKey), 0, tasks.length - 1);
    let activePartIndex = 0;

    function partIsStarted(part) {
      return [...part.querySelectorAll('[data-exam-note]')].some(field => text(field.value).length > 0);
    }

    function updateCompletion(taskIndex) {
      const task = tasks[taskIndex];
      const parts = taskParts[taskIndex];
      const started = parts.filter(partIsStarted).length;
      const percent = parts.length ? (started / parts.length) * 100 : 0;
      const track = task.querySelector('.exam-completion-track>span');
      if (track) track.style.width = `${percent}%`;
      const label = task.querySelector('[data-exam-completion]');
      if (label) label.textContent = `${started} of ${parts.length} parts started`;
      partTabs[taskIndex].forEach((button, partIndex) => {
        const startedPart = partIsStarted(parts[partIndex]);
        button.classList.toggle('is-started', startedPart);
        const state = button.querySelector('[data-exam-part-state]');
        if (state) state.textContent = startedPart ? 'Response started' : 'Not started';
      });
    }

    function updateStepFooter() {
      const task = tasks[activeTaskIndex];
      const parts = taskParts[activeTaskIndex];
      const part = parts[activePartIndex];
      const previous = task.querySelector('[data-exam-step-previous]');
      const next = task.querySelector('[data-exam-step-next]');
      const title = task.querySelector('[data-exam-step-title]');
      const status = task.querySelector('[data-exam-step-status]');
      const atBeginning = activeTaskIndex === 0 && activePartIndex === 0;
      const atEnd = activeTaskIndex === tasks.length - 1 && activePartIndex === parts.length - 1;
      previous.disabled = atBeginning;
      next.disabled = atEnd;
      previous.textContent = activePartIndex === 0 && activeTaskIndex > 0 ? 'Previous task' : 'Previous part';
      next.textContent = activePartIndex === parts.length - 1 && activeTaskIndex < tasks.length - 1 ? 'Next task' : (atEnd ? 'Assessment complete' : 'Next part');
      const label = partLabel(part, activePartIndex);
      if (title) title.textContent = `Part (${label}) · ${activePartIndex + 1} of ${parts.length}`;
      if (status) status.textContent = partIsStarted(part) ? 'This response is saved automatically.' : 'Write a complete response before revealing the markscheme.';
    }

    function showTaskPart(taskIndex, partIndex, shouldScroll = true) {
      activeTaskIndex = clamp(taskIndex, 0, tasks.length - 1);
      const parts = taskParts[activeTaskIndex];
      activePartIndex = clamp(partIndex, 0, parts.length - 1);
      saveNumber(taskStorageKey, activeTaskIndex);
      saveNumber(`${partStoragePrefix}${activeTaskIndex}`, activePartIndex);

      tasks.forEach((task, index) => {
        const active = index === activeTaskIndex;
        task.hidden = !active;
        task.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      taskTabButtons.forEach((button, index) => {
        const active = index === activeTaskIndex;
        button.setAttribute('aria-selected', active ? 'true' : 'false');
        button.tabIndex = active ? 0 : -1;
      });
      taskParts.forEach((partsForTask, taskIndexValue) => {
        partsForTask.forEach((part, partIndexValue) => {
          const active = taskIndexValue === activeTaskIndex && partIndexValue === activePartIndex;
          part.hidden = !active;
          part.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
        partTabs[taskIndexValue].forEach((button, partIndexValue) => {
          const active = taskIndexValue === activeTaskIndex && partIndexValue === activePartIndex;
          button.setAttribute('aria-selected', active ? 'true' : 'false');
          button.tabIndex = active ? 0 : -1;
        });
      });

      updateCompletion(activeTaskIndex);
      updateStepFooter();
      if (shouldScroll) scrollToPart(tasks[activeTaskIndex]);
    }

    function openTask(index, shouldScroll = true) {
      const taskIndex = clamp(index, 0, tasks.length - 1);
      const savedPart = clamp(readNumber(`${partStoragePrefix}${taskIndex}`), 0, taskParts[taskIndex].length - 1);
      showTaskPart(taskIndex, savedPart, shouldScroll);
    }

    function moveStep(direction) {
      let taskIndex = activeTaskIndex;
      let partIndex = activePartIndex + direction;
      if (direction > 0 && partIndex >= taskParts[taskIndex].length) {
        if (taskIndex >= tasks.length - 1) return;
        taskIndex += 1;
        partIndex = 0;
      }
      if (direction < 0 && partIndex < 0) {
        if (taskIndex <= 0) return;
        taskIndex -= 1;
        partIndex = taskParts[taskIndex].length - 1;
      }
      showTaskPart(taskIndex, partIndex);
    }

    taskTabButtons.forEach(button => button.addEventListener('click', () => openTask(Number(button.dataset.examTaskTab))));
    partTabs.forEach((buttons, taskIndex) => {
      buttons.forEach(button => button.addEventListener('click', () => {
        const [, partIndex] = button.dataset.examPartTab.split(':').map(Number);
        showTaskPart(taskIndex, partIndex);
      }));
      buttons[0]?.parentElement?.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = activePartIndex;
        if (event.key === 'ArrowLeft') next -= 1;
        if (event.key === 'ArrowRight') next += 1;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = taskParts[taskIndex].length - 1;
        showTaskPart(taskIndex, next);
        partTabs[taskIndex][activePartIndex]?.focus();
      });
    });

    tasks.forEach((task, taskIndex) => {
      task.querySelector('[data-exam-step-previous]')?.addEventListener('click', () => moveStep(-1));
      task.querySelector('[data-exam-step-next]')?.addEventListener('click', () => moveStep(1));
      task.querySelectorAll('[data-exam-note]').forEach(field => field.addEventListener('input', () => {
        updateCompletion(taskIndex);
        if (taskIndex === activeTaskIndex) updateStepFooter();
      }));
      updateCompletion(taskIndex);
    });

    taskTabs.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = activeTaskIndex;
      if (event.key === 'ArrowLeft') next -= 1;
      if (event.key === 'ArrowRight') next += 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tasks.length - 1;
      openTask(next);
      taskTabButtons[activeTaskIndex]?.focus();
    });

    openTask(activeTaskIndex, false);
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
