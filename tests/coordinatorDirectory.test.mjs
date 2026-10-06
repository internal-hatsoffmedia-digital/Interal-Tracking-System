import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/coordinatorDirectory.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
test('coordinator options follow role and team, not names, within viewer scope',()=>{
const people=[['a','New coordinator','project_coordinator','flow',true],['b','Production supervisor','associate_lead','flow',true],['c','Other lead','associate_lead','video',true],['d','Inactive coordinator','project_coordinator','flow',false],['e','Unassigned employee','employee','flow',true],['f','Other coordinator','project_coordinator','other',true]].map(([id,full_name,role,team_id,is_active])=>({id,full_name,role,team_id,is_active}));
const teams=[{id:'flow',name:'Coordination',team_type:'project_coordination'}];
assert.equal(JSON.stringify(exports.coordinatorDirectory(people,teams,{role:'associate_lead',team_id:'flow'}).map(p=>p.id)),JSON.stringify(['a','b']));
assert.equal(exports.coordinatorDirectory(people,teams,{role:'admin',team_id:null}).length,3);
people[4].role='project_coordinator';assert.equal(exports.coordinatorDirectory(people,teams,{role:'associate_lead',team_id:'flow'}).length,3);
});
