/* Exact algebra structures and finite numerical samples; no expression evaluation. */
(function(root){'use strict';
const diagnosis=[
 {tex:'\\lim_{x\\to2}(x^2+3x-1)',form:'finite',method:'substitute',reason:'A polynomial permits substitution: 4 + 6 − 1 = 9.'},
 {tex:'\\lim_{x\\to3}\\frac{x^2-9}{x-3}',form:'indeterminate',method:'factor',reason:'The form is 0/0. Factor x²−9, then cancel the common factor for x ≠ 3.'},
 {tex:'\\lim_{x\\to4}\\frac{\\sqrt{x+5}-3}{x-4}',form:'indeterminate',method:'conjugate',reason:'The form is 0/0. The conjugate exposes x−4.'},
 {tex:'\\lim_{x\\to3}\\frac{1/x-1/3}{x-3}',form:'indeterminate',method:'combine',reason:'The form is 0/0. Combine the reciprocal difference first.'},
 {tex:'\\lim_{x\\to0}\\frac{1-\\cos^2x}{\\sin x}',form:'indeterminate',method:'identity',reason:'The Pythagorean identity turns 1−cos²x into sin²x.'},
 {tex:'\\lim_{x\\to3}\\frac{x+3}{x-3}',form:'nonzero-zero',method:'sides',reason:'The numerator tends to 6. Inspect the sign of x−3 on each side; the two-sided limit does not exist.'}
];
const factors=[{r:3,s:-2,b:-1,k:-6},{r:-2,s:4,b:-2,k:-8},{r:1,s:1,b:-2,k:1},{r:-1,s:-3,b:4,k:3}];
function synthetic(coefficients,c){if(!Array.isArray(coefficients)||coefficients.length<2||!coefficients.every(Number.isFinite)||!Number.isFinite(c))return null;const bottom=[coefficients[0]],products=[null];for(let i=1;i<coefficients.length;i++){products.push(bottom[i-1]*c);bottom.push(coefficients[i]+products[i]);}return {coefficients:coefficients.slice(),products,bottom,quotient:bottom.slice(0,-1),remainder:bottom.at(-1)};}
function polynomial(coef,x){return coef.reduce((a,b)=>a*x+b,0);}
function powerSum(x,a,n){if(!Number.isInteger(n)||n<1)return null;let sum=0;for(let j=0;j<n;j++)sum+=x**(n-1-j)*a**j;return sum;}
function rootFactor(x,a){const u=Math.cbrt(x),v=Math.cbrt(a);return u*u+u*v+v*v;}
function cubeQuotient(x,a){if(x===a)return null;return 1/rootFactor(x,a);}
function productCase(a){if(!Number.isFinite(a))return null;const b=-9-3*a,left=a===-6?'infinity':a>-6?'-infinity':'infinity',right=a===-6?'infinity':a>-6?'infinity':'-infinity';return {a,b,product:a*b||0,bound:27/4,gap:3*(a+1.5)**2,left,right,finite:false};}
function hole(c,at){return {label:'Equivalent line with an excluded target and a separate point value',c,at,left:2*c,right:2*c,domain:[c-3,c+3],range:[Math.min(2*c-4,at===null?2*c-4:at-1),Math.max(2*c+4,at===null?2*c+4:at+1)],breaks:[c],fn:x=>x+c};}
const radicals={numerator:{tex:'\\frac{\\sqrt{x+5}-3}{x-4}',partner:'\\sqrt{x+5}+3',rewrite:'\\frac1{\\sqrt{x+5}+3}',c:4,limit:1/6,fn:x=>1/(Math.sqrt(x+5)+3)},denominator:{tex:'\\frac{x-4}{\\sqrt x-2}',partner:'\\sqrt x+2',rewrite:'\\sqrt x+2',c:4,limit:4,fn:x=>Math.sqrt(x)+2}};
const trig=[{tex:'\\frac{1-\\cos^2x}{\\sin x}',rewrite:'\\sin x',choice:'sin',limit:0,fn:x=>Math.sin(x)},{tex:'\\frac{\\tan x}{\\sin x}',rewrite:'\\frac1{\\cos x}',choice:'sec',limit:1,fn:x=>1/Math.cos(x)},{tex:'\\frac{\\sin(2x)}{\\sin x}',rewrite:'2\\cos x',choice:'double',limit:2,fn:x=>2*Math.cos(x)}];
const data={diagnosis,factors,synthetic,polynomial,powerSum,rootFactor,cubeQuotient,productCase,hole,radicals,trig};if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.Algebra16=data;
})(typeof window!=='undefined'?window:globalThis);
