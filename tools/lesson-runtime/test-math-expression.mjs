import test from 'node:test';
import assert from 'node:assert/strict';
import katex from '../../lessons/ib-math-ai/unit-1/assets/js/katex.js';
import {validateMathExpression,compileMathExpression,suggestMathSpeech,validateMathSource,compileMathSource,validateMathContent,MathExpressionError,MATH_SYMBOLS,MATH_FUNCTIONS,MATH_OPERATORS} from '../../js/lesson-runtime/math-expression.mjs';
const n=value=>({kind:'number',value:String(value)}), s=name=>({kind:'symbol',name});
const source=expression=>({mode:'visual',expression});
const content=expression=>({source:source(expression),spoken:suggestMathSpeech(expression),display:true});
const clone=value=>JSON.parse(JSON.stringify(value));
function check(expression,expected){assert.equal(compileMathExpression(expression),expected);assert.equal(validateMathContent(content(expression),{mathEngine:katex}).valid,true);}

test('fraction, power and signed grouping compile without losing precedence',()=>{
  check({kind:'fraction',numerator:n(1),denominator:{kind:'binary',operator:'add',left:s('x'),right:n(2)}},'\\frac{1}{\\left(x\\right) + \\left(2\\right)}');
  const negativePower={kind:'power',base:{kind:'negate',body:s('x')},exponent:n(2)};
  const negatePower={kind:'negate',body:{kind:'power',base:s('x'),exponent:n(2)}};
  check(negativePower,'\\left(-\\left(x\\right)\\right)^{2}');check(negatePower,'-\\left(\\left(x\\right)^{2}\\right)');
  assert.notEqual(compileMathExpression(negativePower),compileMathExpression(negatePower));
});
test('roots, functions and grouping use exact safe delimiters',()=>{
  check({kind:'root',radicand:s('x'),index:null},'\\sqrt{x}');
  check({kind:'root',radicand:s('x'),index:n(3)},'\\sqrt[3]{x}');
  check({kind:'function',name:'abs',argument:{kind:'group',body:s('x')}},'\\left|\\left(x\\right)\\right|');
  for(const name of MATH_FUNCTIONS)assert.equal(validateMathContent(content({kind:'function',name,argument:s('x')}),{mathEngine:katex}).valid,true);
});
test('sum indices and integral differentials retain their explicitly selected variables and bounds',()=>{
  check({kind:'sum',variable:'k',lower:n(1),upper:s('n'),body:s('k')},'\\sum_{k=1}^{n} \\left(k\\right)');
  check({kind:'integral',variable:'t',lower:n(0),upper:n(1),body:s('t')},'\\int_{0}^{1} \\left(t\\right)\\,\\mathrm{d}t');
  check({kind:'integral',variable:'x',lower:null,upper:null,body:s('x')},'\\int \\left(x\\right)\\,\\mathrm{d}x');
  assert.equal(validateMathExpression({kind:'integral',variable:'x',lower:null,upper:n(1),body:s('x')}).valid,false);
});
test('limits distinguish both directions and group complex one-sided targets',()=>{
  const expression={kind:'limit',variable:'x',target:n(0),side:'both',body:s('x')};
  check(expression,'\\lim_{x\\to 0} \\left(x\\right)');
  check({...expression,side:'left'},'\\lim_{x\\to {0}^{-}} \\left(x\\right)');
  check({...expression,side:'right',target:{kind:'negate',body:n(2)}},'\\lim_{x\\to {-\\left(2\\right)}^{+}} \\left(x\\right)');
  assert.match(suggestMathSpeech({...expression,side:'left'}),/from the left/);
});
test('every finite symbol and operator parses in both inline and display modes',()=>{
  for(const name of MATH_SYMBOLS)for(const display of [false,true])assert.equal(validateMathSource(source(s(name)),{mathEngine:katex,display}).valid,true,name);
  for(const operator of MATH_OPERATORS)assert.equal(validateMathContent(content({kind:'binary',operator,left:s('x'),right:n(1)}),{mathEngine:katex}).valid,true,operator);
});
test('suggested speech preserves nested operand grouping without changing the expression',()=>{
  const expression={kind:'binary',operator:'multiply',left:{kind:'binary',operator:'add',left:s('a'),right:s('b')},right:s('c')};
  const before=clone(expression),spoken=suggestMathSpeech(expression);
  assert.match(spoken,/end quantity times the quantity c, end quantity$/);assert.deepEqual(expression,before);
  assert.match(suggestMathSpeech({kind:'integral',variable:'t',lower:n(0),upper:n(1),body:s('t')}),/with respect to t/);
});
test('only exact decimal strings, finite enums and complete node fields are accepted',()=>{
  for(const value of ['-1','01','1.','1e3','NaN','Infinity','1/2','1\\over2','1 '.repeat(3),'12345678901234567'])assert.equal(validateMathExpression(n(value)).valid,false,value);
  for(const bad of [{kind:'hasOwnProperty'},s('\\href'),{kind:'group'}, {...s('x'),tex:'x'}, {kind:'function',name:'arbitrary',argument:s('x')},{kind:'sum',variable:'xy',lower:n(1),upper:n(2),body:s('x')}])assert.equal(validateMathExpression(bad).valid,false);
  assert.throws(()=>compileMathExpression({kind:'fraction',numerator:n(1),denominator:null}),MathExpressionError);
});
test('expression levels and total nodes are bounded independently',()=>{
  let expression=s('x');for(let i=0;i<4;i++)expression={kind:'group',body:expression};assert.equal(validateMathExpression(expression).valid,true);
  assert.equal(validateMathExpression({kind:'group',body:expression}).errors[0].code,'depth-limit');
  function branch(depth){return depth===1?s('x'):{kind:'sum',variable:'i',lower:branch(depth-1),upper:branch(depth-1),body:branch(depth-1)};}
  // Three children per node yields 121 nodes at five levels. A malformed extra node is never accepted.
  assert.equal(validateMathExpression(branch(5)).valid,true);
  assert.equal(validateMathExpression(branch(6)).valid,false);
});
test('accessors, prototypes, cycles, symbols, hidden fields and toJSON never execute',()=>{
  let invoked=0;const getter={kind:'symbol'};Object.defineProperty(getter,'name',{enumerable:true,get(){invoked++;return 'x';}});
  const hidden=s('x');Object.defineProperty(hidden,'private_notes',{value:'secret'});
  const cyclic={kind:'group'};cyclic.body=cyclic;
  const symbol=s('x');symbol[Symbol('hidden')]='x';
  for(const value of [getter,hidden,cyclic,symbol,Object.assign(Object.create({}),s('x')),{...s('x'),toJSON(){invoked++;return {};}}])assert.equal(validateMathExpression(value).valid,false);
  assert.equal(invoked,0);
});
test('source modes are exclusive and advanced TeX safety is independent of optional syntax checks',()=>{
  const good={mode:'tex',tex:'\\frac{x^2}{2}'};assert.equal(compileMathSource(good),good.tex);
  assert.equal(validateMathSource(good,{mathEngine:katex}).valid,true);
  assert.equal(validateMathSource({...good,expression:s('x')}).valid,false);
  for(const tex of ['\\href{https://example.test}{x}','\\htmlStyle{color:red}{x}','\\def\\x{x}','<img src=x>','a\0b','x'.repeat(4001)])assert.equal(validateMathSource({mode:'tex',tex}).valid,false);
  const malformed={mode:'tex',tex:'\\frac{x}{'};
  assert.equal(validateMathSource(malformed).valid,true);assert.equal(validateMathSource(malformed,{mathEngine:katex}).valid,false);
  assert.equal(validateMathSource(good,{mathEngine:null}).valid,false);
  assert.equal(validateMathSource(good,{mathEngine:{...katex,version:'0.0'}}).valid,false);
});
test('content requires safe spoken text, a boolean display choice and no private fields',()=>{
  const valid=content(s('x'));
  for(const bad of [{...valid,spoken:''},{...valid,spoken:'<b>x</b>'},{...valid,display:'true'},{...valid,private_notes:'secret'},{...valid,spoken:'x'.repeat(4001)}])assert.equal(validateMathContent(bad,{mathEngine:katex}).valid,false);
  assert.deepEqual(valid,content(s('x')));
});
