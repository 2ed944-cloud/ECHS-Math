import {compileMathSource} from './math-expression.mjs';
import {isSafeLessonHref} from './schema.mjs';
let nextRendererId=0;

/** Pure content DOM construction. The host must validate the lesson and authorize
 * its delivery before calling this module; it fetches nothing and grants nothing. */
export function createContentRenderer({document:doc,mathEngine}) {
  if(!doc?.createElement||!mathEngine||mathEngine.version!=='0.16.27')throw new TypeError('A document and pinned math engine are required.');
  const element=(tag,value,className)=>{const node=doc.createElement(tag);if(value!==undefined)node.textContent=value;if(className)node.className=className;return node;};
  const idPrefix=`echs-content-${++nextRendererId}-`;
  function math(content,version=1,display=Boolean(content.display)){
    if(![1,2].includes(version))throw new Error('Unsupported math version.');
    const tex=version===2?compileMathSource(content.source):content.tex;
    const node=element(display?'div':'span',undefined,'echsDocumentMath math-block');
    node.setAttribute('role','math');node.setAttribute('aria-label',content.spoken);
    mathEngine.render(tex,node,{displayMode:display,throwOnError:true,trust:false,strict:'error',output:'htmlAndMathml',maxExpand:100,maxSize:10});
    return node;
  }
  function inline(value,version){
    if(value.type==='math')return math(value,version,false);
    if(value.type==='link'&&version===2){
      if(!isSafeLessonHref(value.href))throw new Error('Unsafe lesson link.');
      const link=element('a');link.href=value.href;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
      for(const child of value.children){if(child.type!=='text')throw new Error('Links must contain text.');link.append(inline(child,version));}
      link.title='Opens in a new tab';return link;
    }
    if(value.type!=='text')throw new Error('Unsupported inline content.');
    let node=doc.createTextNode(value.text);
    for(const mark of value.marks||[]){if(!['strong','em'].includes(mark))throw new Error('Unsupported text format.');const wrap=element(mark);wrap.append(node);node=wrap;}
    return node;
  }
  function line(tag,children,version){const node=element(tag);for(const child of children)node.append(inline(child,version));return node;}
  function rich(content,version=1){
    const group=element('div');
    if(version===1){for(const paragraph of content.paragraphs)group.append(line('p',paragraph.children,1));return group;}
    if(version!==2)throw new Error('Unsupported rich text version.');
    for(const node of content.nodes){
      if(node.type==='paragraph')group.append(line('p',node.children,2));
      else if(node.type==='list'){
        if(!['ordered','unordered'].includes(node.style))throw new Error('Unsupported list style.');
        const list=element(node.style==='ordered'?'ol':'ul');
        for(const item of node.items){if(item.type!=='list-item')throw new Error('Unsupported list item.');list.append(line('li',item.children,2));}
        group.append(list);
      }else throw new Error('Unsupported rich text node.');
    }
    return group;
  }
  function block(value){
    if(![1,2].includes(value.version))throw new Error('Unsupported block version.');
    if(value.type==='rich-text')return rich(value.content,value.version);
    if(value.type==='math')return math(value.content,value.version);
    if(value.type==='callout'){
      const aside=element('aside',undefined,`echsDocumentCallout callout ${value.content.kind}`);
      const heading=element('h3',value.content.title);heading.id=idPrefix+value.id;
      aside.setAttribute('aria-labelledby',heading.id);aside.append(heading,rich(value.content.body,value.version));return aside;
    }
    throw new Error(`Unsupported content block ${value.type}@${value.version}.`);
  }
  return Object.freeze({math,rich,block});
}
