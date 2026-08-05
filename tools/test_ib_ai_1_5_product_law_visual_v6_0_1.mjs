import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=relative=>readFile(new URL(relative,root),'utf8');

const [base,definitive,hotfix,wrapper]=await Promise.all([
  read('lessons/ib-math-ai/unit-1/data/lesson-1.5.js'),
  read('lessons/ib-math-ai/unit-1/data/lesson-1.5-exponents-logarithms-definitive-v6.js'),
  read('lessons/ib-math-ai/unit-1/data/lesson-1.5-product-law-visual-v6-0-1.js'),
  read('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.5_logarithms_ECHS.html')
]);

const context={window:{},console};
vm.createContext(context);
vm.runInContext(base,context,{filename:'lesson-1.5.js'});
vm.runInContext(definitive,context,{filename:'lesson-1.5-exponents-logarithms-definitive-v6.js'});
vm.runInContext(hotfix,context,{filename:'lesson-1.5-product-law-visual-v6-0-1.js'});

const data=context.window.LESSON_DATA;
if(!data)throw new Error('LESSON_DATA was not assembled');
if(data.slides.length!==73)throw new Error(`Expected 73 slides, found ${data.slides.length}`);

const slide=data.slides.find(item=>item.title==='Product law · why exponents add');
if(!slide)throw new Error('Product-law derivation slide is missing');
if(slide.html.includes('<strong>+</strong>'))throw new Error('The visual still places an addition sign between the two powers');
if(!slide.html.includes('aria-label="multiplied by">×</strong>'))throw new Error('The multiplication sign between powers is missing');
if(!slide.html.includes('the powers are multiplied, while the exponents add'))throw new Error('The operation distinction is not stated explicitly');
if(!slide.html.includes('\\(3+4=7\\)'))throw new Error('The separate factor-count addition is missing');
if(!slide.html.includes('a cubed multiplied by a to the fourth equals a to the seventh'))throw new Error('The corrected visual lacks an accessible description');
if(data.visualPatchVersion!=='6.0.1')throw new Error(`Unexpected visual patch version: ${data.visualPatchVersion}`);

const definitiveIndex=wrapper.indexOf('lesson-1.5-exponents-logarithms-definitive-v6.js?v=6.0.0');
const hotfixIndex=wrapper.indexOf('lesson-1.5-product-law-visual-v6-0-1.js?v=6.0.1');
const engineIndex=wrapper.indexOf('../assets/js/engine.js?v=3.0.0');
if(definitiveIndex<0||hotfixIndex<0||engineIndex<0)throw new Error('Lesson wrapper is missing a required script');
if(!(definitiveIndex<hotfixIndex&&hotfixIndex<engineIndex))throw new Error('The visual patch must load after the definitive data and before the lesson engine');

console.log('IB AI Lesson 1.5 product-law visual v6.0.1: PASS');
