import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import * as jsx from 'react/jsx-runtime';
const exported={};const source=ts.transpileModule(readFileSync('src/pages/sales/SalesResults.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(source,{exports:exported,require:n=>n==='react'?React:n==='react/jsx-runtime'?jsx:null});
test('a Sales section renders filters guidance without constructing result tables on first load',()=>{
 let rendered=0;const html=renderToStaticMarkup(React.createElement(exported.default,{filterKey:'October:all',count:1000,children:()=>{rendered++;return React.createElement('table',null,React.createElement('tbody'));}}));
 assert.equal(rendered,0);assert.ok(!html.includes('<table'));assert.ok(html.includes('Show results'));assert.ok(html.includes('Choose your filters'));
});
test('existing non-Sales cost views can display results without an apply step',()=>{
 const html=renderToStaticMarkup(React.createElement(exported.default,{filterKey:'costs',requireApply:false,children:()=>React.createElement('p',null,'Cost results')}));assert.ok(html.includes('Cost results'));assert.ok(!html.includes('Show results'));
});
