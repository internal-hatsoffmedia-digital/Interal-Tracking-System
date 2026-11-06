import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const source=await readFile('src/lib/workDateRange.ts','utf8');const {indiaDay,workDatePreset,inWorkRange}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext})).toString('base64'));
test('date presets use IST and Monday week boundaries across months',()=>{const now=new Date('2026-10-31T20:00:00Z');assert.equal(indiaDay(now),'2026-11-01');assert.deepEqual(workDatePreset('today',now),{from:'2026-11-01',through:'2026-11-01'});assert.deepEqual(workDatePreset('week',now),{from:'2026-10-26',through:'2026-11-01'});assert.deepEqual(workDatePreset('monday',now),{from:'2026-10-26',through:'2026-10-26'});});
test('inclusive date ranges compare timestamps in IST and reject absent or invalid dates',()=>{const range={from:'2026-11-01',through:'2026-11-01'};assert.equal(inWorkRange('2026-10-31T19:00:00Z',range),true);assert.equal(inWorkRange('2026-11-01',range),true);assert.equal(inWorkRange('2026-11-01T19:00:00Z',range),false);assert.equal(inWorkRange(null,range),false);assert.equal(inWorkRange('bad',range),false);assert.equal(inWorkRange('2026-11-01',{from:'2026-11-02',through:'2026-11-01'}),false);});

test('all dates includes projects with delivery dates in earlier and later months',()=>{
 const range=workDatePreset('all');
 assert.equal(inWorkRange('2026-10-20',range),true);
 assert.equal(inWorkRange('2026-12-10',range),true);
});
