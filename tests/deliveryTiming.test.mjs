import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliveryMinutes,monthlyTiming,indiaMonth} from '../src/lib/deliveryTiming.ts';
const row=(id,deadline_at,completed_at,employee_id='editor',status='completed')=>({id,deadline_at,completed_at,employee_id,status});
test('90 minutes late minus 60 minutes early is 30 minutes net delay',()=>{
 const rows=[row('one','2026-10-05T17:00:00+05:30','2026-10-05T18:30:00+05:30'),row('two','2026-10-05T16:30:00+05:30','2026-10-05T15:30:00+05:30')];
 const [total]=monthlyTiming(rows,'2026-10');assert.equal(total.lateMinutes,90);assert.equal(total.earlyMinutes,60);assert.equal(total.netMinutes,30);
});
test('two one-hour delays add to two hours and never offset another editor',()=>{
 const totals=monthlyTiming([row('one','2026-10-05T17:00:00+05:30','2026-10-05T18:00:00+05:30'),row('two','2026-10-05T17:00:00+05:30','2026-10-05T18:00:00+05:30'),row('other','2026-10-05T17:00:00+05:30','2026-10-05T15:00:00+05:30','other')],'2026-10');
 assert.equal(totals[0].netMinutes,120);assert.equal(totals[1].netMinutes,-120);
});
test('deadline month uses IST and retains completions across month boundary',()=>{
 assert.equal(indiaMonth('2026-09-30T19:00:00Z'),'2026-10');
 assert.equal(monthlyTiming([row('one','2026-10-31T23:30:00+05:30','2026-11-01T00:30:00+05:30')],'2026-10')[0].netMinutes,60);
});
test('missing timestamps and unfinished work never become early credit',()=>{
 assert.equal(deliveryMinutes(null,'2026-10-01T10:00:00Z'),null);assert.equal(deliveryMinutes('broken','2026-10-01T10:00:00Z'),null);
 const [total]=monthlyTiming([row('one','2026-10-01T17:00:00+05:30',null),row('two','2026-10-01T17:00:00+05:30',null,'editor','in_progress')],'2026-10');
 assert.equal(total.missing,1);assert.equal(total.pending,1);assert.equal(total.netMinutes,0);
});
