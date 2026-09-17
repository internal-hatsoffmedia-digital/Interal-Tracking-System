// Browser integration checks with intercepted Supabase responses. Never contacts the live backend.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin=process.env.TEST_APP_URL || 'http://127.0.0.1:5173';
const env=await readFile(new URL('../.env',import.meta.url),'utf8');
const backend=new URL(env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const team=id(100);
const people=[['Muskan','associate_lead'],['Lavanya','project_coordinator'],['Esther','project_coordinator'],['Kamalesh','team_lead'],['Veena','director']].map(([full_name,role],i)=>({id:id(i+1),full_name,role,team_id:team,is_active:true}));
const project=(n,assignee,status='in_progress')=>({id:id(300+n),name:n===1?'Brand launch':'Documentary edit',client_id:id(90),client:{id:id(90),name:'Example client',short_name:'EX'},description:'A project used only for browser verification.',team_id:team,
  status,health:'on_track',invoice_status:'pending_billing',created_by:id(1),assigned_by:id(1),assigned_at:'2026-09-01T09:00:00Z',associate_assigned:true,lead_employee_id:id(200+assignee),lead_employee:null,
  project_members:[{project_id:id(300+n),profile_id:id(assignee),access_kind:'assignee',granted_by:id(1),granted_at:'2026-09-01T09:00:00Z'}],
  total_assets_required:10,completed_assets:3,pending_assets:7,start_date:'2026-09-01',target_deadline:n===1?'2026-09-10':null,is_active:true,created_at:'2026-09-01T09:00:00Z',updated_at:'2026-09-02T09:00:00Z'});
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir(new URL('../test-artifacts/',import.meta.url),{recursive:true});
try {
  for (const role of ['associate_lead','project_coordinator','director']) {
    const profile=people.find(p=>p.role===role);
    const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    let rows=role==='project_coordinator'?[project(1,2)]:[project(1,2),project(2,3,'on_hold')];
    let saved=null;
    let setupMissing=false;
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin===origin)return route.continue();
      if(url.origin!==backend.origin)return route.fulfill({status:200,body:''});
      const send=data=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
      if(url.pathname==='/auth/v1/user')return send({id:profile.id,email:'fixture@example.test',aud:'authenticated',role:'authenticated'});
      if(url.pathname.endsWith('/profiles'))return send({...profile,email:'fixture@example.test'});
      if(url.pathname.endsWith('/rpc/workspace_access_context'))return send({can_manage_projects:role==='associate_lead',coordinator_lead:role==='associate_lead'});
      if(url.pathname.endsWith('/rpc/project_people'))return send(people);
      if(url.pathname.endsWith('/rpc/sales_my_access'))return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({code:'PGRST202',message:'Sales migration not installed'})});
      if(url.pathname.endsWith('/rpc/set_project_access')){saved=route.request().postDataJSON();return send(null);}
      if(url.pathname.endsWith('/project_activity'))return send([{id:id(500),actor_id:id(1),action:'Project assignments updated',details:{assignees:[id(2)]},created_at:'2026-09-01T09:00:00Z'}]);
      if(url.pathname.endsWith('/project_notifications'))return send([{id:id(600),project_id:id(301),message:'Project assigned: Brand launch',created_at:'2026-09-01T09:00:00Z',read_at:null}]);
      if(url.pathname.endsWith('/projects'))return setupMissing ? route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'PGRST200',message:"Could not find a relationship between 'projects' and 'project_members' in the schema cache"})}) : send(rows);
      if(url.pathname.endsWith('/clients'))return send([{id:id(90),name:'Example client',short_name:'EX',is_active:true}]);
      if(url.pathname.endsWith('/employees'))return send(people.map((p,i)=>({id:id(201+i),profile_id:p.id,full_name:p.full_name,team_id:team,employee_code:`EMP${i}`,is_active:true})));
      if(url.pathname.endsWith('/teams'))return send([{id:team,name:'Production'}]);
      return send([]);
    });
    const expires=Math.floor(Date.now()/1000)+3600;
    const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:profile.id,exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),'fixture'].join('.');
    await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{
      key:`sb-${backend.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user:{id:profile.id,aud:'authenticated',email:'fixture@example.test'}}});
    await page.goto(`${origin}/projects`);
    await page.getByRole('button',{name:'Brand launch',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'New project',exact:true}).count(),role==='associate_lead'?1:0);
    assert.equal(await page.getByRole('button',{name:'Edit details',exact:true}).count(),role==='director'?0:rows.length);
    await page.getByLabel('Search',{exact:true}).fill('no matching project');
    await page.getByText('No accessible projects match these filters.').waitFor();
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.getByRole('button',{name:'Brand launch',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    assert.equal(await page.getByRole('button',{name:'Save assignments & sharing'}).count(),role==='associate_lead'?1:0);
    if(role==='associate_lead'){
      assert.equal(await page.getByRole('group',{name:'Current assignees',exact:true}).getByRole('checkbox').count(),2);
      assert.equal(await page.getByRole('group',{name:'Current assignees',exact:true}).getByRole('checkbox',{name:/Muskan/}).count(),0);
      const bounds=await page.getByRole('dialog').boundingBox();assert.ok(bounds.y>=0 && bounds.y+bounds.height<=1000);
      await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/coordinator-dialog-light.png',import.meta.url)),animations:'disabled'});
      await page.getByRole('button',{name:'Close',exact:true}).click();
      await page.getByRole('button',{name:'Switch to dark mode'}).click();
      await page.getByRole('button',{name:'Brand launch',exact:true}).click();
      await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/coordinator-dialog-dark.png',import.meta.url)),animations:'disabled'});

      await page.getByRole('group',{name:'Shared with',exact:true}).getByRole('checkbox',{name:/Esther/}).check();
      const refreshed=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/projects'));
      await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
      await refreshed;
      assert.equal(await page.getByRole('group',{name:'Shared with',exact:true}).getByRole('checkbox',{name:/Esther/}).isChecked(),true);
      await page.getByRole('button',{name:'Save assignments & sharing'}).click();
      await page.getByRole('dialog').waitFor({state:'hidden'});
      assert.deepEqual(saved.p_shared,[id(3)]);assert.deepEqual(saved.p_assignees,[id(2)]);
    }else await page.getByRole('button',{name:'Close',exact:true}).click();
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'Export CSV',exact:true}).click();
    assert.equal((await download).suggestedFilename(),'project-report.csv');
    await page.getByRole('button',{name:'Project notifications',exact:true}).click();
    await page.getByRole('button',{name:/Project assigned: Brand launch/}).waitFor();
    await page.getByRole('button',{name:'Close notifications'}).click();
    await page.screenshot({path:fileURLToPath(new URL(`../test-artifacts/projects-${role}.png`,import.meta.url)),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Brand launch',exact:true}).click();
    const mobileBounds=await page.getByRole('dialog').boundingBox();assert.ok(mobileBounds.y>=0 && mobileBounds.y+mobileBounds.height<=844);
    await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/coordinator-dialog-mobile.png',import.meta.url)),animations:'disabled'});
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile page overflows');
    await page.screenshot({path:fileURLToPath(new URL(`../test-artifacts/projects-${role}-mobile.png`,import.meta.url)),fullPage:true});
    // Revocation on refresh must remove details and counts, rather than expose cached records.
    rows=[];
    await page.getByRole('button',{name:'Refresh',exact:true}).click();
    await page.getByText('No accessible projects match these filters.').waitFor();
    setupMissing=true;
    await page.getByRole('button',{name:'Refresh',exact:true}).click();
    await page.getByRole('heading',{name:'Project access setup is incomplete'}).waitFor();
    assert.equal(await page.getByText('Total',{exact:true}).count(),0,'Failed loading must not display zero totals');
    assert.equal(await page.getByRole('button',{name:'Export CSV',exact:true}).count(),0);
    setupMissing=false;
    await page.getByRole('button',{name:'Retry',exact:true}).click();
    await page.getByText('No accessible projects match these filters.').waitFor();
    assert.deepEqual(errors,[]);
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole('link',{name:'Sales Tracker',exact:true}).click();
    await page.getByRole('heading',{name:'Sales Control Center',exact:true}).waitFor();
    await page.getByText(/Sales workspace prepared/).waitFor();
    assert.equal(await page.getByText('865',{exact:true}).count(),0,'PDF example figures must not appear as live data');
    await page.getByRole('button',{name:/Outbound Cold calls/}).click();
    await page.getByRole('heading',{name:'Lead Master',exact:true}).waitFor();
    await page.getByText('Channel: Outbound').waitFor();
    for(const section of ['Prospects','Follow-ups','Conversions','Team Performance']) {
      await page.getByRole('button',{name:section,exact:true}).click();
      await page.getByRole('heading',{name:section==='Team Performance'?'Team performance':section,exact:true}).waitFor();
    }
    await page.getByRole('button',{name:'Control Center',exact:true}).click();
    if(role==='associate_lead') {
      await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/sales-desktop.png',import.meta.url)),fullPage:true});
      await page.setViewportSize({width:390,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'sales mobile page overflows');
      await page.screenshot({path:fileURLToPath(new URL('../test-artifacts/sales-mobile.png',import.meta.url)),fullPage:true,animations:'disabled'});
    }
    await context.close();
    console.log(`PASS browser ${role}: visibility controls, filters, details, notifications, CSV, mobile, revocation`);
  }
}finally{await browser.close();}
