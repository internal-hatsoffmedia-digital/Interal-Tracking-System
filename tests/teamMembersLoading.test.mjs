import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(relative, imports = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => { if (!(name in imports)) throw new Error('Unexpected import: '+name); return imports[name]; }, console });
  return exports;
}

test('team members use membership FK when a user can also lead a team', async () => {
  let selected;
  const profiles = [
    {id:'abc-def',full_name:'Member',email:'member@example.test',role:'employee',team_id:'member-team',is_active:false,created_at:'2026-09-24',employees:[{employee_code:'EMP-001',job_title:'Designer'}],teams:{id:'member-team',name:'Creative'}},
    {id:'123-456',full_name:'Lead',role:'team_lead',team_id:null,is_active:true,employees:null,teams:null},
  ];
  const supabase = {from(table) {
    assert.equal(table,'profiles');
    return {select(query) {selected=query;return {order:async()=> {
      // Mimic PostgREST with both membership and leadership foreign keys.
      if (/\bteams\s*\(/.test(query)) return {data:null,error:{code:'PGRST201',message:'Ambiguous profiles/teams relationship'}};
      return {data:profiles,error:null};
    }}}};
  }};
  const {getTeamMembers}=load('../src/services/team-members/teamMembers.service.ts',{'../../lib/supabase':{supabase}});
  const members=await getTeamMembers();
  assert.match(selected,/teams!profiles_team_id_fkey/);
  assert.match(selected,/employees!employees_profile_id_fkey/);
  assert.equal(members.length,2);
  assert.equal(members[0].team_name,'Creative');
  assert.equal(members[0].employee_code,'EMP-001');
  assert.equal(members[0].job_title,'Designer');
  assert.equal(members[0].is_active,false);
  assert.equal(members[1].team_name,null);
  assert.equal(members[1].employee_code,'EMP-123456');
});

test('Supabase error objects retain their actionable message and code',()=>{
  const {errorMessage}=load('../src/lib/errorMessage.ts');
  assert.equal(errorMessage({message:'Ambiguous relationship',code:'PGRST201'},'Fallback'),'Ambiguous relationship (PGRST201)');
  assert.equal(errorMessage(new Error('Network failed'),'Fallback'),'Network failed');
  for(const value of [null,undefined,{}, {message:7}, {message:' '}])assert.equal(errorMessage(value,'Fallback'),'Fallback');
});

 test('new Manager uses audited access RPC and the created Auth UUID',async()=>{
 let promoted=false;const account={id:'auth-id',role:'director',team_id:null,sales_access:null};
 const supabase={functions:{invoke:async(name,{body})=>{assert.equal(body.role,'director');return {data:{user:{id:'auth-id'}},error:null}}},rpc:async(name,args)=>{if(name==='admin_access_directory')return {data:{accounts:[account]},error:null};assert.equal(name,'admin_set_access');assert.equal(args.p_account,'auth-id');assert.equal(args.p_role,'manager');assert.equal(args.p_expected.role,'director');promoted=true;return {error:null}},from(){return {select(){return {order:async()=>({data:[{id:'auth-id',full_name:'Manager',role:promoted?'manager':'director',created_at:'2026-10-06'}],error:null})}}}}};
 const {createTeamMember}=load('../src/services/team-members/teamMembers.service.ts',{'../../lib/supabase':{supabase}});
 const accountResult=await createTeamMember({full_name:'Manager',email:'manager@example.test',password:'test-only-password',role:'manager'});assert.equal(accountResult.role,'manager');assert.equal(promoted,true);
 });
