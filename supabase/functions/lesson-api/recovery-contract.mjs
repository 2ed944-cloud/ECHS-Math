export const LESSON_RECOVERY_CONTRACT='echs.lesson.recovery.v1';
export const LESSON_RECOVERY_CAPABILITIES=Object.freeze({contract:LESSON_RECOVERY_CONTRACT,cipher:'AES-256-GCM',checkpoint_version:1,max_plaintext_bytes:4194304});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function confirmedRecoveryCapabilities(value) {
  if(!value || Array.isArray(value) || Object.keys(value).length!==4)return null;
  return Object.entries(LESSON_RECOVERY_CAPABILITIES).every(([key,item])=>value[key]===item)?LESSON_RECOVERY_CAPABILITIES:null;
}
/** Validate and project the exact SQL release; never retain or log key material. */
export function projectRecoveryKey(value,{actor,lessonId,classId}={}) {
  const fields=['ok','contract','account_id','organization_id','class_id','lesson_id','key_id','key_base64'];
  if(!value || Array.isArray(value) || Object.keys(value).length!==fields.length || fields.some(key=>!Object.hasOwn(value,key)) ||
    value.ok!==true || value.contract!==LESSON_RECOVERY_CONTRACT || value.account_id!==actor?.account_id || value.organization_id!==actor?.organization_id ||
    value.lesson_id!==lessonId || value.class_id!==classId || ['account_id','organization_id','class_id','lesson_id','key_id'].some(key=>!UUID.test(value[key]||'')) ||
    typeof value.key_base64!=='string' || !/^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/.test(value.key_base64))throw new Error('Invalid recovery key contract.');
  return Object.fromEntries(fields.map(key=>[key,value[key]]));
}
