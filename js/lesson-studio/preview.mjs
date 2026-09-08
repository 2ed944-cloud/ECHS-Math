// Staff-only document preview. This has no route, publication, or progress authority.
import {assertLessonDocument} from '../lesson-runtime/schema.mjs';

export function renderSlidePreview({root,document:lesson,slideIndex=0,mathEngine}) {
  assertLessonDocument(lesson,{mathEngine});
  renderValidatedSlide(root,lesson,slideIndex,mathEngine);
}

export function renderLessonPreview({root,document:lesson,mathEngine}) {
  assertLessonDocument(lesson,{mathEngine});
  const fragment=root.ownerDocument.createDocumentFragment();
  lesson.slides.forEach((_,index)=>{
    const article=root.ownerDocument.createElement('article');article.className='slide-canvas';
    renderValidatedSlide(article,lesson,index,mathEngine);fragment.append(article);
  });
  root.replaceChildren(fragment);
}

function renderValidatedSlide(root,lesson,slideIndex,mathEngine) {
  const slide=lesson.slides[slideIndex];
  if (!slide) throw new Error('Choose a slide to preview.');
  const dom=root.ownerDocument;
  const node=(tag,text)=>{const element=dom.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
  const math=(value,display=false)=>{
    const element=node(display?'div':'span');element.className='math-block';
    element.setAttribute('role','math');element.setAttribute('aria-label',value.spoken);
    mathEngine.render(value.tex,element,{displayMode:display,throwOnError:true,trust:false,strict:'error',output:'htmlAndMathml',maxExpand:100,maxSize:10});
    return element;
  };
  const paragraphs=content=>{
    const fragment=dom.createDocumentFragment();
    for(const paragraph of content.paragraphs){
      const p=node('p');
      for(const child of paragraph.children){
        if(child.type==='math'){p.append(math(child));continue;}
        let text=dom.createTextNode(child.text);
        for(const mark of child.marks||[]){const wrapper=node(mark==='strong'?'strong':'em');wrapper.append(text);text=wrapper;}
        p.append(text);
      }
      fragment.append(p);
    }
    return fragment;
  };
  const content=node('div');content.className='slide-content';content.dataset.layout=slide.layout;
  for(const block of slide.blocks){
    let element;
    if(block.type==='rich-text'){element=node('div');element.append(paragraphs(block.content));}
    else if(block.type==='math')element=math(block.content,block.content.display);
    else if(block.type==='callout'){element=node('aside');element.className='callout';element.append(node('h3',block.content.title),paragraphs(block.content.body));}
    else {element=node('p','Legacy lesson reference: '+block.content.summary);element.className='field-help';}
    content.append(element);
  }
  root.replaceChildren(node('h2',slide.title),content);
  root.lang=lesson.accessibility.language;
}
