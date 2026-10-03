import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('Active assignee list includes both lead roles using employee IDs',async()=>{
 const rows=['employee','team_lead','associate_lead'].map((role,i)=>({id:'employee-'+i,profile_id:'login-'+i,full_name:role,is_active:true,profiles:{role},teams:{id:'team',name:'Team'}}));
 const supabase={from(table){assert.equal(table,'employees');return {select(query){assert.match(query,/profiles!employees_profile_id_fkey/);assert.match(query,/teams!employees_team_id_fkey/);return {eq(key,value){assert.equal(key,'is_active');assert.equal(value,true);return {order:async()=>({data:rows,error:null})}}}}}}};
 const source=readFileSync(new URL('../src/services/employees/employees.service.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:()=>({supabase})});
 const actual=await exports.getActiveEmployees();assert.equal(actual.length,3);assert.equal(actual[1].id,'employee-1');assert.equal(actual[1].account_role,'team_lead');assert.equal(actual[2].account_role,'associate_lead');
});