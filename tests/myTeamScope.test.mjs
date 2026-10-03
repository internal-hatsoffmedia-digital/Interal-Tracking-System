import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(profile){
 const calls=[];
 const supabase={auth:{getUser:async()=>({data:{user:{id:'lead'}},error:null})},from(table){
  const filters={};calls.push({table,filters});
  const q={select(){return q},eq(k,v){filters[k]=v;return q},single(){return q},order(){return q},then(resolve){
   let data=profile;
   if(table==='profiles' && filters.team_id){assert.equal(filters.team_id,'own-team');data=[{id:'member',full_name:'Own member'}];}
   if(table==='teams'){assert.equal(filters.id,'own-team');data={id:'own-team',name:'Own team',description:null};}
   if(table==='employees'){assert.equal(filters.team_id,'own-team');data=[{id:'member',full_name:'Own member'}];}
   return Promise.resolve({data,error:null}).then(resolve);
  }};return q;
 }};
 const source=readFileSync(new URL('../src/services/teams/myTeam.service.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:()=>({supabase})});return {get:exports.getMyTeam,calls};
}
test('Associate lead requests only their own team and employee roster',async()=>{
 const {get,calls}=load({role:'associate_lead',team_id:'own-team',is_active:true});
 const data=await get();assert.equal(data.id,'own-team');assert.equal(data.members.length,1);assert.equal(calls[0].filters.id,'lead');
 assert.equal(calls.filter(c=>c.table==='profiles'&&c.filters.team_id==='own-team').length,1);
});
test('Lead without team does not fall back to all teams',async()=>{
 const {get,calls}=load({role:'associate_lead',team_id:null,is_active:true});
 assert.equal(await get(),null);assert.equal(calls.length,1);
});
test('Inactive and non-lead accounts cannot load the My Team roster',async()=>{
 for(const profile of [{role:'employee',team_id:'own-team',is_active:true},{role:'associate_lead',team_id:'own-team',is_active:false}]){
  const {get,calls}=load(profile);await assert.rejects(get(),/available to team leads/);assert.equal(calls.length,1);
 }
});
