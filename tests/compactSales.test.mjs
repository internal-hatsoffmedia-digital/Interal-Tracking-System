import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsx from 'react/jsx-runtime';
import * as icons from 'lucide-react';
const compile=path=>ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const metrics={};vm.runInNewContext(compile('src/lib/projectFinanceMetrics.ts'),{exports:metrics,Intl,Date});
const component=compile('src/pages/sales/ProjectFinanceDashboard.tsx');
const leaf=name=>()=>React.createElement('section',{'data-report':name},name);
function render(view='overview',mode='sales'){
 let index=0;const loaded={userId:'u::admin:'+mode,data:{projects:[],items:[],clients:[],teams:[]}};
 const hooks={...React,useEffect(){},useCallback:f=>f,useState:initial=>{const i=index++;return [i===0?loaded:i===5?false:i===10?view:typeof initial==='function'?initial():initial,()=>{}];}};
 const modules={'react':hooks,'react/jsx-runtime':jsx,'lucide-react':icons,
 '../../context/AuthContext':{useAuth:()=>({profile:{id:'u',is_active:true,role:'admin'}})},
 '../../hooks/useSalesCreditDirectory':{useSalesCreditDirectory:()=>({data:{people:[],credits:[]},loading:false,error:''})},
 '../../services/sales/projectFinance.service':{},'../../lib/projectFinanceMetrics':metrics,
 '../../lib/projectMetrics':{},'../../components/tracker/trackerData':{},
 './EmployeeSalesReport':{default:leaf('employee report')},'./EmployeeSalesCredits':{default:leaf('credit allocations')},
 './RevenueBreakdown':{default:leaf('revenue breakdown')},'./ProjectFinanceCharts':{default:leaf('charts')},
 './ProjectRates':{default:leaf('project rates')},
 './SalesResults':{default:({children})=>children(100)},'./projectFinance.css':{}};
 const exports={};vm.runInNewContext(component,{exports,require:n=>{assert.ok(n in modules,n);return modules[n]?.default ? {__esModule:true,...modules[n]} : modules[n];}});
 return renderToStaticMarkup(React.createElement(exports.default,{mode}));
}
test('Sales overview opens with totals and keeps other reports separate',()=>{
 const html=render();
 assert.match(html,/Completed sales/);assert.match(html,/aria-label="Sales views"/);
 assert.doesNotMatch(html,/data-report="employee report"|data-report="project rates"|Charges &amp; expenses<\/h2>/);
 assert.match(html,/<details[^>]*><summary>Revenue charts/);assert.doesNotMatch(html,/<details[^>]* open/);
});
test('Sales views isolate employee, project and cost reports',()=>{
 const employees=render('employees'),projects=render('projects'),entries=render('entries');
 assert.match(employees,/data-report="employee report"/);assert.doesNotMatch(employees,/Completed sales|data-report="project rates"/);
 assert.match(projects,/data-report="project rates"/);assert.doesNotMatch(projects,/Completed sales|data-report="employee report"/);
 assert.match(entries,/Charges &amp; expenses<\/h2>/);assert.doesNotMatch(entries,/Completed sales|data-report="project rates"/);
});
test('Project cost view retains its summary and financial entry panels',()=>{
 const html=render('overview','costs');assert.match(html,/Completed sales/);assert.match(html,/data-report="project rates"/);assert.match(html,/Charges &amp; expenses<\/h2>/);assert.doesNotMatch(html,/aria-label="Sales views"/);
});
