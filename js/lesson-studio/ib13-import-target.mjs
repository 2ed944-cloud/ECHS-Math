/** Exact catalog binding only. Importing this module does not load teaching content. */
export const IB13_IMPORT_TARGET = Object.freeze({
  courseVersionId: '9a875b4c-61af-5001-9f31-a22044f6f58d',
  courseKey: 'ib-math-ai',
  accessKey: 'ib-math-ai::0::1.3',
  unitId: 'legacy:ib-math-ai:unit:1',
  topicId: 'legacy:ib-math-ai:topic:1.3',
  path: 'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html'
});

function data(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).some(key => typeof key !== 'string' || !('value' in descriptors[key]) || !descriptors[key].enumerable)) return null;
  return Object.fromEntries(Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value]));
}

/** Missing, malformed and mismatched selections are simply ineligible. No authorization is granted here. */
export function isIB13ImportTarget(value) {
  try {
    const input = data(value), catalog = data(input?.catalog), binding = IB13_IMPORT_TARGET;
    return Boolean(input && catalog && input.courseVersionId === binding.courseVersionId &&
      catalog.course_key === binding.courseKey && catalog.access_key === binding.accessKey &&
      catalog.unit_id === binding.unitId && catalog.topic_id === binding.topicId &&
      catalog.route_path === binding.path && catalog.unit_index === 0 && catalog.topic === '1.3' &&
      catalog.position === 3 && catalog.is_ready === true);
  } catch { return false; }
}
