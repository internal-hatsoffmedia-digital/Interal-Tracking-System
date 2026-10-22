import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const src=ts.transpile(await readFile('src/lib/taskTimerReport.ts','utf8'),{module:ts.ModuleKind.ESNext});const {taskTimerSummary}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
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
