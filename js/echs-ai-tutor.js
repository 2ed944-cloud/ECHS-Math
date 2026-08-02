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

  const KATEX = {
    css: "https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css",
    cssIntegrity: "sha384-vlBdW0r3AcZO/HboRPznQNowvexd3fY8qHOWkBi5q7KGgqJ+F48+DceybYmrVbmB",
    script: "https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.js",
    scriptIntegrity: "sha384-AtrdNsnxl/75rvBneBVH7DtOvCxSVahR2zWqle1coBKd8DEmLoviqNeJSx64gNAs",
    autoRender: "https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/contrib/auto-render.min.js",
    autoRenderIntegrity: "sha384-bjyGPfbij8/NDKJhSGZNP/khQVgtHUE5exjm4Ydllo42FwIgYsdLO2lXGmRBf5Mz",
  };

  const state = {
    history: [],
    busy: false,
    mode: MODES.some((item) => item.id === cfg.defaultMode) ? cfg.defaultMode : "guide",
    healthChecked: false,
    image: null,
  };

  let katexPromise = null;
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
    const mathBlocks = [];
    const protectedText = String(text ?? "").replace(/\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g, (block) => {
      const token = `ECHS_MATH_BLOCK_${mathBlocks.length}_TOKEN`;
      mathBlocks.push(block);
      return `\n${token}\n`;
    });

    const escaped = escapeHTML(protectedText).replace(/\r\n?/g, "\n");
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
      const mathToken = line.trim().match(/^ECHS_MATH_BLOCK_(\d+)_TOKEN$/);
      if (mathToken) {
        flushList();
        const block = mathBlocks[Number(mathToken[1])] || "";
        output.push(`<div class="echsAiTutor__mathSource">${escapeHTML(block)}</div>`);
        continue;
      }

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

  function loadScript(src, integrity) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((node) => node.src === src);
      if (existing) {
        if (existing.dataset.loaded === "1") resolve();
        else {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
        }
        return;
      }
      const node = document.createElement("script");
      node.src = src;
      node.crossOrigin = "anonymous";
      node.integrity = integrity;
      node.addEventListener("load", () => {
        node.dataset.loaded = "1";
        resolve();
      }, { once: true });
      node.addEventListener("error", reject, { once: true });
      document.head.append(node);
    });
  }

  function ensureKaTeX() {
    if (window.renderMathInElement && window.katex) return Promise.resolve();
    if (katexPromise) return katexPromise;

    const styleExists = [...document.styleSheets].some((sheet) => sheet.href === KATEX.css);
    if (!styleExists) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = KATEX.css;
      link.crossOrigin = "anonymous";
      link.integrity = KATEX.cssIntegrity;
      document.head.append(link);
    }

    katexPromise = loadScript(KATEX.script, KATEX.scriptIntegrity)
      .then(() => loadScript(KATEX.autoRender, KATEX.autoRenderIntegrity))
      .catch((error) => {
        katexPromise = null;
        console.warn("ECHS tutor could not load KaTeX", error);
        throw error;
      });
    return katexPromise;
  }

  function renderMath(element) {
    ensureKaTeX().then(() => {
      window.renderMathInElement(element, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
        strict: "ignore",
      });
    }).catch(() => {
      element.classList.add("katex-unavailable");
    });
  }

  function fileToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result || "")), { once: true });
      reader.addEventListener("error", reject, { once: true });
      reader.readAsDataURL(blob);
    });
  }

  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.addEventListener("load", () => {
        URL.revokeObjectURL(url);
        resolve(image);
      }, { once: true });
      image.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read the image."));
      }, { once: true });
      image.src = url;
    });
  }

  async function prepareImage(file) {
    const supported = ["image/png", "image/jpeg", "image/webp"];
    if (!supported.includes(file.type)) throw new Error("Use a PNG, JPEG, or WebP image.");

    const maxUploadBytes = Number(cfg.maxImageBytes || 4_000_000);
    const maxDimension = Number(cfg.maxImageDimension || 1600);
    if (file.size <= maxUploadBytes && file.size <= 1_800_000) {
      return { dataUrl: await fileToDataURL(file), mimeType: file.type, name: file.name, bytes: file.size };
    }

    const image = await loadImageElement(file);
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) throw new Error("Could not prepare the image.");
    if (blob.size > maxUploadBytes) throw new Error("The image is still too large. Crop it and try again.");
    return { dataUrl: await fileToDataURL(blob), mimeType: "image/webp", name: file.name, bytes: blob.size };
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
        <div class="echsAiTutor__imagePreview" data-image-preview hidden>
          <img alt="Selected mathematics image preview">
          <div><strong data-image-name></strong><small data-image-size></small></div>
          <button type="button" data-remove-image aria-label="Remove selected image">×</button>
        </div>
        <textarea
          id="echsAiTutorInput"
          rows="3"
          maxlength="${Number(cfg.maxMessageChars || 3000)}"
          placeholder="اكتب سؤالك الرياضي أو ألصق حلك هنا…"
        ></textarea>
        <div class="echsAiTutor__composerActions">
          <div class="echsAiTutor__inputTools">
            <label class="echsAiTutor__attach" title="Attach a mathematics image">
              <input type="file" accept="image/png,image/jpeg,image/webp" data-image-input>
              <span aria-hidden="true">▧</span><b>Image</b>
            </label>
            <small>PNG, JPEG or WebP · Ctrl + Enter to send</small>
          </div>
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
  const imageInput = root.querySelector("[data-image-input]");
  const imagePreview = root.querySelector("[data-image-preview]");
  const imagePreviewElement = imagePreview.querySelector("img");
  const imageName = imagePreview.querySelector("[data-image-name]");
  const imageSize = imagePreview.querySelector("[data-image-size]");
  const removeImageButton = imagePreview.querySelector("[data-remove-image]");

  function metadataHTML(meta) {
    if (!meta || (!meta.topic && !meta.mode && !meta.verified && !meta.imageUsed)) return "";
    const chips = [];
    if (meta.topic) chips.push(`<span>${escapeHTML(meta.topic)}</span>`);
    if (meta.mode) chips.push(`<span>${escapeHTML(meta.mode)}</span>`);
    if (meta.imageUsed) chips.push('<span class="is-image">▧ image read</span>');
    if (meta.verified) chips.push('<span class="is-verified">✓ reviewed</span>');
    if (meta.continued) chips.push("<span>complete response</span>");
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

  function addMessage(role, text, meta = null, imageDataUrl = "") {
    const item = document.createElement("article");
    item.className = `echsAiTutor__message is-${role}`;
    item.innerHTML = `
      ${imageDataUrl ? `<img class="echsAiTutor__messageImage" src="${imageDataUrl}" alt="Attached mathematics image">` : ""}
      <div class="echsAiTutor__messageBody">${safeMarkdown(text)}</div>
      ${role === "assistant" ? metadataHTML(meta) : ""}
      ${role === "assistant" && meta?.showActions !== false ? quickActionsHTML() : ""}
    `;
    messages.appendChild(item);
    if (role === "assistant") renderMath(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function updateImagePreview() {
    if (!state.image) {
      imagePreview.hidden = true;
      imagePreviewElement.removeAttribute("src");
      imageInput.value = "";
      return;
    }
    imagePreview.hidden = false;
    imagePreviewElement.src = state.image.dataUrl;
    imageName.textContent = state.image.name || "Mathematics image";
    imageSize.textContent = `${Math.max(1, Math.round(state.image.bytes / 1024))} KB · ready for analysis`;
  }

  function clearImage() {
    state.image = null;
    updateImagePreview();
  }

  function setMode(mode) {
    if (!MODES.some((item) => item.id === mode)) return;
    state.mode = mode;
    root.dataset.mode = mode;
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    const selected = MODES.find((item) => item.id === mode);
    status.textContent = `${selected.label} mode`;
    input.placeholder = mode === "check"
      ? "ألصق السؤال أو أرفق صورة ثم اكتب خطوات حلك…"
      : mode === "practice"
        ? "اكتب المهارة التي تريد سؤالًا مشابهًا عنها…"
        : "اكتب سؤالك أو أرفق صورة لمسألة رياضية…";
  }

  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    root.classList.toggle("is-open", open);
    if (open) {
      input.focus({ preventScroll: true });
      checkHealth();
      ensureKaTeX().catch(() => {});
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
      status.textContent = `Ready · v${data.version || "4"}${data.visionEnabled ? " · Vision" : ""}`;
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
    const image = state.image;
    const cleanMessage = message.trim();
    if (state.busy || (!cleanMessage && !image)) return;
    setMode(mode);
    addMessage("user", cleanMessage || "Analyze this mathematics image.", { showActions: false }, image?.dataUrl || "");
    input.value = "";
    state.busy = true;
    send.disabled = true;
    imageInput.disabled = true;
    sendText.textContent = image ? "Reading image…" : "Thinking…";
    status.textContent = image ? "Reading the mathematics image…" : "Checking the mathematics…";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(cfg.timeoutMs || 110_000));

    try {
      const response = await fetch(endpointURL(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-echs-client": "portal-tutor-v4",
        },
        body: JSON.stringify({
          message: cleanMessage,
          mode: state.mode,
          history: state.history,
          context: context(),
          image: image ? {
            dataUrl: image.dataUrl,
            mimeType: image.mimeType,
            name: image.name,
          } : null,
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
        continued: data.continued,
        imageUsed: data.imageUsed,
        fallbackUsed: data.fallbackUsed,
      });

      const historyMessage = cleanMessage || "[A mathematics image was attached and analyzed.]";
      state.history.push(
        { role: "user", content: historyMessage },
        { role: "assistant", content: data.answer },
      );
      state.history = state.history.slice(-(cfg.maxHistoryMessages || 10));
      status.textContent = data.verified ? "Answer reviewed" : "Ready";
      clearImage();
    } catch (error) {
      const timeoutMessage = error.name === "AbortError"
        ? "The tutor took too long to respond. Try a cropped image or a shorter question."
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
      imageInput.disabled = false;
      sendText.textContent = "Send";
      input.focus({ preventScroll: true });
    }
  }

  addMessage(
    "assistant",
    cfg.welcome || "Tell me what you are trying to understand. You can also attach a clear image of a problem, graph, table, or handwritten solution.",
    { showActions: false },
  );

  launcher.addEventListener("click", () => toggle(panel.hidden));
  closeButton.addEventListener("click", () => toggle(false));
  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  removeImageButton.addEventListener("click", clearImage);

  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    status.textContent = "Preparing image…";
    imageInput.disabled = true;
    try {
      state.image = await prepareImage(file);
      updateImagePreview();
      status.textContent = "Image ready";
    } catch (error) {
      clearImage();
      addMessage("assistant", error.message || "Could not attach this image.", { showActions: false });
      status.textContent = "Image rejected";
    } finally {
      imageInput.disabled = false;
    }
  });

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

  document.addEventListener("paste", async (event) => {
    if (!root.classList.contains("is-open") || state.busy) return;
    const imageItem = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    event.preventDefault();
    status.textContent = "Preparing pasted image…";
    try {
      state.image = await prepareImage(file);
      updateImagePreview();
      status.textContent = "Image ready";
    } catch (error) {
      addMessage("assistant", error.message || "Could not attach the pasted image.", { showActions: false });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) toggle(false);
  });

  setMode(state.mode);
})();
