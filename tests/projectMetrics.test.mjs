import { test } from 'node:test';
import assert from 'node:assert/strict';
import { missingFields, summarizeProjects, isOverdue, csvCell } from '../src/lib/projectMetrics.ts';
const project = { name:'Launch', client_id:'client', project_members:[{access_kind:'assignee',profile_id:'one'}],
  target_deadline:'2026-09-06',start_date:'2026-09-01',status:'in_progress',team_id:'team',assigned_by:'lead',is_active:true };
test('completion uses status, not project health or archive flag',()=>{
  const stats=summarizeProjects([project,{...project,status:'completed'},{...project,is_active:false},{...project,status:'on_hold'}]);
  assert.equal(stats.completed,1);assert.equal(stats.ongoing,2);assert.equal(stats.onHold,1);assert.equal(stats.completionRate,25);
});
test('missing relationships are not misreported as missing source IDs',()=>{
  assert.deepEqual(missingFields({...project,client:null}),[]);
  assert.deepEqual(missingFields({...project,assigned_by:null,project_members:[]}),['Assignee','Assignment provenance']);
});
test('overdue uses calendar deadlines, excluding completed and archived projects',()=>{
  assert.equal(isOverdue(project,'2026-09-06'),false);
  assert.equal(isOverdue(project,'2026-09-07'),true);
  assert.equal(isOverdue({...project,status:'completed'},'2026-09-07'),false);
  assert.equal(isOverdue({...project,is_active:false},'2026-09-07'),false);
});
test('CSV escapes quotes, newlines, commas, and spreadsheet formulas',()=>{
  assert.equal(csvCell('a,"b"\nc'),'"a,""b""\nc"');
  assert.equal(csvCell(' =HYPERLINK("x")'),'"\' =HYPERLINK(""x"")"');
});
test('empty report completion rate is zero',()=>assert.equal(summarizeProjects([]).completionRate,0));
