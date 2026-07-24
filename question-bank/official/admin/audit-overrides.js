/* Admin-only independently verified question overlay.
   The canonical IDs and provenance remain unchanged. This layer applies audited
   corrections in Teacher Studio without promoting rights-restricted content. */
(function () {
  "use strict";
  if (!window.ECHS_ADMIN_MODE || !window.ECHSOfficial) return;

  const url = window.ECHS_AUDIT_OVERRIDES_URL || "../data/admin-audit-overrides.json";
  let loaded = false;
  let loading = null;
  const overrides = new Map();

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function merge(base, patch) {
    const out = isObject(base) ? { ...base } : {};
    for (const [key, value] of Object.entries(patch || {})) {
      if (key === "partsPatches") continue;
      if (isObject(value)) out[key] = merge(out[key], value);
      else out[key] = value;
    }
    if (Array.isArray(patch?.partsPatches)) {
      const byLabel = new Map(patch.partsPatches.map(row => [String(row.label), row]));
      out.parts = (Array.isArray(base?.parts) ? base.parts : []).map(part => {
        const partPatch = byLabel.get(String(part.label));
        return partPatch ? merge(part, partPatch) : part;
      });
    }
    return out;
  }

  async function load() {
    if (loaded) return;
    if (loading) return loading;
    loading = (async () => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load admin audit overrides (${response.status})`);
      const payload = await response.json();
      for (const row of payload.records || []) {
        if (row?.id) overrides.set(String(row.id), row);
      }
      loaded = true;
    })();
    return loading;
  }

  const originalInit = ECHSOfficial.init.bind(ECHSOfficial);
  const originalQuestion = ECHSOfficial.question.bind(ECHSOfficial);
  const originalQuestions = ECHSOfficial.questions.bind(ECHSOfficial);

  ECHSOfficial.question = async function (id) {
    await load();
    const question = await originalQuestion(id);
    const patch = overrides.get(String(id));
    return question && patch ? merge(question, patch) : question;
  };

  ECHSOfficial.questions = async function (ids) {
    await load();
    const questions = await originalQuestions(ids);
    return questions.map(question => {
      const patch = overrides.get(String(question.id));
      return patch ? merge(question, patch) : question;
    });
  };

  ECHSOfficial.init = async function () {
    await originalInit();
    await load();
    if (overrides.size) {
      const positions = new Map(this.index.map((row, index) => [row.id, index]));
      for (const id of overrides.keys()) {
        const question = await ECHSOfficial.question(id);
        if (!question) continue;
        const row = this.indexRowFromQuestion(question);
        const index = positions.get(id);
        if (index === undefined) this.index.push(row);
        else this.index[index] = row;
      }
      this.recalcCatalog();
    }
    return this;
  };

  window.ECHS_AUDIT_OVERRIDE_STATE = {
    get loaded() { return loaded; },
    get count() { return overrides.size; },
    url
  };
})();
