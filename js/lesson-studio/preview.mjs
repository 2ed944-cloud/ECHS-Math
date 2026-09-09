// Staff-only document preview. This has no route, publication, or progress authority.
import {assertLessonDocument} from '../lesson-runtime/schema.mjs';
import {createContentRenderer} from '../lesson-runtime/content-renderer.mjs';
const previews=new WeakMap();
export function disposeLessonPreview(root){const renderers=previews.get(root)||[];previews.delete(root);for(const renderer of renderers)renderer.dispose();}

export function renderSlidePreview({root,document:lesson,slideIndex=0,mathEngine,resolveAsset}) {
  disposeLessonPreview(root);
  assertLessonDocument(lesson,{mathEngine});
  previews.set(root,[renderValidatedSlide(root,lesson,slideIndex,mathEngine,resolveAsset)]);
}

export function renderLessonPreview({root,document:lesson,mathEngine,resolveAsset}) {
  disposeLessonPreview(root);
  assertLessonDocument(lesson,{mathEngine});
  const fragment=root.ownerDocument.createDocumentFragment(),renderers=[];
  previews.set(root,renderers);
  try{
  lesson.slides.forEach((_,index)=>{
    const article=root.ownerDocument.createElement('article');article.className='slide-canvas';
    renderers.push(renderValidatedSlide(article,lesson,index,mathEngine,resolveAsset));fragment.append(article);
  });
  root.replaceChildren(fragment);
  }catch(error){disposeLessonPreview(root);throw error;}
}

function renderValidatedSlide(root,lesson,slideIndex,mathEngine,resolveAsset) {
  const slide=lesson.slides[slideIndex];
  if (!slide) throw new Error('Choose a slide to preview.');
  const dom=root.ownerDocument;
  const node=(tag,text)=>{const element=dom.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
  const renderer=createContentRenderer({document:dom,mathEngine,resolveAsset});
  try{
  const content=node('div');content.className='slide-content';content.dataset.layout=slide.layout;
  for(const block of slide.blocks){
    const element=block.type==='legacy-embedded'&&block.version===1?node('p','Legacy lesson reference: '+block.content.summary):renderer.block(block);
    content.append(element);
  }
  root.replaceChildren(node('h2',slide.title),content);
  root.lang=lesson.accessibility.language;
  return renderer;
  }catch(error){renderer.dispose();throw error;}
}
