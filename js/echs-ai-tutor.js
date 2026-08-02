(() => {
  const cfg = window.ECHS_AI_TUTOR_CONFIG || {};
  if (!cfg.enabled || !cfg.endpoint) return;

  const state = { history: [], busy: false };
  const context = () => ({
    course: document.querySelector('[data-course-title], .courseTitle, h1')?.textContent?.trim() || document.title,
    lesson: document.querySelector('[data-lesson-title], .lessonTitle, h2')?.textContent?.trim() || document.title,
    objectives: [...document.querySelectorAll('[data-learning-objective], .learningObjective li')]
      .slice(0, 6).map((el) => el.textContent.trim()).filter(Boolean),
    page: location.pathname,
  });

  const root = document.createElement('section');
  root.className = 'echsAiTutor';
  root.innerHTML = `
    <button class="echsAiTutor__launcher" type="button" aria-expanded="false" aria-controls="echsAiTutorPanel">
      <span aria-hidden="true">∫</span><b>${cfg.title || 'ECHS Math Tutor'}</b>
    </button>
    <div class="echsAiTutor__panel" id="echsAiTutorPanel" hidden>
      <header><div><small>Learning support</small><strong>${cfg.title || 'ECHS Math Tutor'}</strong></div><button type="button" data-close aria-label="Close">×</button></header>
      <div class="echsAiTutor__messages" role="log" aria-live="polite"></div>
      <form><label for="echsAiTutorInput">Ask about this lesson</label><textarea id="echsAiTutorInput" rows="3" maxlength="1800" placeholder="اكتب سؤالك الرياضي هنا…" required></textarea><div><small>AI can make mistakes. Verify important mathematics.</small><button type="submit">Send</button></div></form>
    </div>`;
  document.body.appendChild(root);

  const launcher = root.querySelector('.echsAiTutor__launcher');
  const panel = root.querySelector('.echsAiTutor__panel');
  const close = root.querySelector('[data-close]');
  const messages = root.querySelector('.echsAiTutor__messages');
  const form = root.querySelector('form');
  const input = root.querySelector('textarea');
  const send = form.querySelector('button[type="submit"]');

  function add(role, text) {
    const item = document.createElement('article');
    item.className = `echsAiTutor__message is-${role}`;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    if (window.renderMathInElement) {
      window.renderMathInElement(item, { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }], throwOnError: false });
    }
  }

  add('assistant', cfg.welcome || 'Ask me about the current mathematics lesson.');
  const toggle = (open) => { panel.hidden = !open; launcher.setAttribute('aria-expanded', String(open)); if (open) input.focus(); };
  launcher.addEventListener('click', () => toggle(panel.hidden));
  close.addEventListener('click', () => toggle(false));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy) return;
    const message = input.value.trim();
    if (!message) return;
    add('user', message);
    input.value = '';
    state.busy = true;
    send.disabled = true;
    send.textContent = 'Thinking…';
    try {
      const response = await fetch(cfg.endpoint, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, history: state.history, context: context() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Tutor request failed');
      add('assistant', data.answer);
      state.history.push({ role: 'user', content: message }, { role: 'assistant', content: data.answer });
      state.history = state.history.slice(-(cfg.maxHistoryMessages || 8));
    } catch (error) {
      add('assistant', error.message || 'The tutor is temporarily unavailable.');
    } finally {
      state.busy = false;
      send.disabled = false;
      send.textContent = 'Send';
    }
  });
})();
