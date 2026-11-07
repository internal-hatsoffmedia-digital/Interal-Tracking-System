import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const api={};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/commitmentCountdown.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:api,Date});
const end=Date.parse('2026-11-07T13:30:00+05:30'),deadline=new Date(end).toISOString();
test('countdown uses the exact committed timestamp, handles days and stops at zero',()=>{
 assert.equal(api.commitmentCountdown(deadline,end-3600000),'01:00:00');
 assert.equal(api.commitmentCountdown(deadline,end-600000),'00:10:00');
 assert.equal(api.commitmentCountdown(deadline,end-1),'00:00:01');
 assert.equal(api.commitmentCountdown(deadline,end),'Time ended');
 assert.equal(api.commitmentCountdown(deadline,end+1000),'Time ended');
 assert.equal(api.commitmentCountdown(deadline,end-90061000),'1d 01:01:01');
 assert.equal(api.commitmentCountdown(null,end),'No committed time');
 assert.equal(api.deadlineStage('bad',end),null);
});
test('reminders fire at one hour, ten minutes and end, using only the most urgent stage',()=>{
 assert.equal(api.deadlineStage(deadline,end-3600001),null);
 assert.equal(api.nextReminder(deadline,end-3600000,0),'hour');
 assert.equal(api.nextReminder(deadline,end-3599000,1),null);
 assert.equal(api.nextReminder(deadline,end-600000,1),'ten_minutes');
 assert.equal(api.nextReminder(deadline,end-599999,2),null);
 assert.equal(api.nextReminder(deadline,end,2),'ended');
 assert.equal(api.nextReminder(deadline,end+10000,3),null);
 assert.equal(api.nextReminder(deadline,end-120000,0),'ten_minutes');
});
test('completed and rejected work stops countdown; rescheduling and users isolate reminders',()=>{
 assert.equal(api.commitmentCountdown(deadline,end-600000,'completed'),'Completed');
 assert.equal(api.commitmentCountdown(deadline,end,'in_progress',deadline),'Completed');
 assert.equal(api.commitmentCountdown(deadline,end,'rejected'),'Rejected');
 assert.notEqual(api.reminderKey('u','a',deadline),api.reminderKey('v','a',deadline));
 assert.notEqual(api.reminderKey('u','a',deadline),api.reminderKey('u','a',new Date(end+600000).toISOString()));
});

test('reminder popup deduplicates refreshes, escalates once and clears completed assignments',async()=>{
 const React=await import('react');
 const {renderToStaticMarkup}=await import('react-dom/server');
 const jsx=await import('react/jsx-runtime');
 let now=end-3600000;
 let work=[{assignment_id:'a',task_title:'Design export',due_date:deadline,assignment_status:'in_progress',task_status:'in_progress',completed_at:null}];
 let state={user:'',items:[]},effect,check,poll;
 const storage=new Map(),seen={current:new Map()};
 const modules={
 'react':{useState:()=>[state,fn=>{state=typeof fn==='function'?fn(state):fn;}],useRef:()=>seen,useEffect:fn=>{effect=fn;}},
 'react/jsx-runtime':jsx,
 'react-router-dom':{Link:({children})=>React.createElement('a',null,children)},
 '../../context/AuthContext':{useAuth:()=>({profile:{id:'u',is_active:true}})},
 '../../services/tasks/myWork.service':{getMyWork:async()=>work},
 '../../lib/commitmentCountdown':api,
 };
 const exports={};
 const window={setInterval(fn,ms){if(ms===1000)check=fn;else poll=fn;return ms;},addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(ts.transpileModule(readFileSync('src/components/commitments/CommitmentReminders.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>modules[n],window,Date:{now:()=>now},clearInterval(){},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},Map,Set});
 const render=()=>renderToStaticMarkup(exports.default());
 render();const cleanup=effect();await new Promise(setImmediate);
 assert.equal(state.items.length,1);assert.equal(state.items[0].stage,'hour');
 assert.match(render(),/within the next hour/);
 state={user:'u',items:[]};check();assert.equal(state.items.length,0);
 now=end-600000;check();assert.equal(state.items[0].stage,'ten_minutes');
 state={user:'u',items:[]};check();assert.equal(state.items.length,0);
 now=end;check();assert.equal(state.items[0].stage,'ended');
 state={user:'u',items:[]};check();assert.equal(state.items.length,0);
 work=[{...work[0],assignment_status:'completed',completed_at:deadline}];
 poll();await new Promise(setImmediate);assert.equal(state.items.length,0);cleanup();
});
