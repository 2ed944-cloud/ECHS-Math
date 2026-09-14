// Explicit legacy adapters. These public teaching routes grant no assessment access.
export const INVESTIGATION_HOSTS = Object.freeze([
  Object.freeze({key:'ap-rates', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.3_Rates_of_Change_in_Linear_and_Quadratic_Functions_ECHS_Refined.html'}),
  Object.freeze({key:'arithmetic', course:'ib-math-ai', path:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html'}),
  Object.freeze({key:'geometric', course:'ib-math-ai', path:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html'}),
  Object.freeze({key:'finance', course:'ib-math-ai', path:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html'}),
]);

export function resolveInvestigationHost(href, siteRoot = new URL('../../../', import.meta.url)) {
  try {
    const current = new URL(href);
    if (!['https:','http:'].includes(current.protocol) || current.username || current.password) return null;
    return INVESTIGATION_HOSTS.find(row => {
      const expected = new URL(row.path, siteRoot);
      return current.origin === expected.origin && current.pathname === expected.pathname;
    }) || null;
  } catch { return null; }
}
