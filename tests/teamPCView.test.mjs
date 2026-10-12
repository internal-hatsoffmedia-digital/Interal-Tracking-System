import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/teamPCView.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Set,Map});
test('Team PC composes coordinator, team, employee, project and status filters without inventing people',()=>{
 const members=[{id:'video',team_id:'cut'},{id:'design',team_id:'creative'},{id:'idle',team_id:'cut'}];const tasks=[{id:'t1',project_id:'p1'},{id:'t2',project_id:'p2'}];
 const rows=[{id:'a',employee_id:'video',assigned_by:'pc1',task_id:'t1',status:'assigned'},{id:'b',employee_id:'design',assigned_by:'pc2',task_id:'t2',status:'completed'},{id:'c',employee_id:'video',assigned_by:'pc2',task_id:'t2',status:'in_progress'},{id:'legacy',employee_id:'not-verified',assigned_by:'pc1',task_id:'t1',status:'assigned'}];
 const base={team:'',employee:'',coordinator:'',project:''};const ids=f=>Array.from(exports.filterTeamAssignments(rows,members,tasks,{...base,...f}),r=>r.id);
 assert.deepEqual(ids({}),['a','b','c']);assert.deepEqual(ids({team:'cut',coordinator:'pc2',project:'p2'}),['c']);assert.deepEqual(ids({employee:'design',status:'completed'}),['b']);assert.deepEqual(ids({team:'cut',employee:'design'}),[]);assert.deepEqual(ids({employee:'idle'}),[]);assert.deepEqual(ids({project:'missing'}),[]);assert.equal(rows.length,4);
});
