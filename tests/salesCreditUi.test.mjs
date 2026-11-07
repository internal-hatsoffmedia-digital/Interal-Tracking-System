import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import * as jsx from 'react/jsx-runtime';
const source=ts.transpileModule(readFileSync('src/pages/sales/EmployeeSalesCredits.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(confirm=true){
 const calls=[];let index=0;const states=['p','new','1500','','',false];
 const props={projects:[{id:'p',project_code:'HMNOV111',is_active:true,status:'completed',sales_completed_at:'2026-11-07T10:00:00Z',rate:1500}],directory:{people:[{id:'old',name:'Lalith'},{id:'new',name:'Raja Sekar'}],credits:[{project_id:'p',profile_id:'old',name:'Lalith',amount:1500}]}};
 const exports={};const modules={'react':{useState:()=>[states[index++],()=>{}]},'react/jsx-runtime':jsx,'../../lib/supabase':{supabase:{async rpc(name,args){calls.push({name,args});return {error:null};}}},'../../lib/projectFinanceMetrics':{financeMoney:n=>'INR '+n.toFixed(2),isActiveFinanceProject:p=>p.is_active!==false}};
 vm.runInNewContext(source,{exports,require:n=>modules[n],window:{confirm:()=>confirm,dispatchEvent(){}},Event:class {}});
 const tree=exports.default(props);
 const find=(node,text)=>{if(!node||typeof node!=='object')return null;if(node.type==='button'&&node.props.children===text)return node;for(const child of React.Children.toArray(node.props?.children)){const found=find(child,text);if(found)return found;}return null;};
 return {tree,calls,find:text=>find(tree,text)};
}
test('full allocated project disables duplicate shares but offers explicit reassignment',async()=>{
 const f=fixture();assert.equal(f.find('Save share').props.disabled,true);assert.equal(f.find('Reassign full credit').props.disabled,false);
 const html=renderToStaticMarkup(f.tree);assert.match(html,/Edit share/);assert.match(html,/The full rate may already be allocated/);
 await f.find('Reassign full credit').props.onClick();await new Promise(setImmediate);
 assert.equal(f.calls[0].name,'reassign_project_sales_credit');assert.equal(f.calls[0].args.p_profile,'new');assert.equal(f.calls[0].args.p_expected[0].profile_id,'old');
});
test('cancelling reassignment makes no mutation call',async()=>{
 const f=fixture(false);await f.find('Reassign full credit').props.onClick();await new Promise(setImmediate);assert.equal(f.calls.length,0);
});
