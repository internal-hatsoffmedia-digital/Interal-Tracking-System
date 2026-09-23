// All remote requests are intercepted. No live account or permission changes.
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='http://127.0.0.1:5173';const env=await readFile(new URL('../.env',import.meta.url),'utf8');const backend=new URL(env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const accounts=[['Admin','admin',100],['Muskan','associate_lead',100],['Ganesh','associate_lead',101],['Sudeesh','associate_lead',102],['Vijay','associate_lead',103],['Janani','associate_lead',104],['Lavanya','project_coordinator',100],['Esther','project_coordinator',100]].map(([full_name,role,team],i)=>({id:id(i+1),full_name,role,team_id:id(team),email:`person${i}@example.test`,is_active:true,sales_access:null}));
const teams=['Project Coordinators','Creative Clan','Cut Masters','Web Development','Digital Ninjas'].map((name,i)=>({id:id(100+i),name}));
const browser=await chromium.launch({channel:'chrome',headless:true});await mkdir(new URL('../test-artifacts/',import.meta.url),{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let role='admin';let saved;let employeeRows=[];let teamRows=[];const authAccount={id:id(90),email:'qa-new@example.test',full_name:'New login',team_id:null,is_active:true};
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin===origin)return route.continue();if(url.origin!==backend.origin)return route.fulfill({status:200,body:''});
 const send=x=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(x)});const endpoint=url.pathname.split('/').at(-1);
 if(endpoint==='admin_team_accounts')return send([authAccount]);
 if(endpoint==='admin_save_auth_employee'){const b=route.request().postDataJSON();assert.equal(b.p_account,authAccount.id);authAccount.full_name=b.p_name;employeeRows=[{id:id(290),profile_id:authAccount.id,full_name:b.p_name,email:authAccount.email,employee_code:'QA-90',is_active:true,team_id:authAccount.team_id,teams:null}];return send(null);}
 if(endpoint==='admin_assign_team_account'){const b=route.request().postDataJSON();assert.equal(b.p_account,authAccount.id);authAccount.team_id=b.p_team;employeeRows[0].team_id=b.p_team;return send(null);}
 if(endpoint==='employees')return send(employeeRows);
 if(endpoint==='teams'){if(route.request().method()==='POST'){const b=route.request().postDataJSON();teamRows.push({...b,id:id(190)});return send(teamRows.at(-1));}return send(teamRows);}
 if(endpoint==='user')return send({id:id(1),email:'fixture@example.test',aud:'authenticated',role:'authenticated'});
 if(endpoint==='profiles')return send(route.request().headers().accept?.includes('object+json') ? {...accounts[0],role,created_at:'2026-09-01T00:00:00Z'} : url.searchParams.has('id') ? [accounts[0]] : accounts);
 if(endpoint==='admin_access_directory')return send({accounts,teams});
 if(endpoint==='admin_set_access'){saved=route.request().postDataJSON();Object.assign(accounts.find(a=>a.id===saved.p_account),{role:saved.p_role,team_id:saved.p_team,sales_access:saved.p_sales});return send(null);}
 if(endpoint==='workspace_access_context')return send({can_manage_projects:role==='admin',coordinator_lead:false});
 return send([]);
 });
 const expires=Math.floor(Date.now()/1000)+3600;const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id(1),exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),'fixture'].join('.');
 await context.addInitScript(({key,session})=>{localStorage.setItem(key,JSON.stringify(session));localStorage.setItem('hatsoff-theme','light');},{key:`sb-${backend.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user:{id:id(1),aud:'authenticated',email:'fixture@example.test'}}});


 await page.goto(origin+'/employees');await page.getByRole('button',{name:'Add Employee',exact:true}).click();
 await page.locator('#auth-email').selectOption(authAccount.id);await page.locator('#auth-name').fill('QA New Employee');await page.getByRole('button',{name:'Save Employee',exact:true}).click();
 await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(employeeRows.length,1);
 await page.getByRole('table').getByText('QA New Employee',{exact:true}).waitFor();
 await page.goto(origin+'/teams');await page.getByRole('button',{name:'Add Team',exact:true}).click();await page.locator('#team-name').fill('QA Testing Team');await page.locator('#team-type').selectOption('other');await page.getByRole('button',{name:'Create Team',exact:true}).click();
 await page.locator('#team-name').waitFor({state:'hidden'});const form=page.locator('form').filter({has:page.getByRole('heading',{name:'Assign existing user'})});await form.getByRole('combobox').nth(0).selectOption(authAccount.id);await form.getByRole('combobox').nth(1).selectOption(id(190));await form.getByRole('button',{name:'Save team'}).click();await page.getByRole('status').filter({hasText:'Team membership saved'}).waitFor();assert.equal(employeeRows[0].team_id,id(190));await page.reload();await page.getByText('1 member:',{exact:false}).waitFor();
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.screenshot({path:'test-artifacts/admin-team-flow-'+width+'.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);}
 assert.deepEqual(errors,[]);console.log('PASS existing Auth account -> employee name -> new team -> team assignment -> persisted roster (stateful intercepted backend).');
 }finally{await browser.close();}

