import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('employee directory and assignment options exclude unlinked historical records',async()=>{
 const records=[{id:'legacy',profile_id:null,is_active:true},{id:'linked',profile_id:'account',is_active:true},{id:'inactive',profile_id:'other',is_active:false}];
 const supabase={from(){let linked=false,active=false;const query={select(){return query},not(column,operator,value){assert.equal(column,'profile_id');assert.equal(operator,'is');assert.equal(value,null);linked=true;return query},eq(column,value){assert.equal(column,'is_active');active=value;return query},order(){assert.equal(linked,true);return Promise.resolve({data:records.filter(r=>r.profile_id&&(!active||r.is_active)),error:null})}};return query}};
 const source=readFileSync(new URL('../src/services/employees/employees.service.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:()=>({supabase})});
 assert.deepEqual(Array.from(await exports.getEmployees(),e=>e.id),['linked','inactive']);
 assert.deepEqual(Array.from(await exports.getActiveEmployees(),e=>e.id),['linked']);
});
