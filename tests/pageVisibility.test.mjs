import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const code=ts.transpile(await readFile('src/lib/pageVisibility.ts','utf8'),{module:ts.ModuleKind.ESNext});
const {rolePageDefault,pageVisible}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('employee defaults hide management pages and planner; coordinators cannot open Sales',()=>{
 for(const page of ['teams','employees','planner','sales'])assert.equal(rolePageDefault('employee',page),false);
 for(const page of ['dashboard','my-work','daily-desk','qc'])assert.equal(rolePageDefault('employee',page),true);
 assert.equal(rolePageDefault('project_coordinator','sales'),false);
 for(const role of ['admin','manager','director','associate_lead'])assert.equal(rolePageDefault(role,'planner'),true);
});
test('member overrides are configurable but cannot grant Sales to restricted roles',()=>{
 assert.equal(pageVisible('employee','planner',true),true);
 assert.equal(pageVisible('employee','planner',null),false);
 assert.equal(pageVisible('manager','projects',false),false);
 for(const role of ['employee','project_coordinator'])assert.equal(pageVisible(role,'sales',true),false);
 assert.equal(pageVisible(undefined,'dashboard'),false);
});
