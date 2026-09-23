// Stateful mock backend. All external HTTP and WebSocket traffic blocked/intercepted.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const origin='http://127.0.0.1:5173';
const env=await readFile(new URL('../.env',import.meta.url),'utf8');
const backend=new URL(env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const profiles=[{id:id(1),role:'admin',full_name:'Audit Admin'},{id:id(2),role:'employee',full_name:'Audit Worker A'},{id:id(3),role:'employee',full_name:'Audit Worker B'},{id:id(4),role:'team_lead',full_name:'Audit Team Lead'}].map(p=>({...p,email:`audit${p.id.slice(-1)}@example.test`,is_active:true,team_id:id(100)}));
const employees=profiles.map((p,i)=>({...p,id:id(201+i),profile_id:p.id,employee_code:'AUD'+i,job_title:'Production'}));
const clients=[{id:id(50),name:'Audit Client',short_name:'AUD',is_active:true}];
const projects=[{id:id(300),client_id:id(50),name:'Audit Project',team_id:id(100),is_active:true,status:'in_progress',health:'on_track',invoice_status:'pending_billing',created_at:new Date().toISOString(),total_assets_required:10,completed_assets:0,pending_assets:10,project_members:[]}];
let tasks=[{id:id(400),client_id:id(50),project_id:id(300),title:'Audit Assigned Task',description:'Stateful local audit',category:'Shorts / Reels',revision_status:'New File',priority:'medium',status:'not_started',estimated_hours:2,actual_hours:0,is_active:true,planned_date:'2026-09-22',due_date:'2026-09-23',created_at:new Date().toISOString(),updated_at:new Date().toISOString()}];
let assignments=[];const writes=[];const results=[];const errors=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
async function session(profile){
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.routeWebSocket('**/*',ws=>ws.close());
await context.route('**/*',async route=>{
const req=route.request(),u=new URL(req.url());if(u.origin===origin)return route.continue();
if(u.origin!==backend.origin)return route.fulfill({status:200,body:''});
const endpoint=u.pathname.split('/').at(-1),method=req.method();
const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
const filter=rows=>rows.filter(row=>[...u.searchParams].every(([k,v])=>!v.startsWith('eq.')||String(row[k])===v.slice(3)));
const pack=rows=>req.headers().accept?.includes('object+json')?(rows[0]??null):rows;
if(endpoint==='user')return send({...profile,aud:'authenticated'});
if(endpoint==='workspace_access_context')return send({can_manage_projects:profile.role!=='employee',coordinator_lead:profile.role==='team_lead'});
if(endpoint==='project_people')return send(profiles);
if(endpoint==='get_active_projects_for_tasks')return send(projects);
if(endpoint==='get_current_employee_profile')return send(employees.filter(e=>e.profile_id===profile.id));
if(endpoint==='sales_my_access')return send(null);
if(endpoint==='profiles')return send(pack(filter(profiles)));
if(endpoint==='employees')return send(pack(filter(employees)));
if(endpoint==='teams')return send([{id:id(100),name:'Audit Team',is_active:true}]);
if(endpoint==='clients')return send(pack(filter(clients)));
if(endpoint==='projects')return send(pack(filter(projects)));
if(endpoint==='tasks'){
 if(method==='PATCH'){const payload=req.postDataJSON();writes.push({endpoint,method,payload});const selected=filter(tasks);selected.forEach(t=>Object.assign(t,payload));return send(pack(selected));}
 return send(pack(filter(tasks)));
}
if(endpoint==='task_assignments'){
 if(method==='POST'){const payload=req.postDataJSON();writes.push({endpoint,method,payload});const row={id:id(500+assignments.length),status:'assigned',assigned_at:new Date().toISOString(),created_at:new Date().toISOString(),...payload};assignments.push(row);return send(pack([row]));}
 if(method==='PATCH'){const payload=req.postDataJSON();writes.push({endpoint,method,payload});const selected=filter(assignments);selected.forEach(a=>Object.assign(a,payload));return send(pack(selected));}
 if(method==='DELETE'){const selected=filter(assignments);assignments=assignments.filter(a=>!selected.includes(a));return send(null);}
 return send(pack(filter(assignments)));
}
return send([]);
});
const expires=Math.floor(Date.now()/1000)+3600;
const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({sub:profile.id,exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),'fixture'].join('.');
await context.addInitScript(({key,value})=>{localStorage.setItem(key,JSON.stringify(value));localStorage.setItem('hatsoff-theme','light');},{key:`sb-${backend.hostname.split('.')[0]}-auth-token`,value:{access_token:token,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user:{...profile,aud:'authenticated'}}});
const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));return {context,page};
}
let current;
try{
current=await session(profiles[0]);let page=current.page;
await page.goto(origin+'/task-assignments');await page.getByRole('button',{name:'Assign Task',exact:true}).click();
await page.locator('#assignment-task').selectOption(id(400));await page.locator('#assignment-employee').selectOption(id(202));
await page.locator('form').getByRole('button',{name:'Assign Task',exact:true}).click();
await page.locator('#assignment-task').waitFor({state:'hidden'});assert.equal(assignments[0].employee_id,id(202));
results.push({check:'Assign task to Worker A through form',pass:true,payload:writes.at(-1)});
await page.screenshot({path:'test-artifacts/audit-assignment-created.png',fullPage:true});
const worker=await session(profiles[1]);await worker.page.goto(origin+'/my-work');await worker.page.getByText('Audit Assigned Task',{exact:true}).filter({visible:true}).first().waitFor();
results.push({check:'Worker A My Work displays task in second session',pass:true});await worker.page.screenshot({path:'test-artifacts/audit-worker-my-work.png',fullPage:true});await worker.context.close();
await page.goto(origin+'/tasks');await page.getByText('Audit Assigned Task',{exact:true}).filter({visible:true}).first().waitFor();
await writeFile('test-artifacts/audit-tasks-dom.txt',await page.locator('body').innerText());
await page.getByRole('button',{name:'Table',exact:true}).click();
let edit=page.getByRole('button',{name:'Edit',exact:true});if(!await edit.count())edit=page.getByRole('button',{name:'Edit Audit Assigned Task',exact:true});
await edit.first().click();
const assignmentSection=page.locator('section').filter({has:page.getByText('Assigned To',{exact:true})});
await assignmentSection.locator('select').selectOption(id(203));
await page.getByPlaceholder('e.g. Complete first cut before 4 PM').fill('Reassigned in edit form');
const writesBefore=writes.length;await page.getByRole('button',{name:/Save Changes|Update Task/}).click();
await page.getByPlaceholder('e.g. Complete first cut before 4 PM').waitFor({state:'hidden'});
results.push({check:'Edit task assignee and notes persists',pass:assignments[0].employee_id===id(203),actualAssignee:assignments[0].employee_id,writes:writes.slice(writesBefore)});
await page.reload();await page.getByText('Audit Assigned Task',{exact:true}).filter({visible:true}).first().waitFor();await page.screenshot({path:'test-artifacts/audit-task-after-edit.png',fullPage:true});
await page.goto(origin+'/task-assignments');await page.getByTitle('Edit assignment',{exact:true}).filter({visible:true}).first().click();
await page.locator('#edit-assignment-employee').selectOption(id(203));await page.getByRole('button',{name:'Save Changes',exact:true}).click();await page.locator('#edit-assignment-employee').waitFor({state:'hidden'});
results.push({check:'Dedicated Edit Assignment reassigns to Worker B',pass:assignments[0].employee_id===id(203)});
for(const n of [1,2]){const w=await session(profiles[n]);await w.page.goto(origin+'/my-work');await w.page.getByRole('heading',{name:'My Work',exact:true}).waitFor();await w.page.waitForTimeout(500);results.push({check:`Worker ${n===1?'A revocation':'B receipt'} after reassignment`,visibleTask:await w.page.getByText('Audit Assigned Task',{exact:true}).filter({visible:true}).count()});await w.context.close();}
await page.goto(origin+'/reports');await page.getByRole('heading',{name:'Executive Reports & Insights',exact:true}).waitFor();await page.waitForTimeout(400);await writeFile('test-artifacts/audit-populated-reports-dom.txt',await page.locator('main').innerText());
await page.screenshot({path:'test-artifacts/audit-populated-reports.png',fullPage:true});
await current.context.close();
current=await session(profiles[3]);page=current.page;await page.goto(origin+'/projects');await page.getByRole('heading',{name:'Project overview',exact:true}).waitFor();
results.push({check:'Team lead manager RPC enables New project',pass:await page.getByRole('button',{name:'New project',exact:true}).count()===1});
await current.context.close();
current=await session(profiles[0]);page=current.page;await page.goto(origin+'/dashboard');await page.getByText('Your studio, in focus',{exact:false}).waitFor();await page.getByRole('button',{name:'Switch to dark mode'}).click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);
results.push({check:'Dashboard dark mobile overflow after layout settles',metrics:await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2).slice(0,8).map(e=>({tag:e.tagName,class:e.className,right:e.getBoundingClientRect().right}))}))});
await page.screenshot({path:'test-artifacts/audit-dashboard-dark-mobile.png',fullPage:true});
}catch(e){results.push({check:'Harness interruption',error:e.message});if(current){await writeFile('test-artifacts/audit-assignment-failure-dom.txt',await current.page.locator('body').innerText());await current.page.screenshot({path:'test-artifacts/audit-assignment-failure.png',fullPage:true});}}
finally{results.push({check:'Browser runtime errors',errors});await writeFile('test-artifacts/audit-assignment-browser.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();}



if(results.some(r=>r.pass===false || r.error || (r.errors && r.errors.length) || (r.metrics && r.metrics.scroll>r.metrics.width))) throw new Error('Assignment regression failed');
if(results.find(r=>r.check==='Worker A revocation after reassignment')?.visibleTask!==0 || results.find(r=>r.check==='Worker B receipt after reassignment')?.visibleTask!==1) throw new Error('Assignment visibility regression failed');
