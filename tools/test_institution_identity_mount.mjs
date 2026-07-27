#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(new URL("../js/institution-client.js",import.meta.url),"utf8");

function makeStorage(){
  const values=new Map();
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key),
  };
}

const localStorage=makeStorage();
const sessionStorage=makeStorage();
localStorage.setItem("echs_institution_token_v1","test-token");
localStorage.setItem("echs_institution_expires_v1",new Date(Date.now()+3600000).toISOString());

let rootWriteCount=0;
const htmlRoot={dataset:{},get textContent(){return "DOCUMENT-SENTINEL"},set textContent(_value){rootWriteCount++}};
const headRoot={};
const bodyRoot={classList:{contains:()=>false},prepend:()=>{}};
const roleBadge={textContent:"pending"};
const nameNode={textContent:""};
const usernameNode={textContent:""};
const orgNode={textContent:""};
const initialsNode={textContent:""};

const selectorMap=new Map([
  ["[data-institution-name]",[nameNode]],
  ["[data-institution-username]",[usernameNode]],
  ["[data-institution-role]",[htmlRoot,roleBadge]],
  ["[data-institution-org]",[orgNode]],
  ["[data-institution-initials]",[initialsNode]],
  ["[data-institution-logout]",[]],
]);

const account={
  id:"admin-1",
  display_name:"Mohammad Abu-Ghuwaleh",
  username:"abughuwaleh",
  email:"mabughuwaleh@qf.org.qa",
  role:"admin",
  organization_name:"Education City High School",
};

const document={
  currentScript:{src:"https://example.test/ECHS-Math/js/institution-client.js"},
  readyState:"complete",
  documentElement:htmlRoot,
  head:headRoot,
  body:bodyRoot,
  querySelector:()=>null,
  querySelectorAll:selector=>selectorMap.get(selector)||[],
  getElementById:()=>null,
  createElement:()=>({style:{},dataset:{},setAttribute:()=>{},querySelector:()=>({addEventListener:()=>{}})}),
  addEventListener:()=>{},
  dispatchEvent:()=>{},
};

const location={href:"https://example.test/ECHS-Math/question-bank/school-control.html",replace:()=>{throw new Error("Unexpected redirect")},reload:()=>{}};
const fetch=async url=>{
  const href=String(url);
  if(href.endsWith("/config/institution.json"))return{ok:true,status:200,json:async()=>({enabled:true,api_base:"https://example.test/functions/v1"})};
  if(href.endsWith("/account-api/me"))return{ok:true,status:200,json:async()=>({ok:true,account})};
  throw new Error(`Unexpected fetch: ${href}`);
};

const window={addEventListener:()=>{}};
const context={
  URL,
  Headers,
  CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}},
  console,
  document,
  window,
  location,
  localStorage,
  sessionStorage,
  fetch,
  navigator:{onLine:true},
  addEventListener:()=>{},
  innerWidth:1280,
  setTimeout,
  clearTimeout,
};
window.window=window;
Object.assign(window,{document,location,localStorage,sessionStorage,fetch,navigator:context.navigator});

vm.runInNewContext(source,context,{filename:"js/institution-client.js"});
const client=window.ECHSInstitution;
assert.ok(client,"Institution client should initialise");

const authenticated=await client.requireAuth(["admin"]);
assert.equal(authenticated.role,"admin");
assert.equal(htmlRoot.dataset.institutionAccessRole,"admin");
assert.equal(htmlRoot.dataset.institutionRole,undefined,"The document root must not use the text-label attribute");

client.mountIdentity(authenticated);
assert.equal(rootWriteCount,0,"Identity mounting must never write textContent to <html>");
assert.equal(roleBadge.textContent,"admin");
assert.equal(nameNode.textContent,"Mohammad Abu-Ghuwaleh");
assert.equal(usernameNode.textContent,"abughuwaleh");
assert.equal(orgNode.textContent,"Education City High School");
assert.equal(initialsNode.textContent,"MA");

console.log("Institution identity mount regression test: PASS");
