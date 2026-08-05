import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const overlayPath=new URL('lessons/ib-math-ai/unit-1/data/lesson-1.5-product-law-clarity-v6-0-1.js',root);
const wrapperPath=new URL('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.5_logarithms_ECHS.html',root);
const [source,wrapper]=await Promise.all([
  readFile(overlayPath,'utf8'),
  readFile(wrapperPath,'utf8')
]);

const window={
  LESSON_DATA:{
    version:'6.0.0',
    lesson:{number:'1.5'},
    slides:[{
      section:'Exponent laws',
      title:'Product law · why exponents add',
      eyebrow:'Derive the law before using it',
      html:'legacy'
    }]
  }
};
const context={window};
vm.createContext(context);
vm.runInContext(source,context);

const slide=window.LESSON_DATA.slides[0];
if(slide.title!=='Product law · multiply the powers, add the factor counts')throw new Error(`Unexpected title: ${slide.title}`);
if(slide.eyebrow!=='The operation between the powers is multiplication')throw new Error(`Unexpected eyebrow: ${slide.eyebrow}`);
if(!slide.html.includes('a^3\\cdot a^4'))throw new Error('Expanded product does not use an explicit multiplication dot');
if(!slide.html.includes('aria-label="multiplied by">×</strong>'))throw new Error('Visual operator between powers is not multiplication');
if(!slide.html.includes('3 + 4 = 7 factors'))throw new Error('Factor-count addition is not labelled explicitly');
if(!slide.html.includes('a^3+a^4\\ne a^7'))throw new Error('Addition misconception warning is missing');
if(slide.html.includes('<strong>+</strong>'))throw new Error('Ambiguous plus sign remains between the power cards');
if(window.LESSON_DATA.version!=='6.0.1')throw new Error(`Unexpected lesson version: ${window.LESSON_DATA.version}`);

const definitive='lesson-1.5-exponents-logarithms-definitive-v6.js?v=6.0.0';
const clarity='lesson-1.5-product-law-clarity-v6-0-1.js?v=6.0.1';
const katex='../assets/js/katex-global.js';
const engine='../assets/js/engine.js?v=3.0.0';
for(const marker of [definitive,clarity,katex,engine])if(!wrapper.includes(marker))throw new Error(`Wrapper missing ${marker}`);
if(!(wrapper.indexOf(definitive)<wrapper.indexOf(clarity)&&wrapper.indexOf(clarity)<wrapper.indexOf(katex)&&wrapper.indexOf(katex)<wrapper.indexOf(engine)))throw new Error('Lesson 1.5 hotfix is loaded in the wrong order');

console.log('IB AI Lesson 1.5 product-law clarity: PASS');
