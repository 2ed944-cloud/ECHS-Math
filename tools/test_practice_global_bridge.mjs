import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const bridge=await readFile(new URL('../question-bank/js/practice-global-bridge.js',import.meta.url),'utf8');
const context={console,document:{documentElement:{dataset:{}}}};
context.window=context;
vm.createContext(context);
vm.runInContext('const ECHSBank={name:"bank"}; const ECHSLearning={name:"learning"};',context,{filename:'lexical-practice-globals.js'});
assert.equal(context.window.ECHSBank,undefined,'Lexical const should not be a window property before the bridge');
assert.equal(context.window.ECHSLearning,undefined,'Lexical const should not be a window property before the bridge');
vm.runInContext(bridge,context,{filename:'practice-global-bridge.js'});
assert.equal(context.window.ECHSBank?.name,'bank');
assert.equal(context.window.ECHSLearning?.name,'learning');
assert.equal(context.document.documentElement.dataset.practiceGlobalBridge,'ready');
console.log('Practice lexical-global bridge: PASS');
