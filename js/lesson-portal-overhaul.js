/* ECHS Lesson Portal — calm lesson-first workspace and accessible details drawer. */
(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let activeCard = null;
  let activeOpener = null;
  let drawerStateWasPushed = false;
  let closingFromHistory = false;
  let updateQueued = false;

  function prepareWorkspace() {
    document.body.classList.add("lessonPortalCalm");
    qs("#courses")?.classList.add("lessonWorkspace");
    let intro = qs(".sectionIntro[data-auth-content]") || qs(".previewPortal .sectionIntro");
    if (!intro && qs("#tabs")) {
      intro = document.createElement("div");
      intro.className = "sectionIntro calmSectionIntro";
      intro.innerHTML = '<span class="sectionEyebrow">Lesson Portal</span><h1 class="sectionTitle">My lessons</h1><p class="sectionSub">Choose a course, open a unit and select a lesson.</p>';
      qs("#tabs").before(intro);
    }
    if (intro) {
      intro.classList.add("calmSectionIntro");
      const eyebrow = qs(".sectionEyebrow", intro);
      const title = qs(".sectionTitle", intro);
      const copy = qs(".sectionSub", intro);
      if (eyebrow) eyebrow.textContent = "Lesson Portal";
      if (title) title.textContent = "My lessons";
      if (copy) copy.textContent = "Choose a course, then select a lesson to see its objectives and resources.";
    }
    let identity = qs(".calmIdentityBanner");
    if (!identity && intro) {
      identity = document.createElement("section");
      identity.className = "calmIdentityBanner";
      identity.setAttribute("data-auth-content", "");
      identity.setAttribute("aria-labelledby", "calmIdentityTitle");
      identity.innerHTML = `
        <div class="calmIdentityCopy">
          <span class="calmIdentityEyebrow"><i aria-hidden="true"></i>ECHS Mathematics · Lesson Portal</span>
          <h1 id="calmIdentityTitle"><span>Learn with purpose.</span> <em>Master with confidence.</em></h1>
          <p>Focused lessons, evidence-led practice, and verified mastery—one clear learning journey.</p>
        </div>
        <div class="calmIdentityCycle" aria-label="Learning cycle: learn, practise, master">
          <span class="active"><b>01</b><small>Learn</small></span>
          <i aria-hidden="true"></i>
          <span><b>02</b><small>Practise</small></span>
          <i aria-hidden="true"></i>
          <span><b>03</b><small>Master</small></span>
        </div>`;
      intro.before(identity);
    }
    if (identity) document.body.classList.add("hasCalmIdentity");
    let smartRoute = qs("#smartRoute-lessons");
    if (!smartRoute && intro) {
      smartRoute = document.createElement("section");
      smartRoute.id = "smartRoute-lessons";
      smartRoute.className = "slrShell slrLessons";
      smartRoute.setAttribute("data-auth-content", "");
      smartRoute.setAttribute("aria-label", "ECHS Smart Learning Route");
      smartRoute.setAttribute("aria-live", "polite");
      smartRoute.innerHTML = `
        <div class="slrBody">
          <article class="slrDecision">
            <div class="slrDecisionTop">
              <span class="slrPathBadge core"><i aria-hidden="true">→</i>Core route</span>
              <span class="slrMiniRoute" aria-label="Available routes: Support, Core, Challenge"><span>Support</span><span class="active">Core</span><span>Challenge</span></span>
            </div>
            <span class="slrDecisionLabel">ECHS Smart Learning Route</span>
            <h3>Preparing your next evidence-led step…</h3>
            <div class="slrActions"><a class="slrAction primary" href="#courses">Open lessons <b aria-hidden="true">→</b></a></div>
          </article>
        </div>`;
      intro.after(smartRoute);
    }
  }

  function statusFor(card) {
    const score = Number(card.dataset.score || 0);
    const completed = card.dataset.completed === "true";
    const ready = card.dataset.ready === "true";
    if (score >= 80) return { label: "Mastered", css: "mastered", icon: "★" };
    if (completed) return { label: "Completed", css: "complete", icon: "✓" };
    if (score > 0) return { label: "In progress", css: "progress", icon: "◐" };
    if (ready) return { label: "Ready", css: "ready", icon: "●" };
    return { label: "Coming soon", css: "locked", icon: "○" };
  }

  function enhanceLegacyCard(card) {
    if (qs(".lessonCardOpen", card)) return;
    const title = qs("h4", card)?.textContent?.trim() || "Lesson";
    const number = qs(".lessonNo", card)?.textContent?.trim() || "—";
    const courseTitle = qs("#courseHero h2")?.textContent?.trim() || "Current course";
    const unit = card.closest(".unit");
    const unitTitle = qs(".unitHeading strong", unit)?.textContent?.trim() || "Current unit";
    const unitIndex = unit?.dataset.unitIndex || "0";
    const key = card.dataset.key || `${courseTitle}::${unitIndex}::${number}::${title}`;
    const payload = document.createElement("div");
    payload.className = "lessonPayload";
    payload.hidden = true;
    while (card.firstChild) payload.append(card.firstChild);
    const status = statusFor(card);
    const button = document.createElement("button");
    button.className = "lessonCardOpen";
    button.type = "button";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-label", `View details for ${number} ${title}`);
    button.innerHTML = `<span class="lessonCardNumber"></span><span class="lessonCardCopy"><strong></strong></span><span class="lessonCardStatus ${status.css}"><i aria-hidden="true">${status.icon}</i>${status.label}</span><span class="lessonCardChevron" aria-hidden="true">›</span>`;
    qs(".lessonCardNumber", button).textContent = number;
    qs(".lessonCardCopy strong", button).textContent = title;
    card.dataset.key = key;
    card.dataset.number = number;
    card.dataset.title = title;
    card.dataset.courseTitle = courseTitle;
    card.dataset.unitTitle = unitTitle;
    card.prepend(button);
    card.append(payload);
  }

  function enhanceCard(card) {
    if (card.dataset.calmEnhanced === "1") return;
    enhanceLegacyCard(card);
    card.dataset.calmEnhanced = "1";
  }

  function enhanceUnit(unit) {
    const cards = qsa(":scope .lesson", unit);
    cards.forEach(enhanceCard);
    if (!cards.length) return;
    const completed = cards.filter((card) => card.dataset.completed === "true").length;
    const metric = qs(".unitMetrics", unit);
    const signature = `${completed}|${cards.length}`;
    if (metric && !metric.hasAttribute("data-portal-metric") && metric.dataset.calmMetric !== signature) {
      metric.dataset.calmMetric = signature;
      metric.innerHTML = `<b>${completed}/${cards.length}</b><small>completed</small>`;
    }
  }

  function ensureDrawer() {
    let drawer = qs("#lessonDetailDialog");
    if (drawer) return drawer;
    drawer = document.createElement("dialog");
    drawer.id = "lessonDetailDialog";
    drawer.className = "lessonDetailDialog";
    drawer.setAttribute("aria-labelledby", "lessonDrawerTitle");
    drawer.innerHTML = `
      <aside class="lessonDrawerSurface">
        <header class="lessonDrawerHeader">
          <div class="lessonDrawerHeading">
            <span class="lessonDrawerEyebrow" id="lessonDrawerEyebrow">Lesson details</span>
            <div class="lessonDrawerTitleRow"><span id="lessonDrawerNumber">—</span><h2 id="lessonDrawerTitle">Lesson</h2></div>
            <span class="lessonCardStatus ready" id="lessonDrawerStatus"><i aria-hidden="true">●</i>Ready</span>
          </div>
          <button class="lessonDrawerClose" type="button" aria-label="Close lesson details">×</button>
        </header>
        <div class="lessonDrawerBody" id="lessonDrawerBody"></div>
      </aside>`;
    document.body.append(drawer);
    qs(".lessonDrawerClose", drawer).addEventListener("click", requestClose);
    drawer.addEventListener("cancel", (event) => {
      event.preventDefault();
      requestClose();
    });
    drawer.addEventListener("click", (event) => {
      if (event.target === drawer) requestClose();
    });
    drawer.addEventListener("close", () => {
      document.documentElement.classList.remove("lessonDrawerOpen");
      if (activeOpener?.isConnected) activeOpener.focus({ preventScroll: true });
      activeCard = null;
      activeOpener = null;
    });
    return drawer;
  }

  function cleanDrawerPayload(card) {
    const payload = qs(".lessonPayload", card)?.cloneNode(true);
    if (!payload) return document.createDocumentFragment();
    payload.hidden = false;
    payload.removeAttribute("hidden");
    qsa(".lessonTop, .lessonStateRow, .completeBtn", payload).forEach((node) => node.remove());
    qsa("details", payload).forEach((details) => {
      const fragment = document.createDocumentFragment();
      qsa(":scope > :not(summary)", details).forEach((node) => fragment.append(node));
      details.replaceWith(fragment);
    });
    return payload;
  }

  function setDrawerURL(card, push) {
    if (!card?.dataset.key) return;
    const url = new URL(location.href);
    url.searchParams.set("lesson", card.dataset.key);
    if (card.dataset.courseId) url.searchParams.set("course", card.dataset.courseId);
    if (push) {
      history.pushState({ lessonDrawer: true }, "", url);
      drawerStateWasPushed = true;
    } else {
      history.replaceState(history.state, "", url);
    }
  }

  function openDrawer(card, { pushHistory = true } = {}) {
    if (!card) return;
    enhanceCard(card);
    const drawer = ensureDrawer();
    const status = statusFor(card);
    const number = card.dataset.number || qs(".lessonCardNumber", card)?.textContent?.trim() || "—";
    const title = card.dataset.title || qs(".lessonCardCopy strong", card)?.textContent?.trim() || "Lesson";
    const course = card.dataset.courseTitle || qs("#courseHero h2")?.textContent?.trim() || "Current course";
    const unit = card.dataset.unitTitle || qs(".unitHeading strong", card.closest(".unit"))?.textContent?.trim() || "Current unit";
    qs("#lessonDrawerEyebrow", drawer).textContent = `${course} · ${unit}`;
    qs("#lessonDrawerNumber", drawer).textContent = number;
    qs("#lessonDrawerTitle", drawer).textContent = title;
    const statusNode = qs("#lessonDrawerStatus", drawer);
    statusNode.className = `lessonCardStatus ${status.css}`;
    statusNode.innerHTML = `<i aria-hidden="true">${status.icon}</i>${status.label}`;
    const body = qs("#lessonDrawerBody", drawer);
    body.replaceChildren(cleanDrawerPayload(card));
    activeCard = card;
    activeOpener = qs(".lessonCardOpen", card);
    const unitContainer = card.closest(".unit");
    if (unitContainer) {
      unitContainer.classList.add("open");
      qs(".unitHeader", unitContainer)?.setAttribute("aria-expanded", "true");
      const unitBody = qs(".unitBody", unitContainer);
      if (unitBody) unitBody.hidden = false;
    }
    if (!drawer.open) drawer.showModal();
    document.documentElement.classList.add("lessonDrawerOpen");
    requestAnimationFrame(() => qs(".lessonDrawerClose", drawer)?.focus({ preventScroll: true }));
    if (pushHistory) setDrawerURL(card, true);
  }

  function removeDrawerURL() {
    const url = new URL(location.href);
    url.searchParams.delete("lesson");
    history.replaceState(history.state, "", url);
  }

  function requestClose() {
    const drawer = qs("#lessonDetailDialog");
    if (!drawer?.open) return;
    if (drawerStateWasPushed && !closingFromHistory) {
      drawerStateWasPushed = false;
      history.back();
      return;
    }
    removeDrawerURL();
    drawer.close();
  }

  function syncFromURL() {
    const key = new URL(location.href).searchParams.get("lesson");
    const drawer = qs("#lessonDetailDialog");
    if (!key) {
      if (drawer?.open) {
        closingFromHistory = true;
        drawerStateWasPushed = false;
        drawer.close();
        closingFromHistory = false;
      }
      return;
    }
    const card = qsa("#units .lesson").find((row) => row.dataset.key === key);
    if (card && (!drawer?.open || activeCard !== card)) openDrawer(card, { pushHistory: false });
  }

  function update() {
    updateQueued = false;
    qsa("#units .unit").forEach(enhanceUnit);
    syncFromURL();
  }

  function queueUpdate() {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(update);
  }

  function start() {
    prepareWorkspace();
    ensureDrawer();
    const units = qs("#units");
    if (units) new MutationObserver(queueUpdate).observe(units, { childList: true, subtree: true });
    document.addEventListener("click", (event) => {
      const opener = event.target.closest(".lessonCardOpen");
      if (opener) {
        event.preventDefault();
        openDrawer(opener.closest(".lesson"));
        return;
      }
      const lockedPractice = event.target.closest('.lessonDetailDialog .lessonPracticeBtn[aria-disabled="true"]');
      if (lockedPractice) {
        event.preventDefault();
        return;
      }
      const bookmark = event.target.closest(".lessonDetailDialog [data-action=bookmark]");
      if (bookmark) {
        event.preventDefault();
        const original = qsa('#units [data-action="bookmark"]').find((button) => button.dataset.key === bookmark.dataset.key);
        if (original) {
          original.click();
          bookmark.className = original.className;
          bookmark.textContent = original.textContent;
          bookmark.setAttribute("aria-label", original.getAttribute("aria-label"));
          bookmark.setAttribute("aria-pressed", original.getAttribute("aria-pressed"));
        }
      }
    });
    window.addEventListener("popstate", syncFromURL);
    update();
    setTimeout(queueUpdate, 250);
    setTimeout(queueUpdate, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
