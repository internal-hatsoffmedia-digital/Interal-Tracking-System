import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

function harness(){
 const states=[],refs=[],deps=[],cleanups=[];let cursor=0,dirty=false,effects=[],tree;
 const react={useState:init=>{const i=cursor++;if(!(i in states))states[i]=init;return [states[i],next=>{const value=typeof next==='function'?next(states[i]):next;if(value!==states[i]){states[i]=value;dirty=true;}}];},useRef:init=>{const i=cursor++;return refs[i]??={current:init};},useEffect:(fn,d)=>{const i=cursor++;if(!deps[i]||d.some((v,k)=>v!==deps[i][k])){deps[i]=d;effects.push(()=>{cleanups[i]?.();cleanups[i]=fn();});}},useMemo:(fn)=>{cursor++;return fn();}};
 const exports={};const code=ts.transpileModule(readFileSync('src/components/tasks/TaskForm.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,console,document:{body:{style:{overflow:''}}},window:{addEventListener(){},removeEventListener(){}},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:new Proxy({},{get:()=>()=>null})});
 const options=()=>[{value:'shorts_reels',label:'Shorts'},{value:'whisk',label:'Whisk'}];
 let props={open:true,task:null,loading:false,error:'',clients:[],projects:[],employees:[],categoryOptions:options(),revisionStatusOptions:[{value:'new_file',label:'New'}],priorityOptions:[{value:'high',label:'High'}],statusOptions:[{value:'not_started',label:'Not started'}],onClose(){},async onSubmit(){}};
 function render(changes={}){props={...props,...changes};let turns=0;do{assert.ok(turns++<20);dirty=false;cursor=0;tree=exports.default(props);const queued=effects;effects=[];queued.forEach(fn=>fn());}while(dirty);return tree;}
 const nodes=()=>{const all=[];function visit(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(visit);return;}if(v.type){all.push(v);visit(v.props?.children);}}visit(tree);return all;};
 const title=()=>nodes().find(n=>n.props?.placeholder==='e.g. Episode 101 — Final Edit');
 return {render,nodes,title,refresh(){render({categoryOptions:options(),revisionStatusOptions:[...props.revisionStatusOptions],priorityOptions:[...props.priorityOptions],statusOptions:[...props.statusOptions],projects:[...props.projects]});}};
}
test('task draft survives focus/session parent renders and refreshed dropdown data',()=>{
 const h=harness();h.render();h.title().props.onChange({target:{value:'Unsaved coordinator work'}});h.render();
 const category=h.nodes().find(n=>n.type==='select'&&n.props.value==='shorts_reels');category.props.onChange({target:{value:'whisk'}});h.render();
 h.refresh();h.refresh();assert.equal(h.title().props.value,'Unsaved coordinator work');assert.ok(h.nodes().some(n=>n.type==='select'&&n.props.value==='whisk'));
 h.render({open:false});h.render({open:true});assert.equal(h.title().props.value,'');
});
test('editing same refreshed task preserves changes while another task initializes correctly',()=>{
 const h=harness();const task={id:'one',title:'Original',category:'whisk'};h.render({task});assert.equal(h.title().props.value,'Original');
 h.title().props.onChange({target:{value:'My unsaved edit'}});h.render();h.render({task:{...task,title:'Background result'}});h.refresh();assert.equal(h.title().props.value,'My unsaved edit');
 h.render({task:{...task,id:'two',title:'Another task'}});assert.equal(h.title().props.value,'Another task');
});
