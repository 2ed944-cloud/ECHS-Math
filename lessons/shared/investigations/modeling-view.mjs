import {mountTransform} from './transform-view.mjs';
import {mountModelSelection} from './model-selection-view.mjs';
import {mountModelConstruction} from './model-construction-view.mjs';
import {record,invalid} from './modeling-view-helpers.mjs';
const mounts=Object.freeze({transform:mountTransform,selection:mountModelSelection,construction:mountModelConstruction});
export function mountModeling(options) {
  const scene=record(options?.scene);
  if(scene.model!=='modeling'||typeof scene.family!=='string'||!Object.hasOwn(mounts,scene.family))throw invalid();
  return mounts[scene.family](options);
}
