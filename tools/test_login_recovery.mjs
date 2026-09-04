import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/login.js',import.meta.url),'utf8');
async function loginHarness({next='',existing=null,failMe=false,configurationError=false}={}){
  const nodes=new Map(),redirects=[];
  for(const id of ['loginForm','loginButton','loginError','configWarning','username','password','togglePassword','capsLockNotice','loginRetry','remember']){
    const classes=new Set();nodes.set(id,{hidden:false,disabled:false,textContent:'',value:'',checked:false,type:id==='password'?'password':'text',handlers:{},attributes:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},focus(){},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,v){this.handlers[k]=v},append(){}});
  }
  let configFailed=configurationError,meFailed=failMe,loginCalls=0,resolveLogin;
  const client={root:path=>new URL(path,'https://example.test/ECHS-Math/').href,roleHome:role=>`question-bank/${role}.html`,config:async()=>configFailed?{configuration_error:'No connection'}:{enabled:true},me:async()=>{if(meFailed)throw new Error('Session temporarily unavailable');return existing},login:()=>{loginCalls++;return new Promise(resolve=>resolveLogin=resolve)}};
  const context=vm.createContext({document:{getElementById:id=>nodes.get(id)},window:{},ECHSInstitution:client,location:{search:next?'?next='+encodeURIComponent(next):'',href:'https://example.test/ECHS-Math/login.html'+(next?'?next='+encodeURIComponent(next):''),replace:url=>redirects.push(url)},localStorage:{getItem:()=>"20260727-school-control-v1"},navigator:{},URL,URLSearchParams,console});
  await vm.runInContext(source,context);
  return{nodes,redirects,client,recover:()=>{configFailed=false;meFailed=false},loginCalls:()=>loginCalls,finishLogin:()=>resolveLogin({role:'student'})};
}
const expired=await loginHarness({failMe:true});assert.equal(expired.nodes.get('loginButton').disabled,false,'Temporary verification failure must leave sign-in usable');assert.equal(expired.nodes.get('loginRetry').hidden,false);assert.match(expired.nodes.get('loginError').textContent,/temporarily/);
const offline=await loginHarness({configurationError:true});assert.equal(offline.nodes.get('loginButton').disabled,true);offline.recover();await offline.nodes.get('loginRetry').handlers.click();assert.equal(offline.nodes.get('loginButton').disabled,false,'Retry can recover configuration loading');
const deep=await loginHarness({existing:{role:'student'},next:'https://example.test/ECHS-Math/lessons/example.html?topic=1.1'});assert.match(deep.redirects[0],/lessons\/example.html\?topic=1.1/);
for(const next of ['https://untrusted.example/','https://example.test/other-app/','login.html']){const h=await loginHarness({existing:{role:'student'},next});assert.match(h.redirects[0],/ECHS-Math\/question-bank\/student.html/,'Unsafe or looping return URLs use the role home')}
const submit=await loginHarness();submit.nodes.get('username').value=' student ';submit.nodes.get('password').value='unchanged-password';
submit.nodes.get('togglePassword').handlers.click();assert.equal(submit.nodes.get('password').type,'text');assert.equal(submit.nodes.get('togglePassword').attributes['aria-pressed'],'true');submit.nodes.get('togglePassword').handlers.click();assert.equal(submit.nodes.get('password').type,'password');
const event={preventDefault(){}};const first=submit.nodes.get('loginForm').handlers.submit(event);await submit.nodes.get('loginForm').handlers.submit(event);assert.equal(submit.loginCalls(),1,'Double submission sends only one sign-in request');submit.finishLogin();await first;assert.match(submit.redirects[0],/student.html/);
console.log('Login recovery: PASS (retry, deep links, redirect safety, password visibility, duplicate submissions)');
