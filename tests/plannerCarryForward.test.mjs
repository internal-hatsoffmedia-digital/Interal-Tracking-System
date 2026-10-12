import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const source=await readFile('src/lib/plannerCarryForward.ts','utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;const {plannerDay}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('unfinished planned work follows today without modifying its commitment or duplicating tasks',()=>{
 const t={id:'a',planned_date:'2026-10-12',due_date:'2026-10-12',status:'editing_in_progress'};
 assert.equal(plannerDay(t,'2026-10-13'),'2026-10-13');assert.equal(plannerDay(t,'2026-10-14'),'2026-10-14');assert.equal(t.planned_date,'2026-10-12');assert.equal(t.due_date,'2026-10-12');
 assert.equal(plannerDay({...t,status:'approved_delivered'},'2026-10-14'),'2026-10-12');assert.equal(plannerDay({...t,planned_date:'2026-10-20'},'2026-10-14'),'2026-10-20');assert.equal(plannerDay({...t,planned_date:null},'2026-10-14'),null);
});
test('completed projects stop their unfinished tasks from carrying forward',()=>assert.equal(plannerDay({planned_date:'2026-10-12',status:'editing_in_progress',project:{status:'completed'}},'2026-10-13'),'2026-10-12'));
