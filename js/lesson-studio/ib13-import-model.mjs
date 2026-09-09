import {assertDraftDocument} from './draft-model.mjs';
import {IB13_REFERENCE} from './ib13-reference.mjs';
import {IB13_IMPORT_TARGET} from './ib13-import-target.mjs';
export {isIB13ImportTarget} from './ib13-import-target.mjs';

export class IB13ImportError extends Error {
  constructor(code,message){super(message);this.name='IB13ImportError';this.code=code;}
}
const fail=(code,message)=>{throw new IB13ImportError(code,message);};
const copy=value=>JSON.parse(JSON.stringify(value));
function inputFields(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('invalid_input','Supply a plain import request.');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  for(const key of Reflect.ownKeys(descriptors)) {
    if(typeof key!=='string'||!['baseDocument','selectedSlideIds','mathEngine'].includes(key)||!descriptors[key].enumerable||!('value' in descriptors[key]))fail('invalid_input','Import options must be plain explicit values.');
  }
  return Object.fromEntries(Object.entries(descriptors).map(([key,descriptor])=>[key,descriptor.value]));
}
function selection(value,eligible) {
  if(value===undefined)return new Set(eligible);
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<1||value.length>eligible.length)fail('invalid_selection','Select at least one reviewed native slide.');
  const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(descriptors);
  if(keys.length!==value.length+1||keys.some(key=>typeof key!=='string'||(key!=='length'&&(!/^(0|[1-9]\d*)$/.test(key)||!descriptors[key].enumerable||!('value' in descriptors[key])))))fail('invalid_selection','Slide selection must be a dense array of IDs.');
  const ids=[];
  for(let index=0;index<value.length;index++) {
    const id=descriptors[index]?.value;
    if(typeof id!=='string'||!eligible.includes(id)||ids.includes(id))fail('invalid_selection','Select unique reviewed slide IDs from this reference.');
    ids.push(id);
  }
  return new Set(ids);
}

/** Pure draft construction. No API, storage, authorization, progress or publication side effects. */
export function createIB13Import(options) {
  const {baseDocument,selectedSlideIds,mathEngine}=inputFields(options);
  if(!mathEngine||typeof mathEngine.renderToString!=='function')fail('math_engine_required','Load the local mathematics renderer before reviewing this import.');
  // Canonical validation checks descriptors, cycles, closed fields, bounds and strict mathematics before copying.
  assertDraftDocument(baseDocument,{mathEngine});
  const binding=IB13_IMPORT_TARGET;
  if(baseDocument.document_version!==1||baseDocument.publication.revision!==1)fail('new_draft_required','Import into a new draft at revision 1.');
  if(baseDocument.course_version_id!==binding.courseVersionId||baseDocument.unit_id!==binding.unitId||baseDocument.topic_id!==binding.topicId)fail('target_mismatch','This reference belongs to the exact active IB AI SL geometric-sequences catalog target.');
  const eligible=IB13_REFERENCE.slides.filter(slide=>slide.disposition==='native').map(slide=>slide.id),chosen=selection(selectedSlideIds,eligible);
  const document=copy(baseDocument);
  document.slides=IB13_REFERENCE.slides.map(row=>chosen.has(row.id)?copy(row.nativeSlide):{
    id:row.id,title:row.title,layout:'single',blocks:[{
      id:`${row.id}-reference`,type:'legacy-embedded',version:1,
      content:{source:IB13_REFERENCE.source.path,anchor:'learn',sha256:IB13_REFERENCE.source.sha256,
        summary:`Original lesson slide ${row.sourceIndex}: ${row.title}. ${row.disposition==='native'?'This reviewed native option was not selected.':row.reason} Open the original lesson and choose slide ${row.sourceIndex} in its lesson map. This reference preserves the location; it does not contain the original interaction or assessment.`}
    }]
  });
  assertDraftDocument(document,{mathEngine});
  const canonicalIds=eligible.filter(id=>chosen.has(id));
  return {document,summary:{totalSlides:document.slides.length,nativeSlides:canonicalIds.length,referenceSlides:document.slides.length-canonicalIds.length,selectedSlideIds:canonicalIds,sourceId:IB13_REFERENCE.source.id}};
}
