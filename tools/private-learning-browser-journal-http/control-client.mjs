// Exact private control-client function copied from the accepted HTTP runner.
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
const json=JSON.stringify;

export async function control(configPath,python){
 const child=spawn(python,[fileURLToPath(new URL('./controls.py',import.meta.url)),configPath],{stdio:['pipe','pipe','ignore']});
 let sequence=0,readyResolve,readyReject;const pending=new Map();
 let exited=false;const ended=new Promise(resolve=>child.once('exit',()=>{exited=true;resolve();}));
 const controlError=value=>{const error=new Error('control-rejected');if(/^[0-9A-Z]{5}$/.test(value?.sqlstate||''))error.sqlstate=value.sqlstate;return error;};
 const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
 const fail=()=>{readyReject(new Error('control-exit'));for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('control-exit'));}pending.clear();};
 child.once('error',fail);child.once('exit',fail);
 const lines=createInterface({input:child.stdout});lines.on('line',line=>{
  if(Buffer.byteLength(line)>2*1024*1024){fail();child.kill();return;}
  let value;try{value=JSON.parse(line);}catch{fail();child.kill();return;}
  if(Object.hasOwn(value,'ready')){value.ready?readyResolve():readyReject(controlError(value));return;}
  const task=pending.get(value.id);if(!task)return;pending.delete(value.id);clearTimeout(task.timer);value.error?task.reject(controlError(value.error)):task.resolve(value.data);
 });
 const timer=setTimeout(()=>{readyReject(new Error('control-start-timeout'));child.kill();},8000);try{await ready;}catch(error){child.kill('SIGKILL');let limit;try{await Promise.race([ended,new Promise((_,reject)=>{limit=setTimeout(()=>reject(new Error('control-not-reaped')),2000);})]);}finally{clearTimeout(limit);lines.close();}throw error;}finally{clearTimeout(timer);}
 return {call:(action,value={})=>new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('control-timeout'));},8000);pending.set(id,{resolve,reject,timer});child.stdin.write(json({id,action,...value})+'\n');}),close:async()=>{
  child.stdin.end();let timer;try{await Promise.race([ended,new Promise(resolve=>{timer=setTimeout(resolve,2000);})]);}finally{clearTimeout(timer);}
  if(!exited){child.kill('SIGKILL');let limit;try{await Promise.race([ended,new Promise((_,reject)=>{limit=setTimeout(()=>reject(new Error('control-not-reaped')),2000);})]);}finally{clearTimeout(limit);}}
  lines.close();
 }};
}
