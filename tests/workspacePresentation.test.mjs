import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import postcss from 'postcss';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/workspacePresentation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
test('Dashboard and Team PC never receive the presentation refresh, including nested paths',()=>{
 for(const route of ['/dashboard','/dashboard/','/dashboard/projects','/team-pc','/team-pc/','/team-pc/team','/login','/'])assert.equal(exports.isRefreshedWorkspacePage(route),false,route);
 for(const route of ['/reports','/performance','/tasks','/my-work','/projects','/clients','/sales','/sales/projects','/settings'])assert.equal(exports.isRefreshedWorkspacePage(route),true,route);
});
test('every new CSS selector is scoped to the route content marker',()=>{
 const css=postcss.parse(readFileSync('src/styles/workspace-refresh.css','utf8'));
 let count=0;css.walkRules(rule=>{for(const selector of rule.selectors){assert.ok(selector.includes('[data-workspace-refresh=true]'),selector);count++;}});
 assert.ok(count>40);
});
