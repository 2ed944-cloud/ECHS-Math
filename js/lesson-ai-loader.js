(() => {
  "use strict";
  if (window.__ECHS_AI_TUTOR_LOADING__) return;
  window.__ECHS_AI_TUTOR_LOADING__ = true;

  const script = document.currentScript;
  const root = script ? new URL("../", script.src) : new URL("/ECHS-Math/", location.origin);
  const version = "20260802-tutorpro3";

  const ensureStyle = () => {
    if (document.querySelector('link[data-echs-ai-tutor]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(`css/echs-ai-tutor.css?v=${version}`, root).href;
    link.dataset.echsAiTutor = "1";
    document.head.append(link);
  };

  const loadScript = (path) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-echs-ai-src="${path}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const node = document.createElement("script");
    node.src = new URL(`${path}?v=${version}`, root).href;
    node.dataset.echsAiSrc = path;
    node.addEventListener("load", () => { node.dataset.loaded = "1"; resolve(); }, { once: true });
    node.addEventListener("error", reject, { once: true });
    document.head.append(node);
  });

  ensureStyle();
  loadScript("js/echs-ai-tutor-config.js")
    .then(() => loadScript("js/echs-ai-tutor.js"))
    .catch((error) => console.error("Could not load ECHS Math Tutor in lesson", error));
})();
