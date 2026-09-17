// Intercepts all remote traffic: no live login, sales records, or database writes.
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin=process.env.TEST_APP_URL || 'http://127.0.0.1:5173';
const env=await readFile(new URL('../.env',import.meta.url),'utf8');
const backend=new URL(env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir(new URL('../test-artifacts/',import.meta.url),{recursive:true});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let access='admin';let savedAccess;
  const people=[{id:id(1),full_name:'Admin',access_level:'admin'},{id:id(2),full_name:'Sales owner',access_level:'member'},{id:id(3),full_name:'Reviewer',access_level:null}];
  const leads=[];const activities=[];const targets=[];
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin)return route.continue();
    if(url.origin!==backend.origin)return route.fulfill({status:200,body:''});
    const send=data=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
    const rpc=url.pathname.split('/').at(-1);const payload=route.request().method()==='POST'?route.request().postDataJSON():null;
    if(url.pathname==='/auth/v1/user')return send({id:id(1),aud:'authenticated',role:'authenticated',email:'fixture@example.test'});
    if(rpc==='profiles')return send({id:id(1),full_name:'Admin',role:'admin',is_active:true,team_id:id(100)});
    if(rpc==='sales_my_access')return send(access);
    if(rpc==='sales_people')return send(people);
    if(rpc==='sales_leads')return send(leads);
    if(rpc==='sales_targets')return send(targets);
    if(rpc==='sales_activities')return send(activities);
    if(rpc==='sales_save_lead') {
      assert.ok(payload.p_input.name);
      let row=leads.find(l=>l.id===payload.p_id);
      if(!row){row={id:id(10),created_at:'2026-09-05T10:00:00Z'};leads.push(row);}
      Object.assign(row,payload.p_input,{updated_at:new Date().toISOString(),won_at:payload.p_input.stage==='won'?'2026-09-05T10:00:00Z':null});
      return send(row.id);
    }
    if(rpc==='sales_log_activity') {
      assert.equal(payload.p_kind,'call');
      activities.push({id:id(20),lead_id:payload.p_lead_id,actor_id:id(1),kind:payload.p_kind,notes:payload.p_notes,occurred_at:'2026-09-05T10:00:00Z'});
      leads[0].next_follow_up=payload.p_follow_up;return send(null);
    }
    if(rpc==='sales_set_target'){targets.splice(0,targets.length,{month:payload.p_month,amount:payload.p_amount});return send(null);}
    if(rpc==='sales_grant_access'){savedAccess=payload;people[2].access_level=payload.p_access_level;return send(null);}
    if(rpc==='projects') {
      if(url.searchParams.get('select')?.includes('project_members'))return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'PGRST200',message:"Could not find a relationship between 'projects' and 'project_members'"})});
      return send([{id:id(50),name:'Existing client project',client:{name:'Actual schema client'},lead_employee:{full_name:'Recorded lead'},status:'planning',completed_assets:2,total_assets_required:10,target_deadline:'2026-10-01'}]);
    }
    if(rpc==='project_notifications')return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({code:'PGRST205',message:'Not installed'})});
    return send([]);
  });
  const expires=Math.floor(Date.now()/1000)+3600;
  const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id(1),exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),'fixture'].join('.');
  await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${backend.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user:{id:id(1),aud:'authenticated',email:'fixture@example.test'}}});
  await page.goto(`${origin}/projects`);
  await page.getByRole('heading',{name:'Existing projects',exact:true}).waitFor();
  await page.getByText('Existing client project',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'New project',exact:true}).count(),0);
  await page.getByRole('link',{name:'Sales Tracker',exact:true}).click();
  await page.getByRole('button',{name:'Add lead',exact:true}).click();
  await page.getByLabel('Lead name',{exact:true}).fill('New sales opportunity');
  await page.getByLabel('Company',{exact:true}).fill('Example company');
  await page.locator('select[name=owner_id]').selectOption(id(2));
  await page.getByLabel('Deal value (INR)',{exact:true}).fill('1200');
  await page.getByRole('button',{name:'Save lead',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(leads.length,1);assert.equal(leads[0].owner_id,id(2));
  await page.getByLabel('Open lead details',{exact:true}).selectOption(id(10));
  await page.locator('select[name=stage]').selectOption('won');
  await page.getByRole('button',{name:'Save lead',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});assert.ok(leads[0].won_at);
  await page.getByLabel('Open lead details',{exact:true}).selectOption(id(10));
  await page.getByLabel('Activity notes',{exact:true}).fill('Confirmed scope by phone');
  await page.getByLabel('Next follow-up date',{exact:true}).fill('2026-10-01');
  await page.getByRole('button',{name:'Record activity',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(activities.length,1);
  await page.getByLabel('Revenue target (INR)',{exact:true}).fill('5000');
  await page.getByRole('button',{name:'Save target',exact:true}).click();
  await page.getByText('₹5,000',{exact:true}).waitFor();
  await page.getByLabel('Verified account').selectOption(id(3));
  await page.getByLabel('Access',{exact:false}).last().selectOption('viewer');
  await page.getByRole('button',{name:'Save access',exact:true}).click();
  await page.getByRole('button',{name:'Add lead',exact:true}).waitFor();assert.equal(savedAccess.p_access_level,'viewer');
  await page.getByText('Loading sales…',{exact:true}).waitFor({state:'hidden'});
  await page.getByRole('heading',{name:'Sales administration',exact:true}).waitFor();
  await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/sales-connected-desktop.png',import.meta.url)),fullPage:true,animations:'disabled'});
  access='viewer';await page.getByRole('button',{name:'Refresh sales'}).click();
  await page.getByRole('button',{name:'Add lead',exact:true}).waitFor({state:'hidden'});
  await page.getByLabel('Open lead details',{exact:true}).selectOption(id(10));
  await page.getByRole('heading',{name:'Lead details',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Save lead',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Record activity',exact:true}).count(),0);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  assert.deepEqual(errors,[]);console.log('PASS sales browser: legacy admin projects, create/edit/convert, activity, targets, access grants, viewer controls');
  await context.close();
}finally{await browser.close();}
