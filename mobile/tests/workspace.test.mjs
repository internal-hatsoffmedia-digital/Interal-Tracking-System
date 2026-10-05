import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const source = readFileSync(new URL(`../src/services/${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) { if (!dependencies[name]) throw new Error(`Unexpected dependency ${name}`); return dependencies[name]; } });
  return exports;
}
const access = load('access.ts');
const profile = { id: 'person', full_name: 'Person', email: 'person@example.test', role: 'project_coordinator', team_id: 'coordination', is_active: true };
function database(rows = {}, user = { id: 'person' }) {
  const writes = [];
  const supabase = { auth: { getUser: async () => ({ data: { user }, error: null }) }, from(table) {
    const filters = {}; let input;
    const query = { select() { return query; }, eq(key,value) { filters[key]=value;return query; }, maybeSingle() { return query; }, single() { return query; },
      insert(value) { input=value;writes.push({table,value});return query; },
      then(resolve,reject) { return Promise.resolve(input ? { data: { id:'created',...input },error:null } : (rows[table] || {data:null,error:null})).then(resolve,reject); } };
    return query;
  } };
  return { supabase, writes };
}
test('missing, inactive and unsupported profiles are denied', () => {
  assert.throws(() => access.requireActiveProfile(null), /missing/);
  assert.throws(() => access.requireActiveProfile({...profile,is_active:false}), /inactive/);
  assert.throws(() => access.requireActiveProfile({...profile,role:'unknown'}), /unsupported/);
});
test('employee/director reads do not expose work-management actions', () => {
  for (const role of ['employee','director','team_lead']) assert.equal(access.canManageWork({...profile,role}),false);
  for (const role of ['admin','associate_lead','project_coordinator']) assert.equal(access.canManageWork({...profile,role}),true);
  assert.equal(access.canManageWork({...profile,is_active:false}),false);
});
function projects(db, current = profile) {
  return load('projects.service.ts', {'./supabase':db,'./access':access,'./profile.service':{getWorkspaceProfile:async()=>current}});
}
const input = {name:'Test',client_id:'client',status:'planning',health:'on_track',invoice_status:'pending_billing'};
test('coordinator project creation carries the verified team identity', async () => {
  const db = database(); const service = projects(db);
  await service.createProject(input);
  assert.equal(db.writes[0].value.team_id,'coordination');
  assert.equal(db.writes[0].value.created_by,'person');
});
test('missing coordinator team and employee role fail before writing a project', async () => {
  for (const current of [{...profile,team_id:null},{...profile,role:'employee'}]) {
    const db=database();await assert.rejects(projects(db,current).createProject(input),/team is missing|cannot create/);assert.equal(db.writes.length,0);
  }
});
test('invalid asset totals fail before writing a project', async () => {
  for (const counts of [{total_assets_required:2,completed_assets:3},{total_assets_required:NaN}]) {
    const db=database();await assert.rejects(projects(db).createProject({...input,...counts}),/Asset counts/);assert.equal(db.writes.length,0);
  }
});
test('task creation rejects a mismatched or archived project', async () => {
  for (const project of [{client_id:'other',is_active:true},{client_id:'client',is_active:false}]) {
    const db=database({projects:{data:project,error:null}});
    const service=load('tasks.service.ts',{'./supabase':db});
    await assert.rejects(service.createTask({project_id:'project',client_id:'client',title:'Test'}),/match|active project/);
    assert.equal(db.writes.length,0);
  }
});
test('timesheets require a linked active employee and valid hours', async () => {
  for (const employee of [null,{id:'employee',is_active:false}]) {
    const db=database({employees:{data:employee,error:null}});
    await assert.rejects(load('timesheet.service.ts',{'./supabase':db}).createTimesheet({total_hours:2}),/active linked employee/);
    assert.equal(db.writes.length,0);
  }
  const db=database();const service=load('timesheet.service.ts',{'./supabase':db});
  for(const total_hours of [0,-1,25,NaN]) await assert.rejects(service.createTimesheet({total_hours}),/Hours/);
  assert.equal(db.writes.length,0);
});
test('timesheets use employee identity rather than substituting the Auth ID', async () => {
  const db=database({employees:{data:{id:'employee',is_active:true},error:null}});
  await load('timesheet.service.ts',{'./supabase':db}).createTimesheet({total_hours:2,task_id:'task'});
  assert.equal(db.writes[0].value.employee_id,'employee');
});
test('coordinator activity attributes assignments to their creator and counts tasks once', () => {
  const {coordinatorMetrics}=load('coordinatorMetrics.ts');
  const result=coordinatorMetrics([{id:'lavanya',full_name:'Lavanya'},{id:'esther',full_name:'Esther'}],
    [{id:'project',name:'Project',created_by:'lavanya',status:'planning'}],
    [{id:'task1',title:'Due yesterday',project_id:'project',created_by:'lavanya',status:'editing_in_progress',due_date:'2026-10-02'},
     {id:'task2',title:'Delivered',project_id:'project',created_by:'lavanya',status:'approved_delivered',due_date:'2026-10-01'},
     {id:'task3',title:'Due today',project_id:'other',created_by:'esther',status:'not_started',due_date:'2026-10-03'}],
    [{id:'a1',task_id:'task1',assigned_by:'lavanya',status:'assigned'},{id:'a2',task_id:'task1',assigned_by:'lavanya',status:'accepted'}],
    '2026-10-03');
  assert.equal(result[0].projects.length,1);assert.equal(result[0].assignmentsMade,2);
  assert.equal(result[0].pending,1);assert.equal(result[0].completed,1);assert.equal(result[0].overdue,1);
  assert.equal(result[1].pending,1);assert.equal(result[1].overdue,0);assert.equal(result[1].assignmentsMade,0);
});
test('employee cannot submit assignment writes', async () => {
  const db=database();
  const service=load('assignments.service.ts',{'./supabase':db,'./access':access,'./profile.service':{getWorkspaceProfile:async()=>({...profile,role:'employee'})}});
  await assert.rejects(service.assignTask('task','worker'),/cannot assign/);assert.equal(db.writes.length,0);
});
test('assignment provenance uses the authenticated coordinator', async () => {
  const db=database({employees:{data:{id:'worker',is_active:true},error:null}});
  const service=load('assignments.service.ts',{'./supabase':db,'./access':access,'./profile.service':{getWorkspaceProfile:async()=>profile}});
  await service.assignTask('task','worker');assert.equal(db.writes[0].value.assigned_by,'person');assert.equal(db.writes[0].value.employee_id,'worker');
});

test('workspace paging preserves team filter and loads every page', async () => {
  const calls=[];
  const supabase={from(table){let page=0;const filters={};const query={select(){return query;},order(){return query;},eq(column,value){filters[column]=value;return query;},range(start,end){page=start;calls.push({table,start,end,filters});return query;},then(resolve){return Promise.resolve({data:page===0?Array.from({length:500},(_,id)=>({id})): [{id:500}],error:null}).then(resolve);}};return query;}};
  const {workspaceRows}=load('workspaceData.ts',{'./supabase':{supabase}});
  const rows=await workspaceRows('employees','id',{column:'team_id',value:'team-one'});
  assert.equal(rows.length,501);
  assert.equal(calls.length,2);
  assert.equal(calls[1].start,500);
  assert.equal(calls[0].filters.team_id,'team-one');
  assert.equal(calls[1].filters.team_id,'team-one');
});
test('workspace reads surface backend errors instead of reporting empty data', async () => {
  const query={select(){return query;},order(){return query;},range(){return query;},then(resolve){return Promise.resolve({data:null,error:{message:'permission denied'}}).then(resolve);}};
  const {workspaceRows}=load('workspaceData.ts',{'./supabase':{supabase:{from(){return query;}}}});
  await assert.rejects(()=>workspaceRows('tasks','id'),/permission denied/);
});

test('report dates reject impossible calendar days and retain leap days', () => {
 const {validDate}=load('workspaceData.ts',{'./supabase':{supabase:{}}});
 assert.equal(validDate('2026-02-30'),false);
 assert.equal(validDate('2026-13-01'),false);
 assert.equal(validDate('2024-02-29'),true);
 assert.equal(validDate('2026-10-03'),true);
});

test('performance failures cannot appear as fabricated success metrics', async () => {
 const query={select(){return query;},order(){return Promise.resolve({data:null,error:{message:'missing evaluation table'}});}};
 const {getPerformanceRecords}=load('performance.service.ts',{'./supabase':{supabase:{from(){return query;}}}});
 await assert.rejects(()=>getPerformanceRecords(),/missing evaluation table/);
});
