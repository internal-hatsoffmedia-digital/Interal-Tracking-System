import {test} from 'node:test';
import assert from 'node:assert/strict';
import {employeeIdentity,buildProvisionPlan} from '../scripts/employee-account-plan.mjs';
const employee=(id,name,profile_id=null)=>({id,full_name:name,profile_id,is_active:true,team_id:'team'});
test('requested email and initial password convention',()=>{const x=employeeIdentity('vijay Kumar');assert.equal(x.email,'vijayr@hatsoffmedia.in');assert.equal(x.password,'Vijay41@');});
test('duplicate first names abort provisioning instead of claiming another account',()=>{assert.throws(()=>buildProvisionPlan([employee('1','Vijay A'),employee('2','Vijay B')],[],[]),/Duplicate/);});
test('unlinked existing email cannot be adopted without trusted provisioning marker',()=>{assert.throws(()=>buildProvisionPlan([employee('1','Snega')],[{id:'x',email:'snega@hatsoffmedia.in',user_metadata:{hatsoff_employee_id:'1'}}],[]),/unlinked account/);});
test('existing linked accounts preserved; new Web Runners members have intended roles',()=>{
 const p=buildProvisionPlan([employee('1','Vijay','u'),employee('2','Nadeem'),employee('3','Snega')],[{id:'u',email:'existing@example.test'}],[{id:'u',role:'employee'}]);
 assert.equal(p[0].action,'keep_existing');assert.equal(p[0].role,'associate_lead');assert.ok(p.every(x=>x.web));assert.equal(p[1].role,'employee');
});
test('partial provisioning can resume only through trusted app metadata',()=>{const p=buildProvisionPlan([employee('1','Snega')],[{id:'u',email:'snega@hatsoffmedia.in',app_metadata:{hatsoff_employee_id:'1'}}],[]);assert.equal(p[0].action,'resume_link');});
test('privileged Web accounts require review before changing role',()=>{assert.throws(()=>buildProvisionPlan([employee('1','Vijay','u')],[{id:'u',email:'vijayr@hatsoffmedia.in'}],[{id:'u',role:'admin'}]),/privileged/);});
