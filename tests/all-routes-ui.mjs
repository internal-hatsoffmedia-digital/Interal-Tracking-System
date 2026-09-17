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
 if(endpoint==='profiles')return send(route.request().headers().accept?.includes('object+json') ? {...accounts[0],role,created_at:'2026-09-01T00:00:00Z'} : url.searchParams.has('id') ? [accounts[0]] : accounts);
 if(endpoint==='admin_access_directory')return send({accounts,teams});
 if(endpoint==='admin_set_access'){saved=route.request().postDataJSON();Object.assign(accounts.find(a=>a.id===saved.p_account),{role:saved.p_role,team_id:saved.p_team,sales_access:saved.p_sales});return send(null);}
 if(endpoint==='workspace_access_context')return send({can_manage_projects:role==='admin',coordinator_lead:false});
 return send([]);
 });
 const expires=Math.floor(Date.now()/1000)+3600;const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id(1),exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),'fixture'].join('.');
 await context.addInitScript(({key,session})=>{localStorage.setItem(key,JSON.stringify(session));localStorage.setItem('hatsoff-theme','light');},{key:`sb-${backend.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user:{id:id(1),aud:'authenticated',email:'fixture@example.test'}}});

 const routes=['/dashboard','/teams','/employees','/clients','/projects','/tasks','/my-work','/planner','/timesheet','/performance','/reports','/settings','/sales','/task-assignments'];
 const results=[];
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:1000});
  for(const route of routes) {
   await page.goto(origin+route);
   await page.locator('main').waitFor();
   await page.getByRole('button',{name:'Sign out',exact:false}).count();
   await page.waitForTimeout(650);
   const body=await page.locator('body').innerText();
   assert.ok(!body.includes('Something went wrong') && !body.includes('This page could not load'),route+' error state: '+body);
   assert.ok(body.length>100,route+' empty page');
   assert.equal(new URL(page.url()).pathname,route,route+' unexpected redirect');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   const filename=`test-artifacts/route-${route.slice(1)}-${width}.png`;
   await page.screenshot({path:filename,fullPage:true});
   results.push({route,width,overflow,headings:await page.locator('h1,h2').allTextContents()});
   console.log(JSON.stringify(results.at(-1)));
  }
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(results.filter(r=>r.overflow),[],'Horizontal overflow');
 console.log('PASS all 14 protected routes at desktop and mobile sizes (mocked admin, empty data).');
 await context.close();
 const publicContext=await browser.newContext(); const publicPage=await publicContext.newPage();
 publicPage.on('pageerror',e=>errors.push(e.message));
 await publicPage.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 for(const width of [1440,390]){
  await publicPage.setViewportSize({width,height:1000});
  for(const route of ['/','/login','/reset-password']){
   await publicPage.goto(origin+route); await publicPage.locator('h1').waitFor({state:'attached'}); if(route==='/login')await publicPage.getByRole('button',{name:'Sign In',exact:true}).waitFor();
   assert.equal(await publicPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,route+' public overflow');
   await publicPage.screenshot({path:`test-artifacts/public-${route.slice(1)||'landing'}-${width}.png`,fullPage:true});
  }
 }
 await publicPage.goto(origin+'/employees'); await publicPage.waitForURL('**/login');
 assert.deepEqual(errors,[]); console.log('PASS public landing/login/reset at desktop/mobile and unauthenticated route guard.');
 await publicContext.close();
} finally {await browser.close();}
