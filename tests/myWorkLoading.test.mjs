import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function service({hidden=false,unlinked=false}={}) {
 const seen=[];
 const supabase={auth:{getUser:async()=>({data:{user:{id:'vijay'}},error:null})},rpc:async()=>({data:unlinked?[]:[{id:'employee',profile_id:'vijay',is_active:true}],error:null}),from(table){
  let ids=[],start=0;
  const q={select(){return q},eq(){return q},order(){return q},in(key,values){ids=values;return q},range(offset){start=offset;return q},maybeSingle:async()=>({data:null,error:null}),then(resolve){
   let data=[];
   if(table==='task_assignments')data=Array.from({length:start===0?500:1},(_,i)=>({id:'a'+(i+start),task_id:'t'+(i+start),status:'assigned'}));
   if(table==='tasks'){seen.push(ids);data=hidden?[]:ids.map(id=>({id,title:id}));}
   return Promise.resolve({data,error:null}).then(resolve);
  }};return q;
 }};
 const source=readFileSync(new URL('../src/services/tasks/myWork.service.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:()=>({supabase})});return {api:exports,seen};
}
test('My Work loads all pages and only requested task IDs in bounded batches',async()=>{
 const {api,seen}=service();const result=await api.getMyWork();assert.equal(result.length,501);assert.equal(seen.length,6);assert.ok(seen.every(ids=>ids.length<=100));
});
test('RLS-hidden assigned tasks produce an actionable error instead of vanishing',async()=>{
 await assert.rejects(service({hidden:true}).api.getMyWork(),/hidden by database access rules/);
});
test('Unlinked login fails explicitly without guessing an employee identity',async()=>{
 await assert.rejects(service({unlinked:true}).api.getMyWork(),/No active employee record is linked/);
});