import {test} from 'node:test';
import assert from 'node:assert/strict';
import {salesSummary,followUpGroup,sourceChannels} from '../src/lib/salesMetrics.ts';
const lead={id:'one',name:'Example',company:'Test',ownerId:'owner',ownerName:'Owner',source:'Cold Call',stage:'lead',createdOn:'2026-09-01',wonOn:null,revenue:0,nextFollowUp:'2026-09-05'};
test('sales revenue uses won month while pipeline uses lead creation month',()=>{
  const data={leads:[lead,{...lead,id:'two',createdOn:'2026-08-01',wonOn:'2026-09-03',stage:'won',revenue:500},{...lead,id:'three',stage:'proposal'}],activities:[],monthlyTargets:{'2026-09':1000}};
  assert.deepEqual(salesSummary(data,'2026-09'),{leads:2,prospects:0,proposals:1,won:1,revenue:500,target:1000,achievement:50});
});
test('missing and zero targets do not report fabricated achievement',()=>{
  const data={leads:[],activities:[],monthlyTargets:{}};
  assert.equal(salesSummary(data,'2026-09').achievement,null);
  assert.equal(salesSummary({...data,monthlyTargets:{'2026-09':0}},'2026-09').achievement,null);
});
test('follow-up queue excludes closed leads and classifies calendar dates',()=>{
  assert.equal(followUpGroup(lead,'2026-09-05'),'Today');
  assert.equal(followUpGroup(lead,'2026-09-06'),'Overdue');
  assert.equal(followUpGroup(lead,'2026-09-04'),'Upcoming');
  assert.equal(followUpGroup({...lead,stage:'won'},'2026-09-06'),null);
  assert.equal(followUpGroup({...lead,stage:'lost'},'2026-09-06'),null);
});
test('outbound and campaigns group both sources from the PDF',()=>{
  assert.equal(sourceChannels['Cold Call'],'Outbound');assert.equal(sourceChannels['Cold DM'],'Outbound');
  assert.equal(sourceChannels.Website,'Campaigns');assert.equal(sourceChannels['Digital Mktg'],'Campaigns');
});
