/** Closed visual mathematics. No DOM, evaluation, algebra solver or network use. */
export const MATH_EXPRESSION_LIMITS = Object.freeze({ maxLevels: 5, maxNodes: 128, maxTex: 4000, maxSpoken: 4000 });
export const MATH_SYMBOLS = Object.freeze([...Array.from('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'pi', 'theta', 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'infinity']);
export const MATH_FUNCTIONS = Object.freeze(['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'abs', 'f', 'g', 'h']);
export const MATH_OPERATORS = Object.freeze(['add', 'subtract', 'multiply', 'equals', 'less', 'lessEqual', 'greater', 'greaterEqual']);
const NUMBER = /^(?:0|[1-9][0-9]{0,15})(?:\.[0-9]{1,12})?$/;
const VARIABLE = /^[A-Za-z]$/;
const unsafeTex = /\\(?:href|url|html[A-Za-z]*|includegraphics|def|gdef|edef|xdef|newcommand|renewcommand|providecommand|let|futurelet|global|catcode|csname|require)\b/i;
const html = /<\s*(?:\/?[A-Za-z][^>]*|![^>]*)>/;
const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const forbidden = new Set(['__proto__', 'prototype', 'constructor', 'toJSON']);
const result = errors => ({ valid: errors.length === 0, errors });
const issue = (path, code, message) => ({ path, code, message });
const escapePointer = key => key.replace(/~/g, '~0').replace(/\//g, '~1');
export class MathExpressionError extends Error {
  constructor(errors) { super('Invalid lesson mathematics.'); this.name = 'MathExpressionError'; this.errors = errors; }
}
function throwInvalid(checked) { if (!checked.valid) throw new MathExpressionError(checked.errors); }

// Inspect descriptors first: neither getters nor toJSON hooks may run during validation.
function inspect(value) {
  let visited = 0;
  const ancestors = new WeakSet();
  function walk(item, path, depth) {
    if (++visited > 2048 || depth > 16) return issue(path, 'data-limit', 'Mathematics data is too deeply nested or too large.');
    if (item === null || typeof item === 'boolean') return null;
    if (typeof item === 'string') return item.length <= 4000 ? null : issue(path, 'text-limit', 'Mathematics text exceeds 4,000 characters.');
    if (typeof item !== 'object' || Array.isArray(item)) return issue(path, 'plain-object', 'Only closed plain objects and strings are supported.');
    if (ancestors.has(item)) return issue(path, 'cycle', 'Cyclic mathematics data is not supported.');
    if (![Object.prototype, null].includes(Object.getPrototypeOf(item))) return issue(path, 'prototype', 'Mathematics objects must have a plain prototype.');
    const descriptors = Object.getOwnPropertyDescriptors(item), keys = Reflect.ownKeys(descriptors);
    if (keys.length > 10) return issue(path, 'field-limit', 'Mathematics objects have too many fields.');
    ancestors.add(item);
    for (const key of keys) {
      if (typeof key !== 'string' || forbidden.has(key)) return issue(path, 'field', 'This mathematics field is not permitted.');
      const descriptor = descriptors[key];
      if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return issue(path, 'descriptor', 'Getters and hidden mathematics fields are not permitted.');
      const error = walk(descriptor.value, `${path}/${escapePointer(key)}`, depth + 1);
      if (error) return error;
    }
    ancestors.delete(item); return null;
  }
  try { return walk(value, '', 0); } catch { return issue('', 'unreadable', 'Mathematics must be readable plain data.'); }
}
function keys(value, expected) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
}
const shape = {
  number: ['kind', 'value'], symbol: ['kind', 'name'], group: ['kind', 'body'], negate: ['kind', 'body'],
  binary: ['kind', 'operator', 'left', 'right'], fraction: ['kind', 'numerator', 'denominator'],
  power: ['kind', 'base', 'exponent'], root: ['kind', 'radicand', 'index'], function: ['kind', 'name', 'argument'],
  sum: ['kind', 'variable', 'lower', 'upper', 'body'], integral: ['kind', 'variable', 'lower', 'upper', 'body'],
  limit: ['kind', 'variable', 'target', 'side', 'body']
};
function expressionErrors(expression) {
  let count = 0;
  function walk(node, path, level) {
    if (++count > MATH_EXPRESSION_LIMITS.maxNodes) return issue(path, 'node-limit', 'Use at most 128 expression nodes.');
    if (level > MATH_EXPRESSION_LIMITS.maxLevels) return issue(path, 'depth-limit', 'Use at most five levels of nested expressions.');
    const fields = node && Object.hasOwn(shape, node.kind) ? shape[node.kind] : null;
    if (!fields || !keys(node, fields)) return issue(path, 'node-shape', 'Use the exact fields of a supported expression type.');
    let children = [];
    switch (node.kind) {
      case 'number': if (typeof node.value !== 'string' || !NUMBER.test(node.value)) return issue(path + '/value', 'number', 'Enter a nonnegative decimal without a sign or leading zeros.'); break;
      case 'symbol': if (!MATH_SYMBOLS.includes(node.name)) return issue(path + '/name', 'symbol', 'Choose a supported symbol.'); break;
      case 'group': case 'negate': children = ['body']; break;
      case 'binary': if (!MATH_OPERATORS.includes(node.operator)) return issue(path + '/operator', 'operator', 'Choose a supported operation.'); children = ['left', 'right']; break;
      case 'fraction': children = ['numerator', 'denominator']; break;
      case 'power': children = ['base', 'exponent']; break;
      case 'root': children = node.index === null ? ['radicand'] : ['radicand', 'index']; break;
      case 'function': if (!MATH_FUNCTIONS.includes(node.name)) return issue(path + '/name', 'function', 'Choose a supported function.'); children = ['argument']; break;
      case 'sum': case 'integral':
        if (typeof node.variable !== 'string' || !VARIABLE.test(node.variable)) return issue(path + '/variable', 'variable', 'Use one Latin letter for the variable.');
        if (node.kind === 'integral' && (node.lower === null) !== (node.upper === null)) return issue(path, 'bounds', 'An integral needs both bounds or neither bound.');
        children = node.kind === 'integral' && node.lower === null ? ['body'] : ['lower', 'upper', 'body']; break;
      case 'limit':
        if (typeof node.variable !== 'string' || !VARIABLE.test(node.variable)) return issue(path + '/variable', 'variable', 'Use one Latin letter for the variable.');
        if (!['both', 'left', 'right'].includes(node.side)) return issue(path + '/side', 'side', 'Choose a two-sided, left-hand or right-hand limit.');
        children = ['target', 'body']; break;
    }
    for (const key of children) { const error = walk(node[key], `${path}/${key}`, level + 1); if (error) return error; }
    return null;
  }
  const error = walk(expression, '', 1); return error ? [error] : [];
}
const parens = value => `\\left(${value}\\right)`;
function tex(node) {
  switch (node.kind) {
    case 'number': return node.value;
    case 'symbol': return node.name === 'infinity' ? '\\infty' : node.name.length === 1 ? node.name : '\\' + node.name;
    case 'group': return parens(tex(node.body));
    case 'negate': return '-' + parens(tex(node.body));
    case 'binary': {
      const operators = { add: '+', subtract: '-', multiply: '\\cdot', equals: '=', less: '<', lessEqual: '\\leq', greater: '>', greaterEqual: '\\geq' };
      return `${parens(tex(node.left))} ${operators[node.operator]} ${parens(tex(node.right))}`;
    }
    case 'fraction': return `\\frac{${tex(node.numerator)}}{${tex(node.denominator)}}`;
    case 'power': return `${parens(tex(node.base))}^{${tex(node.exponent)}}`;
    case 'root': return `\\sqrt${node.index === null ? '' : `[${tex(node.index)}]`}{${tex(node.radicand)}}`;
    case 'function': return node.name === 'abs' ? `\\left|${tex(node.argument)}\\right|` : `${['f','g','h'].includes(node.name) ? node.name : '\\' + node.name}${parens(tex(node.argument))}`;
    case 'sum': return `\\sum_{${node.variable}=${tex(node.lower)}}^{${tex(node.upper)}} ${parens(tex(node.body))}`;
    case 'integral': return `\\int${node.lower === null ? '' : `_{${tex(node.lower)}}^{${tex(node.upper)}}`} ${parens(tex(node.body))}\\,\\mathrm{d}${node.variable}`;
    case 'limit': return `\\lim_{${node.variable}\\to ${node.side === 'both' ? tex(node.target) : `{${tex(node.target)}}^{${node.side === 'left' ? '-' : '+'}}`}} ${parens(tex(node.body))}`;
  }
}
export function validateMathExpression(expression) {
  const inspected = inspect(expression); if (inspected) return result([inspected]);
  const errors = expressionErrors(expression);
  if (!errors.length && tex(expression).length > MATH_EXPRESSION_LIMITS.maxTex) errors.push(issue('', 'tex-limit', 'The generated expression exceeds 4,000 TeX characters.'));
  return result(errors);
}
export function compileMathExpression(expression) { throwInvalid(validateMathExpression(expression)); return tex(expression); }

function speech(node) {
  switch (node.kind) {
    case 'number': return node.value;
    case 'symbol': return node.name;
    case 'group': return `the quantity ${speech(node.body)}, end quantity`;
    case 'negate': return `negative of ${speech(node.body)}, end negative`;
    case 'binary': return `the quantity ${speech(node.left)}, end quantity ${({add:'plus',subtract:'minus',multiply:'times',equals:'equals',less:'is less than',lessEqual:'is less than or equal to',greater:'is greater than',greaterEqual:'is greater than or equal to'})[node.operator]} the quantity ${speech(node.right)}, end quantity`;
    case 'fraction': return `fraction with numerator ${speech(node.numerator)} and denominator ${speech(node.denominator)}, end fraction`;
    case 'power': return `the quantity ${speech(node.base)}, raised to the power ${speech(node.exponent)}, end power`;
    case 'root': return `${node.index === null ? 'square root' : `root of index ${speech(node.index)}`} of ${speech(node.radicand)}, end root`;
    case 'function': return `${({sin:'sine',cos:'cosine',tan:'tangent',arcsin:'inverse sine',arccos:'inverse cosine',arctan:'inverse tangent',ln:'natural logarithm',log:'logarithm',exp:'exponential',abs:'absolute value'})[node.name] || node.name} of ${speech(node.argument)}, end function`;
    case 'sum': return `sum from ${node.variable} equals ${speech(node.lower)} to ${speech(node.upper)} of ${speech(node.body)}, end sum`;
    case 'integral': return `integral${node.lower === null ? '' : ` from ${speech(node.lower)} to ${speech(node.upper)}`} of ${speech(node.body)} with respect to ${node.variable}, end integral`;
    case 'limit': return `limit as ${node.variable} approaches ${speech(node.target)}${node.side === 'both' ? '' : node.side === 'left' ? ' from the left' : ' from the right'} of ${speech(node.body)}, end limit`;
  }
}
export function suggestMathSpeech(expression) {
  throwInvalid(validateMathExpression(expression)); const spoken = speech(expression);
  if (spoken.length > MATH_EXPRESSION_LIMITS.maxSpoken) throw new MathExpressionError([issue('', 'speech-limit', 'Enter a shorter spoken description for this expression.')]);
  return spoken;
}
function sourceErrors(source) {
  if (keys(source, ['mode','expression']) && source.mode === 'visual') return validateMathExpression(source.expression).errors.map(error => ({...error,path:'/expression'+error.path}));
  if (!keys(source, ['mode','tex']) || source.mode !== 'tex') return [issue('', 'source-shape', 'Choose exactly one visual or advanced TeX source.')];
  if (typeof source.tex !== 'string' || !source.tex.trim() || source.tex.length > 4000 || controls.test(source.tex)) return [issue('/tex', 'tex-text', 'Enter at most 4,000 nonempty TeX characters without control characters.')];
  if (unsafeTex.test(source.tex) || html.test(source.tex)) return [issue('/tex', 'unsafe-tex', 'Mathematics cannot contain links, HTML, resources or macro definitions.')];
  return [];
}
function engineErrors(source, mathEngine, display) {
  if (!mathEngine || mathEngine.version !== '0.16.27' || typeof mathEngine.renderToString !== 'function') return [issue('', 'math-engine', 'Local KaTeX 0.16.27 is required for mathematical syntax validation.')];
  try { mathEngine.renderToString(source.mode === 'visual' ? tex(source.expression) : source.tex,
    { displayMode: display, throwOnError: true, strict: 'error', trust: false, maxExpand: 100, maxSize: 10, output: 'htmlAndMathml' }); }
  catch { return [issue('/source', 'invalid-math', 'Correct the expression before saving. It must parse using the supported local KaTeX engine.')]; }
  return [];
}
export function validateMathSource(source, { mathEngine, display = false } = {}) {
  const inspected = inspect(source); if (inspected) return result([inspected]);
  const errors = sourceErrors(source);
  if (!errors.length && mathEngine !== undefined) errors.push(...engineErrors(source, mathEngine, display));
  return result(errors);
}
/** Without an engine this checks structure/safety, not mathematical syntax or correctness. */
export function compileMathSource(source) { throwInvalid(validateMathSource(source)); return source.mode === 'visual' ? tex(source.expression) : source.tex; }
export function validateMathContent(content, { mathEngine } = {}) {
  const inspected = inspect(content); if (inspected) return result([inspected]);
  if (!keys(content, ['source','spoken','display'])) return result([issue('', 'content-shape', 'Math content requires only source, spoken and display.')]);
  const errors = sourceErrors(content.source).map(error => ({...error,path:'/source'+error.path}));
  if (typeof content.spoken !== 'string' || !content.spoken.trim() || content.spoken.length > 4000 || /[<>]/.test(content.spoken) || controls.test(content.spoken)) errors.push(issue('/spoken', 'spoken-text', 'Enter a plain spoken description of at most 4,000 characters.'));
  if (typeof content.display !== 'boolean') errors.push(issue('/display', 'display', 'Display must be a boolean.'));
  if (!errors.length && mathEngine !== undefined) errors.push(...engineErrors(content.source, mathEngine, content.display));
  return result(errors);
}
