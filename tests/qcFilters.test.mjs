import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const code=ts.transpile(await readFile('src/lib/qcFilters.ts','utf8'),{module:ts.ModuleKind.ESNext});
const {qcDay,matchesQCFilters}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('QC filters include all work by default and combine employee/date bounds in IST',()=>{
 const row={updated_at:'2026-10-20T20:00:00Z',assignees:[{id:'a',name:'Artist'}]};
 assert.equal(qcDay(row.updated_at),'2026-10-21');
 assert.equal(matchesQCFilters(row,'','',''),true);
 assert.equal(matchesQCFilters(row,'a','2026-10-21','2026-10-21'),true);
 assert.equal(matchesQCFilters(row,'b','2026-10-21','2026-10-21'),false);
 assert.equal(matchesQCFilters(row,'a','','2026-10-20'),false);
 assert.equal(matchesQCFilters(row,'','2026-10-22',''),false);
 const undated={assignees:[]};
 assert.equal(matchesQCFilters(undated,'','',''),true);
 assert.equal(matchesQCFilters(undated,'','2026-10-21',''),false);
 assert.equal(qcDay('invalid'),'');
});
