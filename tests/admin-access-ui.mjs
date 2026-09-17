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
 const context=await browser.newContext({viewport:{width:1440,height:1100}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let role='admin';let saved;
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin===origin)return route.continue();if(url.origin!==backend.origin)return route.fulfill({status:200,body:''});
 const send=x=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(x)});const endpoint=url.pathname.split('/').at(-1);
 if(endpoint==='user')return send({id:id(1),email:'fixture@example.test',aud:'authenticated',role:'authenticated'});
 if(endpoint==='profiles')return send({...accounts[0],role,created_at:'2026-09-01T00:00:00Z'});
 if(endpoint==='admin_access_directory')return send({accounts,teams});
 if(endpoint==='admin_set_access'){saved=route.request().postDataJSON();Object.assign(accounts.find(a=>a.id===saved.p_account),{role:saved.p_role,team_id:saved.p_team,sales_access:saved.p_sales});return send(null);}
 if(endpoint==='workspace_access_context')return send({can_manage_projects:role==='admin',coordinator_lead:false});
 return send([]);
 });
 const expires=Math.floor(Date.now()/1000)+3600;const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id(1),exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),'fixture'].join('.');
 await context.addInitScript(({key,session})=>{localStorage.setItem(key,JSON.stringify(session));localStorage.setItem('hatsoff-theme','light');},{key:`sb-${backend.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user:{id:id(1),aud:'authenticated',email:'fixture@example.test'}}});
 await page.goto(origin+'/settings');await page.getByRole('heading',{name:'Access Management',exact:true}).waitFor();
 const panel=page.getByRole('region',{name:'Admin Access Management'});
 await panel.getByLabel('Filter team',{exact:true}).selectOption(id(103));
 await panel.getByRole('button',{name:/Vijay/}).click();assert.equal(await panel.getByRole('button',{name:/Ganesh/}).count(),0);
 await panel.getByLabel('Filter team',{exact:true}).selectOption('');
 await panel.getByLabel('Account role',{exact:true}).selectOption('associate_lead');
 await panel.getByLabel('Assigned team',{exact:true}).selectOption(id(103));
 await panel.getByLabel('Sales Tracker access',{exact:true}).selectOption('viewer');
 await panel.getByText('Only tasks and worker records for the selected team',{exact:true}).waitFor();
 await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/admin-access-light.png',import.meta.url)),fullPage:true});
 await panel.getByRole('button',{name:'Save access',exact:true}).click();await panel.getByText('Access saved. Team scope is enforced by the database.').waitFor();
 assert.equal(saved.p_account,id(5));assert.equal(saved.p_team,id(103));assert.equal(saved.p_sales,'viewer');assert.equal(saved.p_expected.role,'associate_lead');
 await panel.getByRole('button',{name:/Muskan/}).click();await panel.getByText('Manage coordinator assignments',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/admin-access-dark.png',import.meta.url)),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
 await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/admin-access-mobile.png',import.meta.url)),fullPage:true});
 role='employee';await page.reload();await page.getByRole('heading',{name:'My Profile',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Access Management',exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log('PASS admin access panel: role/team filters, preview, verified account save payload, Sales, dark/mobile, non-admin hidden');await context.close();
}finally{await browser.close();}
