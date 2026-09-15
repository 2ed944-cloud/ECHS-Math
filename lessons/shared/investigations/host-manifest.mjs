// Explicit legacy adapters. These public teaching routes grant no assessment access.
export const INVESTIGATION_HOSTS = Object.freeze([
  Object.freeze({key:'ap-rates', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.3_Rates_of_Change_in_Linear_and_Quadratic_Functions_ECHS_Refined.html'}),
  Object.freeze({key:'arithmetic', course:'ib-math-ai', path:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html'}),
  Object.freeze({key:'geometric', course:'ib-math-ai', path:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html'}),
  Object.freeze({key:'finance', course:'ib-math-ai', path:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html'}),
  Object.freeze({key:'ap-polynomial-rates', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.4_Polynomial_Functions_and_Rates_of_Change_ECHS_Refined.html'}),
  Object.freeze({key:'ap-polynomial-zeros', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.5_Polynomial_Functions_and_Complex_Zeros_ECHS_Refined.html'}),
  Object.freeze({key:'ap-polynomial-tails', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.6_Polynomial_Functions_and_End_Behavior_ECHS_Refined.html'}),
  Object.freeze({key:'ap-rational-tails', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.7_Rational_Functions_and_End_Behavior_ECHS_Refined.html'}),
  Object.freeze({key:'ap-rational-zeros', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.8_Rational_Functions_and_Zeros_ECHS_Refined.html'}),
  Object.freeze({key:'ap-rational-poles', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.9_Rational_Functions_and_Vertical_Asymptotes_ECHS_Refined.html'}),
  Object.freeze({key:'ap-rational-holes', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.10_Rational_Functions_and_Holes_ECHS_Refined.html'}),
  Object.freeze({key:'ap-equivalent-forms', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.11_Equivalent_Representations_of_Polynomial_and_Rational_Expressions_ECHS_Refined.html'}),
  Object.freeze({key:'ap-function-transformations', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.12_Transformations_of_Functions_ECHS_Refined.html'}),
  Object.freeze({key:'ap-model-selection', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.13_Function_Model_Selection_and_Assumption_Articulation_ECHS_Refined.html'}),
  Object.freeze({key:'ap-model-construction', course:'ap-precalculus', path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.14_Function_Model_Construction_and_Application_ECHS_Refined.html'}),
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
