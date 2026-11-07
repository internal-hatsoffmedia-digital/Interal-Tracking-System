import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsx from 'react/jsx-runtime';
import * as icons from 'lucide-react';
const compile=p=>ts.transpileModule(readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const links={};vm.runInNewContext(compile('src/lib/clientLinks.ts'),{exports:links,URL});
test('social URL normalization and source options reject unsafe input',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(links.clientSocialPatch({facebook_link:' https://facebook.com/example ',instagram_link:''}))),{facebook_link:'https://facebook.com/example',instagram_link:null});
 assert.throws(()=>links.clientSocialPatch({youtube_link:'javascript:alert(1)'}),/YouTube Link/);
 assert.equal(links.validLeadSource('campaign'),true);assert.equal(links.validLeadSource('cold_call'),true);assert.equal(links.validLeadSource(null),true);assert.equal(links.validLeadSource('other'),false);
});
const client={id:'c',name:'Example Client',lead_source:'campaign',facebook_link:'https://facebook.com/example',instagram_link:'https://instagram.com/example',youtube_link:'https://youtube.com/@example',phone:'123',email:'person@example.test',notes:'Client notes',is_active:true,created_at:'2026-11-07T09:00:00Z',updated_at:'2026-11-07T09:00:00Z'};
function load(path,extra={}){
 const exports={};const modules={'react':React,'react/jsx-runtime':jsx,'lucide-react':icons,'../../lib/clientLinks':links,'../../lib/assignmentTime':{formatAssignmentTime:x=>x},'../layouts/WorkspaceDialog':{__esModule:true,default:({children})=>React.createElement('section',null,children)},...extra};
 vm.runInNewContext(compile(path),{exports,require:n=>{assert.ok(n in modules,n);return modules[n];}});return exports;
}
test('client preview shows complete contact, source and social details with safe outbound links',()=>{
 const {ClientPreviewContent}=load('src/components/clients/ClientPreview.tsx');
 const html=renderToStaticMarkup(React.createElement(ClientPreviewContent,{client}));
 for(const label of ['Campaign','FB Link','Insta Link','YouTube Link','Client notes','123'])assert.ok(html.includes(label),label);
 assert.match(html,/rel="noreferrer"/);
 const unsafe=renderToStaticMarkup(React.createElement(ClientPreviewContent,{client:{...client,youtube_link:'javascript:alert(1)'}}));assert.doesNotMatch(unsafe,/javascript:/);
});
test('client list has an editable source and Preview action without social link columns',()=>{
 const {default:Table}=load('src/components/clients/ClientTable.tsx');
 const html=renderToStaticMarkup(React.createElement(Table,{clients:[client],onEdit(){},onPreview(){},onToggleStatus(){},onSourceChange(){}}));
 assert.match(html,/Lead source for Example Client/);assert.match(html,/Preview Example Client/);
 assert.match(html,/value="campaign" selected/);assert.doesNotMatch(html,/FB Link|Insta Link|YouTube Link/);
 assert.doesNotMatch(html,/<tr[^>]*>\s*<label/);
});
