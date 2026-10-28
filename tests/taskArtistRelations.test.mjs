import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const source=await readFile('src/services/tasks/tasks.service.ts','utf8');
async function fixture(directory,employeeRows=[]){
 const tables={tasks:[{id:'t',title:'Carousel-2',project_id:'p'}],clients:[],projects:[{id:'p',name:'Campaign',project_code:'HM001'}],task_assignments:[{id:'a',task_id:'t',employee_id:'lalith',status:'assigned'}],employees:employeeRows,profiles:[]};
 let s=source.replace(/import \{getTaskArtists\} from [^;]+;/,`const getTaskArtists=async()=>${JSON.stringify(directory)};`).replace(/import \{ supabase \} from [^;]+;/,`const tables=${JSON.stringify(tables)};const supabase={from(table){const q={select(){return q},eq(){return q},order(){return q},then(resolve){return Promise.resolve({data:tables[table],error:null}).then(resolve)}};return q}};`);
 return import('data:text/javascript;base64,'+Buffer.from(ts.transpile(s,{module:ts.ModuleKind.ESNext})).toString('base64'));
}
test('task artist names and teams resolve without HR rows for manager, director and coordinator leads',async()=>{
 const service=await fixture([{id:'lalith',profile_id:'u',full_name:'Lalith Balakumar',employee_code:'EMP-054',team_id:'creative',team:{id:'creative',name:'Creative Clan'}}]);
 const [task]=await service.getTasks();assert.equal(task.assignments[0].employee.full_name,'Lalith Balakumar');assert.equal(task.assignments[0].employee.team_name,'Creative Clan');assert.equal(task.assignment.employee.employee_code,'EMP-054');
});
test('employee self-view retains its visible identity when the management directory is empty',async()=>{
 const service=await fixture([],[{id:'lalith',full_name:'Lalith Balakumar',employee_code:'EMP-054',team_id:'creative',profile_id:'u'}]);const [task]=await service.getTasks();assert.equal(task.assignments[0].employee.full_name,'Lalith Balakumar');
});
