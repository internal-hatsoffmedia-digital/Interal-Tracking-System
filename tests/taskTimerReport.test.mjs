import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const src=ts.transpile(await readFile('src/lib/taskTimerReport.ts','utf8'),{module:ts.ModuleKind.ESNext});const {taskTimerSummary,projectFocusSummary}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
test('task timer totals exclude pauses, keep first start and only show employee completion as end',()=>{
 const rows=[{started_at:'2026-10-22T04:30:00Z',ended_at:'2026-10-22T05:30:00Z',completed_at:'2026-10-22T08:30:00Z'},{started_at:'2026-10-22T07:30:00Z',ended_at:'2026-10-22T08:30:00Z',completed_at:'2026-10-22T08:30:00Z'}];
 assert.deepEqual(taskTimerSummary(rows,'',Date.parse('2026-10-22T10:00:00Z')),{start:rows[0].started_at,end:rows[0].completed_at,hours:2,count:2});
 assert.equal(taskTimerSummary(rows.map(r=>({...r,completed_at:null}))).end,null);
});
test('running time stops at IST midnight and day filter does not combine work dates',()=>{
 const rows=[{started_at:'2026-10-21T18:00:00Z',ended_at:null,completed_at:null},{started_at:'2026-10-22T04:30:00Z',ended_at:null,completed_at:null}];
 assert.equal(taskTimerSummary(rows,'2026-10-21',Date.parse('2026-10-22T05:00:00Z')).hours,.5);
 assert.equal(taskTimerSummary(rows,'2026-10-22',Date.parse('2026-10-22T05:00:00Z')).hours,.5);
});

test('project focus keeps task and project-only hours separate without duplicating shared project time',()=>{
 const base={project_id:'p1',project_code:'HM001',project_name:'Video 2',employee_id:'e1',employee_name:'Artist',employee_code:'EMP-017',completed_at:null};
 const rows=[{...base,id:'s1',assignment_id:'a1',started_at:'2026-10-20T04:30:00Z',ended_at:'2026-10-20T05:30:00Z'},{...base,id:'s2',assignment_id:null,started_at:'2026-10-20T06:30:00Z',ended_at:'2026-10-20T07:30:00Z'},{...base,id:'s3',assignment_id:'a2',started_at:'2026-10-20T08:30:00Z',ended_at:'2026-10-20T09:00:00Z'},{...base,employee_id:'e2',id:'s4',assignment_id:null,started_at:'2026-10-20T08:30:00Z',ended_at:'2026-10-20T09:00:00Z'}];
 const totals=projectFocusSummary(rows,'2026-10-20',Date.parse('2026-10-21T00:00:00Z'));assert.equal(totals.length,2);const a=totals.find(p=>p.key==='p1:e1');assert.equal(a.taskHours,1.5);assert.equal(a.projectHours,1);assert.equal(a.hours,2.5);assert.equal(projectFocusSummary(rows,'2026-10-21').length,0);
});
