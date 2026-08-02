(() => {
  "use strict";

  const cfg = window.ECHS_AI_TUTOR_CONFIG || {};
  if (!cfg.enabled || !cfg.endpoint || document.querySelector(".echsAiTutor")) return;

  const MODES = [
    { id: "hint", label: "Hint", ar: "تلميح", icon: "◌" },
    { id: "guide", label: "Guide me", ar: "وجّهني", icon: "→" },
    { id: "explain", label: "Full explanation", ar: "شرح كامل", icon: "∫" },
    { id: "check", label: "Check my work", ar: "تحقق من حلي", icon: "✓" },
    { id: "alternative", label: "Another method", ar: "طريقة أخرى", icon: "⇄" },
    { id: "practice", label: "Similar practice", ar: "تدريب مشابه", icon: "✦" },
  ];

  const state = {
    history: [],
    busy: false,
    mode: MODES.some((item) => item.id === cfg.defaultMode) ? cfg.defaultMode : "guide",
    healthChecked: false,
  };

  const getURLParam = (name) => new URLSearchParams(location.search).get(name) || "";

  function textFrom(selectors) {
    for (const selector of selectors) {
      const value = document.querySelector(selector)?.textContent?.trim();
      if (value) return value;
    }
    return "";
  }

  function context() {
    const course = getURLParam("course")
      || document.querySelector('meta[name="echs-course"]')?.content
      || document.documentElement.dataset.echsLessonCourse
      || textFrom(["[data-course-title]", ".courseTitle", ".topbar h1", "header h1"])
      || document.title;

    const lesson = getURLParam("title")
      || document.documentElement.dataset.echsLessonTitle
      || textFrom(["[data-lesson-title]", ".lessonTitle", ".deck-title", ".title-slide h1", "main h1", "h1"])
      || document.title;

    const objectives = [
      ...document.querySelectorAll(
        "[data-learning-objective], .learningObjective li, .learning-objectives li, .objectives li, [data-objective]",
      ),
    ]
      .slice(0, 8)
      .map((element) => element.textContent.trim())
      .filter(Boolean);

    return {
      course,
      lesson,
      unit: getURLParam("unit") || textFrom(["[data-unit-title]", ".unitTitle"]),
      topic: getURLParam("topic") || textFrom(["[data-topic-title]", ".topicTitle"]),
      objectives,
      page: location.pathname,
    };
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character]));
  }

  function inlineMarkup(value) {
    return value
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  }

  function safeMarkdown(text) {
    const escaped = escapeHTML(text).replace(/\r\n?/g, "\n");
    const lines = escaped.split("\n");
    const output = [];
    let list = [];

    const flushList = () => {
      if (!list.length) return;
      output.push(`<ul>${list.map((item) => `<li>${inlineMarkup(item)}</li>`).join("")}</ul>`);
      list = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const bullet = line.match(/^\s*[-•]\s+(.+)/);
      if (bullet) {
        list.push(bullet[1]);
        continue;
      }

      flushList();

      if (!line.trim()) {
        output.push("");
      } else if (/^###\s+/.test(line)) {
        output.push(`<h4>${inlineMarkup(line.replace(/^###\s+/, ""))}</h4>`);
      } else if (/^##\s+/.test(line)) {
        output.push(`<h3>${inlineMarkup(line.replace(/^##\s+/, ""))}</h3>`);
      } else if (/^#\s+/.test(line)) {
        output.push(`<h3>${inlineMarkup(line.replace(/^#\s+/, ""))}</h3>`);
      } else {
        output.push(`<p>${inlineMarkup(line)}</p>`);
      }
    }

    flushList();
    return output.join("");
  }

  const root = document.createElement("section");
  root.className = "echsAiTutor";
  root.dataset.mode = state.mode;
  root.innerHTML = `
    <button class="echsAiTutor__launcher" type="button" aria-expanded="false" aria-controls="echsAiTutorPanel">
      <span aria-hidden="true">∫</span>
      <b>${escapeHTML(cfg.title || "ECHS Math Tutor")}</b>
    </button>
    <div class="echsAiTutor__panel" id="echsAiTutorPanel" hidden>
      <header class="echsAiTutor__header">
        <div>
          <small>Professional mathematics support</small>
          <strong>${escapeHTML(cfg.title || "ECHS Math Tutor")}</strong>
          <span class="echsAiTutor__status" data-status>Ready</span>
        </div>
        <button type="button" data-close aria-label="Close tutor">×</button>
      </header>

      <div class="echsAiTutor__modes" role="toolbar" aria-label="Tutor mode">
        ${MODES.map((mode) => `
          <button type="button" data-mode="${mode.id}" aria-pressed="${String(mode.id === state.mode)}" title="${mode.label}">
            <span aria-hidden="true">${mode.icon}</span>
            <b>${mode.label}</b>
            <small>${mode.ar}</small>
          </button>
        `).join("")}
      </div>

      <div class="echsAiTutor__messages" role="log" aria-live="polite" aria-relevant="additions"></div>

      <form class="echsAiTutor__composer">
        <label for="echsAiTutorInput">Ask about this lesson</label>
        <textarea
          id="echsAiTutorInput"
          rows="3"
          maxlength="${Number(cfg.maxMessageChars || 3000)}"
          placeholder="اكتب سؤالك الرياضي أو ألصق حلك هنا…"
          required
        ></textarea>
        <div class="echsAiTutor__composerActions">
          <small>Ctrl + Enter to send · AI can make mistakes.</small>
          <button type="submit"><span>Send</span><i aria-hidden="true">→</i></button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(root);

  const launcher = root.querySelector(".echsAiTutor__launcher");
  const panel = root.querySelector(".echsAiTutor__panel");
  const closeButton = root.querySelector("[data-close]");
  const messages = root.querySelector(".echsAiTutor__messages");
  const form = root.querySelector("form");
  const input = root.querySelector("textarea");
  const send = form.querySelector('button[type="submit"]');
  const sendText = send.querySelector("span");
  const status = root.querySelector("[data-status]");
  const modeButtons = [...root.querySelectorAll("[data-mode]")];

  function renderMath(element) {
    if (!window.renderMathInElement) return;
    try {
      window.renderMathInElement(element, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    } catch (error) {
      console.warn("ECHS tutor math rendering failed", error);
    }
  }

  function metadataHTML(meta) {
    if (!meta || (!meta.topic && !meta.mode && !meta.verified)) return "";
    const chips = [];
    if (meta.topic) chips.push(`<span>${escapeHTML(meta.topic)}</span>`);
    if (meta.mode) chips.push(`<span>${escapeHTML(meta.mode)}</span>`);
    if (meta.verified) chips.push('<span class="is-verified">✓ reviewed</span>');
    if (meta.fallbackUsed) chips.push("<span>backup model</span>");
    return `<div class="echsAiTutor__meta">${chips.join("")}</div>`;
  }

  function quickActionsHTML() {
    return `
      <div class="echsAiTutor__quickActions" aria-label="Follow-up actions">
        <button type="button" data-followup-mode="hint">Give a hint</button>
        <button type="button" data-followup-mode="explain">Explain fully</button>
        <button type="button" data-followup-mode="alternative">Another method</button>
        <button type="button" data-followup-mode="practice">Similar problem</button>
      </div>`;
  }

  function addMessage(role, text, meta = null) {
    const item = document.createElement("article");
    item.className = `echsAiTutor__message is-${role}`;
    item.innerHTML = `
      <div class="echsAiTutor__messageBody">${safeMarkdown(text)}</div>
      ${role === "assistant" ? metadataHTML(meta) : ""}
      ${role === "assistant" && meta?.showActions !== false ? quickActionsHTML() : ""}
    `;
    messages.appendChild(item);
    renderMath(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function setMode(mode) {
    if (!MODES.some((item) => item.id === mode)) return;
    state.mode = mode;
    root.dataset.mode = mode;
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    const selected = MODES.find((item) => item.id === mode);
    status.textContent = `${selected.label} mode`;
    input.placeholder = mode === "check"
      ? "ألصق السؤال ثم اكتب خطوات حلك ليتم التحقق منها…"
      : mode === "practice"
        ? "اكتب المهارة التي تريد سؤالًا مشابهًا عنها…"
        : "اكتب سؤالك الرياضي هنا…";
  }

  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    root.classList.toggle("is-open", open);
    if (open) {
      input.focus({ preventScroll: true });
      checkHealth();
    }
  }

  async function checkHealth() {
    if (state.healthChecked) return;
    state.healthChecked = true;
    status.textContent = "Connecting…";
    try {
      const response = await fetch(cfg.endpoint, { method: "GET", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || data.aiBinding === false) throw new Error("Backend is not ready");
      status.textContent = `Ready · v${data.version || "3"}`;
    } catch {
      status.textContent = "Backend unavailable";
      state.healthChecked = false;
    }
  }

  function endpointURL() {
    try {
      return new URL("chat", cfg.endpoint.endsWith("/") ? cfg.endpoint : `${cfg.endpoint}/`).href;
    } catch {
      return cfg.endpoint;
    }
  }

  async function ask(message, mode = state.mode) {
    if (state.busy || !message.trim()) return;
    setMode(mode);
    addMessage("user", message, { showActions: false });
    input.value = "";
    state.busy = true;
    send.disabled = true;
    sendText.textContent = "Thinking…";
    status.textContent = "Checking the mathematics…";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(cfg.timeoutMs || 75_000));

    try {
      const response = await fetch(endpointURL(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-echs-client": "portal-tutor-v3",
        },
        body: JSON.stringify({
          message,
          mode: state.mode,
          history: state.history,
          context: context(),
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || "Tutor request failed.");
        error.code = data.code;
        error.requestId = data.requestId;
        throw error;
      }

      addMessage("assistant", data.answer, {
        topic: data.topic,
        mode: data.mode,
        verified: data.verified,
        fallbackUsed: data.fallbackUsed,
      });

      state.history.push(
        { role: "user", content: message },
        { role: "assistant", content: data.answer },
      );
      state.history = state.history.slice(-(cfg.maxHistoryMessages || 10));
      status.textContent = data.verified ? "Answer reviewed" : "Ready";
    } catch (error) {
      const timeoutMessage = error.name === "AbortError"
        ? "The tutor took too long to respond. Please try a shorter question."
        : error.message || "The tutor is temporarily unavailable.";
      addMessage("assistant", timeoutMessage, { showActions: false });
      status.textContent = error.code || "Connection error";
      console.warn("ECHS tutor request failed", {
        code: error.code,
        requestId: error.requestId,
        message: error.message,
      });
    } finally {
      clearTimeout(timeout);
      state.busy = false;
      send.disabled = false;
      sendText.textContent = "Send";
      input.focus({ preventScroll: true });
    }
  }

  addMessage(
    "assistant",
    cfg.welcome || "Tell me what you are trying to understand. Choose a mode above and I will help you carefully.",
    { showActions: false },
  );

  launcher.addEventListener("click", () => toggle(panel.hidden));
  closeButton.addEventListener("click", () => toggle(false));
  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

  root.addEventListener("click", (event) => {
    const followup = event.target.closest("[data-followup-mode]");
    if (!followup) return;
    const prompts = {
      hint: "Give me one more hint for the previous problem without revealing the final answer.",
      explain: "Explain the previous problem fully and verify the result.",
      alternative: "Show a different valid method for the previous problem and compare the methods.",
      practice: "Create one similar practice problem at the same level. Do not reveal the answer yet.",
    };
    const mode = followup.dataset.followupMode;
    ask(prompts[mode], mode);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value, state.mode);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) toggle(false);
  });

  setMode(state.mode);
})();
