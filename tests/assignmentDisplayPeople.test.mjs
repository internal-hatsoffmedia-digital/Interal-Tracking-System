import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';import vm from 'node:vm';
test('Team Work uses permitted assignment display identities when HR rows are hidden',async()=>{
 const tables={task_assignments:[{id:'a',task_id:'t',employee_id:'e',assigned_by:'u'}],tasks:[{id:'t',title:'Client changes'}],employees:[],profiles:[]};
 const supabase={from(table){const q={select(){return q;},order(){return q;},in(){return q;},then(resolve){return Promise.resolve({data:tables[table],error:null}).then(resolve);}};return q;},async rpc(name,args){assert.equal(name,'assignment_display_people');assert.deepEqual(Array.from(args.p_assignments),['a']);return {data:[{id:'e',full_name:'Artist Name',employee_code:'EMP-001',team_id:'team'}],error:null};}};
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync('src/services/tasks/taskAssignments.service.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>({supabase})});
 const [assignment]=await exports.getTaskAssignments();assert.equal(assignment.employee.full_name,'Artist Name');assert.equal(assignment.employee.employee_code,'EMP-001');assert.equal(assignment.employee.email,'');
});
