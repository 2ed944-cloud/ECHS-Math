export const REVISION = '20260930-classroom1';
export const CURRICULUM = Object.freeze({
  course: 'ap-precalculus', version: 'ap-precalculus-2026-27', effective: 'Fall 2026',
  source: 'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf',
  clarifications: 'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance.pdf',
  practices: ['Procedural and Symbolic Fluency', 'Multiple Representations', 'Communication and Reasoning']
});
export const TITLES = Object.freeze([
  'Change in Tandem', 'Rates of Change', 'Rates of Change in Linear and Quadratic Functions',
  'Polynomial Functions and Rates of Change', 'Polynomial Functions and Complex Zeros',
  'Polynomial Functions and End Behavior', 'Rational Functions and End Behavior',
  'Rational Functions and Zeros', 'Rational Functions and Vertical Asymptotes',
  'Rational Functions and Holes', 'Equivalent Representations of Polynomial and Rational Expressions',
  'Transformations of Functions', 'Function Model Selection and Assumption Articulation',
  'Function Model Construction and Application'
]);
export const CATALOG = Object.freeze(TITLES.map((title,i) => Object.freeze({
  topic:'1.'+(i+1), title,
  path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.'+(i+1)+'_'+title.replaceAll(' ','_')+'_ECHS_Refined.html'
})));
export function resolveLesson(pathname) {
  return CATALOG.find(item => pathname.endsWith('/'+item.path)) || null;
}
export async function loadLesson(topic) {
  const n=Number(topic.split('.')[1]);
  const module=await (n<=3?import('./content-1-3.mjs'):n<=6?import('./content-4-6.mjs'):n<=9?import('./content-7-9.mjs'):import('./content-10-14.mjs'));
  return module.LESSONS[topic];
}
