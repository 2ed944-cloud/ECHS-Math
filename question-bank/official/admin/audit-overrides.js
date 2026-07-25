/* Admin-only independently verified question overlay.
   The canonical IDs and provenance remain unchanged. This layer applies audited
   corrections in Teacher Studio without promoting rights-restricted content. */
(function () {
  "use strict";
  if (!window.ECHS_ADMIN_MODE || !window.ECHSOfficial) return;

  const explicit = window.ECHS_AUDIT_OVERRIDES_URLS || [
    window.ECHS_AUDIT_OVERRIDES_URL || "../data/admin-audit-overrides.json",
    "../data/admin-audit-overrides-1970.json",
    "../data/admin-audit-overrides-1971-1975.json"
  ];
  const firstYear = Number(window.ECHS_AUDIT_FIRST_YEAR || 1976);
  const lastYear = Number(window.ECHS_AUDIT_LAST_YEAR || 2010);
  const partCount = Number(window.ECHS_AUDIT_PART_COUNT || 4);
  const splitYears = new Set((window.ECHS_AUDIT_SPLIT_YEARS || [2009, 2010]).map(Number));
  const discovered = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    discovered.push(`../data/admin-audit-overrides-${year}.json`);
    if (splitYears.has(year)) {
      for (let part = 1; part <= partCount; part += 1) {
        discovered.push(`../data/admin-audit-overrides-${year}-part${part}.json`);
      }
    }
  }
  const urls = [...new Set([...explicit, ...discovered].filter(Boolean))];
  let loaded = false;
  let loading = null;
  const overrides = new Map();
  const loadedUrls = [];
  const missingUrls = [];

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function patchArrayByKey(baseRows, patchRows, keyName) {
    if (!Array.isArray(patchRows)) return Array.isArray(baseRows) ? baseRows : [];
    const byKey = new Map(patchRows.map(row => [String(row?.matchKey ?? row?.matchLabel ?? row?.[keyName]), row]));
    return (Array.isArray(baseRows) ? baseRows : []).map(row => {
      const rowPatch = byKey.get(String(row?.[keyName]));
      if (!rowPatch) return row;
      const cleanPatch = { ...rowPatch };
      delete cleanPatch.matchKey;
      delete cleanPatch.matchLabel;
      return merge(row, cleanPatch);
    });
  }

  function merge(base, patch) {
    const out = isObject(base) ? { ...base } : {};
    for (const [key, value] of Object.entries(patch || {})) {
      if (key === "partsPatches" || key === "mediaPatches" || key === "matchKey" || key === "matchLabel") continue;
      if (isObject(value)) out[key] = merge(out[key], value);
      else out[key] = value;
    }
    if (Array.isArray(patch?.partsPatches)) {
      out.parts = patchArrayByKey(base?.parts, patch.partsPatches, "label");
    }
    if (Array.isArray(patch?.mediaPatches)) {
      out.media = patchArrayByKey(base?.media, patch.mediaPatches, "id");
    }
    return out;
  }

  async function load() {
    if (loaded) return;
    if (loading) return loading;
    loading = (async () => {
      for (const url of urls) {
        const response = await fetch(url, { cache: "no-store" });
        if (response.status === 404) {
          missingUrls.push(url);
          continue;
        }
        if (!response.ok) throw new Error(`Could not load admin audit overrides ${url} (${response.status})`);
        const payload = await response.json();
        loadedUrls.push(url);
        for (const row of payload.records || []) {
          if (!row?.id) continue;
          const expanded = merge(payload.defaults || {}, row);
          const previous = overrides.get(String(row.id)) || {};
          overrides.set(String(row.id), merge(previous, expanded));
        }
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
    get loadedUrls() { return [...loadedUrls]; },
    get missingUrls() { return [...missingUrls]; },
    urls
  };
})();
